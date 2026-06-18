import { injectable } from 'tsyringe';
import { IMailService } from '../../application/interfaces/i_mail.service';

// Use existing mail.service for now to avoid rewriting it
const oldMailService = require('../../services/mail.service');

@injectable()
export class AuthMailService implements IMailService {
  async sendOtpEmail(toEmail: string, otpCode: string, userName: string): Promise<any> {
    return await oldMailService.sendOtpEmail(toEmail, otpCode, userName);
  }

  async sendForgotPasswordOtpEmail(toEmail: string, otpCode: string, userName: string): Promise<any> {
    return await oldMailService.sendForgotPasswordOtpEmail(toEmail, otpCode, userName);
  }
}
