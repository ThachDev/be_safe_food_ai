const authService = require('../services/auth.service');
const { HttpStatus, ErrorCodes } = require('../constants');

class AuthController {
  /**
   * Controller endpoint to handle user synchronization request
   */
  async sync(req, res) {
    try {
      const firebaseUser = req.user; // Set by authMiddleware

      if (!firebaseUser) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          code: ErrorCodes.UNAUTHORIZED,
          message: 'User authentication details are missing from request.'
        });
      }

      // Delegate synchronization to service layer
      const { user, isNew } = await authService.syncUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name,
        picture: firebaseUser.picture
      });

      return res.status(isNew ? HttpStatus.CREATED : HttpStatus.OK).json({
        success: true,
        message: isNew ? 'User registered and synchronized successfully.' : 'User details synchronized successfully.',
        data: {
          id: user.id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.photoUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('[AuthController Sync Error]:', error);
      
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ErrorCodes.DATABASE_ERROR,
        message: 'An error occurred while synchronizing user data with the database.',
        error: error.message
      });
    }
  }

  /**
   * Controller endpoint to handle temporary registration and OTP generation
   */
  async registerRequest(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Họ tên, email và mật khẩu là bắt buộc.'
        });
      }

      const result = await authService.registerPending(name, email, password);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('[AuthController Register Request Error]:', error);
      
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  }

  /**
   * Controller endpoint to verify OTP code and finalize user registration
   */
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Email và mã OTP là bắt buộc.'
        });
      }

      const { user, customToken } = await authService.verifyOtpAndRegister(email, otp);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Xác thực OTP thành công. Tài khoản đã được khởi tạo.',
        data: {
          token: customToken,
          user: {
            id: user.id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('[AuthController Verify OTP Error]:', error);
      
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  }

  /**
   * Controller endpoint to handle forgot password (request OTP)
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Email là bắt buộc.'
        });
      }

      const result = await authService.forgotPasswordPending(email);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('[AuthController Forgot Password Request Error]:', error);
      
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  }

  /**
   * Controller endpoint to verify forgot password OTP code
   */
  async verifyOtpForgot(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Email và mã OTP là bắt buộc.'
        });
      }

      const result = await authService.verifyOtpForgot(email, otp);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('[AuthController Verify OTP Forgot Error]:', error);
      
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  }

  /**
   * Controller endpoint to reset password with valid OTP code
   */
  async resetPassword(req, res) {
    try {
      const { email, otp, password } = req.body;

      if (!email || !otp || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Email, mã OTP và mật khẩu mới là bắt buộc.'
        });
      }

      const result = await authService.resetPassword(email, otp, password);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('[AuthController Reset Password Error]:', error);
      
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
