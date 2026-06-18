export interface IMailService {
  sendOtpEmail(toEmail: string, otpCode: string, userName: string): Promise<any>;
  sendForgotPasswordOtpEmail(toEmail: string, otpCode: string, userName: string): Promise<any>;
}
