
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IMailService } from '../../interfaces/i_mail.service';
import { EmailAlreadyExistsError } from '../../../domain/errors/auth.error';


export class RegisterPendingUseCase {
  constructor(
    private userRepository: IUserRepository,
    private mailService: IMailService
  ) {}

  async execute(name: string, email: string, passwordHash: string): Promise<{ success: boolean; message: string }> {
    if (!name || !email || !passwordHash) {
      throw new Error('Họ tên, email và mật khẩu là bắt buộc.');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    let pendingUser = await this.userRepository.findPendingUserByEmail(email);
    if (pendingUser) {
      pendingUser.displayName = name;
      pendingUser.passwordHash = passwordHash;
      pendingUser.otp = otp;
      pendingUser.expiresAt = expiresAt;
      await this.userRepository.savePendingUser(pendingUser);
    } else {
      await this.userRepository.savePendingUser({
        email,
        displayName: name,
        passwordHash,
        otp,
        expiresAt
      });
    }

    await this.mailService.sendOtpEmail(email, otp, name);
    return { success: true, message: 'Mã OTP đã được gửi đến email của bạn.' };
  }
}
