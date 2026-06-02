const { User, PendingUser } = require('../models');
const admin = require('../config/firebase');
const mailService = require('./mail.service');

class AuthService {
  /**
   * Synchronize Firebase user details with local MySQL users table
   * @param {Object} userData
   * @param {string} userData.uid
   * @param {string} userData.email
   * @param {string} [userData.name]
   * @param {string} [userData.picture]
   * @returns {Promise<Object>} The synchronized user instance and a flag indicating if it was newly created
   */
  async syncUser({ uid, email, name, picture }) {
    if (!uid || !email) {
      throw new Error('Firebase UID and Email are required for user synchronization.');
    }

    // Try finding the user by their unique firebase_uid
    let user = await User.findOne({ where: { firebaseUid: uid } });
    let isNew = false;

    if (user) {
      // User exists by firebaseUid, check and update details if they have changed
      let hasChanges = false;
      
      if (user.email !== email) {
        user.email = email;
        hasChanges = true;
      }
      if (user.displayName !== name) {
        user.displayName = name;
        hasChanges = true;
      }
      if (picture && user.photoUrl !== picture) {
        user.photoUrl = picture;
        hasChanges = true;
      }

      if (hasChanges) {
        await user.save();
      }
    } else {
      // Check if user already exists with the same email (e.g. login method changed or Firebase user recreated)
      let userByEmail = await User.findOne({ where: { email } });
      
      if (userByEmail) {
        // User exists by email but has a different firebaseUid. Update the firebaseUid and sync details.
        userByEmail.firebaseUid = uid;
        if (name) userByEmail.displayName = name;
        if (picture) userByEmail.photoUrl = picture;
        
        await userByEmail.save();
        user = userByEmail;
      } else {
        // User doesn't exist at all, create a new record
        user = await User.create({
          firebaseUid: uid,
          email,
          displayName: name || null,
          photoUrl: picture || null
        });
        isNew = true;
      }
    }

    return { user, isNew };
  }

  /**
   * Generate OTP, save details temporarily, and send validation email
   */
  async registerPending(name, email, password) {
    if (!name || !email || !password) {
      throw new Error('Họ tên, email và mật khẩu là bắt buộc.');
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email này đã được sử dụng.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save or update pending record
    let pendingUser = await PendingUser.findOne({ where: { email } });
    if (pendingUser) {
      pendingUser.displayName = name;
      pendingUser.password = password;
      pendingUser.otp = otp;
      pendingUser.expiresAt = expiresAt;
      await pendingUser.save();
    } else {
      pendingUser = await PendingUser.create({
        email,
        displayName: name,
        password,
        otp,
        expiresAt
      });
    }

    // Send email
    await mailService.sendOtpEmail(email, otp, name);
    return { success: true, message: 'Mã OTP đã được gửi đến email của bạn.' };
  }

  /**
   * Validate OTP, create Firebase user, sync, and return custom access token
   */
  async verifyOtpAndRegister(email, otp) {
    if (!email || !otp) {
      throw new Error('Email và mã OTP là bắt buộc.');
    }

    const pendingUser = await PendingUser.findOne({ where: { email } });
    if (!pendingUser) {
      throw new Error('Không tìm thấy yêu cầu xác thực cho email này.');
    }

    // Verify OTP
    if (pendingUser.otp !== otp) {
      throw new Error('Mã OTP không chính xác.');
    }

    // Expiry check
    if (new Date() > pendingUser.expiresAt) {
      throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
    }

    // Create user in Firebase Auth via Admin SDK
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: pendingUser.email,
        password: pendingUser.password,
        displayName: pendingUser.displayName,
        emailVerified: true
      });
    } catch (fbError) {
      console.error('[Firebase Create User Error]:', fbError);
      if (fbError.code === 'auth/email-already-exists') {
        throw new Error('Email này đã được đăng ký trên hệ thống xác thực.');
      }
      throw new Error(`Lỗi khởi tạo tài khoản trên Firebase: ${fbError.message}`);
    }

    // Sync to local MySQL database
    const { user } = await this.syncUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName
    });

    // Generate Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

    // Delete pending record
    await pendingUser.destroy();

    return { user, customToken };
  }
}

module.exports = new AuthService();

