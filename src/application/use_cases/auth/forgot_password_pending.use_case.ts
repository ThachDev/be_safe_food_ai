
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IMailService } from '../../interfaces/i_mail.service';
import { UserNotFoundError } from '../../../domain/errors/auth.error';


export class ForgotPasswordPendingUseCase {
  constructor(
    private userRepository: IUserRepository,
    private mailService: IMailService
  ) {}

  async execute(email: string): Promise<{ success: boolean; message: string }> {
    if (!email) {
      throw new Error('Email là bắt buộc.');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    let resetRequest = await this.userRepository.findPasswordResetByEmail(email);
    if (resetRequest) {
      resetRequest.otp = otp;
      resetRequest.expiresAt = expiresAt;
      await this.userRepository.savePasswordReset(resetRequest);
    } else {
      await this.userRepository.savePasswordReset({
        email,
        otp,
        expiresAt
      });
    }

    await this.mailService.sendForgotPasswordOtpEmail(email, otp, user.displayName || '');
    return { success: true, message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.' };
  }
}
