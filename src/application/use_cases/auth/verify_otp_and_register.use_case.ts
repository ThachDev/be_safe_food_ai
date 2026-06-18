import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IIdentityProviderService } from '../../interfaces/i_identity_provider.service';
import { InvalidOtpError, UserNotFoundError } from '../../../domain/errors/auth.error';
import { User } from '../../../domain/entities/user.entity';

@injectable()
export class VerifyOtpAndRegisterUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IIdentityProviderService') private identityProvider: IIdentityProviderService
  ) {}

  async execute(email: string, otp: string): Promise<{ user: User; customToken: string }> {
    if (!email || !otp) {
      throw new Error('Email và mã OTP là bắt buộc.');
    }

    const pendingUser = await this.userRepository.findPendingUserByEmail(email);
    if (!pendingUser) {
      throw new Error('Không tìm thấy yêu cầu xác thực cho email này.');
    }

    if (pendingUser.otp !== otp) {
      throw new InvalidOtpError();
    }

    if (new Date() > pendingUser.expiresAt) {
      throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
    }

    let firebaseUser;
    try {
      firebaseUser = await this.identityProvider.createUser(
        pendingUser.email,
        pendingUser.passwordHash,
        pendingUser.displayName
      );
    } catch (fbError: any) {
      throw new Error(`Lỗi khởi tạo tài khoản trên hệ thống xác thực: ${fbError.message}`);
    }

    // sync user to local DB
    let user = await this.userRepository.findByEmail(firebaseUser.email);
    if (user) {
      user.firebaseUid = firebaseUser.uid;
      user.displayName = firebaseUser.displayName;
      await this.userRepository.update(user.id, user);
    } else {
      user = await this.userRepository.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoUrl: null,
        isOnboarded: false,
        dietType: 'Bình thường',
        allergies: [],
        diseases: [],
        healthGoals: []
      });
    }

    const customToken = await this.identityProvider.createCustomToken(firebaseUser.uid);
    await this.userRepository.deletePendingUser(email);

    return { user, customToken };
  }
}
