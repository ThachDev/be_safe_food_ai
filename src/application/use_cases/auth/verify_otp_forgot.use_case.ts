import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { InvalidOtpError } from '../../../domain/errors/auth.error';

@injectable()
export class VerifyOtpForgotUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async execute(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    if (!email || !otp) {
      throw new Error('Email và mã OTP là bắt buộc.');
    }

    const resetRequest = await this.userRepository.findPasswordResetByEmail(email);
    if (!resetRequest) {
      throw new Error('Không tìm thấy yêu cầu khôi phục mật khẩu cho email này.');
    }

    if (resetRequest.otp !== otp) {
      throw new InvalidOtpError();
    }

    if (new Date() > resetRequest.expiresAt) {
      throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
    }

    return { success: true, message: 'Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.' };
  }
}
