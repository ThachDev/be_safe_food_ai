import { injectable } from 'tsyringe';
import { IMailService } from '../../application/interfaces/i_mail.service';
import nodemailer from 'nodemailer';

@injectable()
export class AuthMailService implements IMailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendOtpEmail(toEmail: string, otpCode: string, userName: string): Promise<any> {
    const fromName = process.env.SMTP_FROM_NAME || 'Safe Food AI';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: 'Xác thực tài khoản Safe Food AI',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Safe Food AI - Xác Thực OTP</h2>
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Mã OTP để xác thực tài khoản của bạn là:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px;">${otpCode}</h1>
          <p>Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
          <p>Trân trọng,<br>Đội ngũ Safe Food AI</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendForgotPasswordOtpEmail(toEmail: string, otpCode: string, userName: string): Promise<any> {
    const fromName = process.env.SMTP_FROM_NAME || 'Safe Food AI';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: 'Khôi phục mật khẩu Safe Food AI',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #f44336;">Safe Food AI - Khôi Phục Mật Khẩu</h2>
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Mã OTP để khôi phục mật khẩu của bạn là:</p>
          <h1 style="color: #f44336; font-size: 32px; letter-spacing: 2px;">${otpCode}</h1>
          <p>Mã này có hiệu lực trong vòng 5 phút.</p>
          <p>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,<br>Đội ngũ Safe Food AI</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
