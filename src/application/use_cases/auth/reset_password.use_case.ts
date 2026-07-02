
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IIdentityProviderService } from '../../interfaces/i_identity_provider.service';
import { InvalidOtpError } from '../../../domain/errors/auth.error';


export class ResetPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private identityProvider: IIdentityProviderService
  ) {}

  async execute(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!email || !otp || !newPassword) {
      throw new Error('Email, mã OTP và mật khẩu mới là bắt buộc.');
    }

    const resetRequest = await this.userRepository.findPasswordResetByEmail(email);
    if (!resetRequest) {
      throw new Error('Không tìm thấy yêu cầu khôi phục mật khẩu cho email này.');
    }

    if (resetRequest.otp !== otp) {
      throw new InvalidOtpError();
    }

    if (new Date() > resetRequest.expiresAt) {
      throw new Error('Mã OTP đã hết hạn. Vui lòng gửi lại yêu cầu.');
    }

    let firebaseUser;
    try {
      firebaseUser = await this.identityProvider.getUserByEmail(email);
    } catch (error) {
      throw new Error('Không tìm thấy tài khoản người dùng trên hệ thống xác thực.');
    }

    try {
      await this.identityProvider.updatePassword(firebaseUser.uid, newPassword);
    } catch (error: any) {
      throw new Error(`Không thể đặt lại mật khẩu mới: ${error.message}`);
    }

    await this.userRepository.deletePasswordReset(email);

    return { success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.' };
  }
}
