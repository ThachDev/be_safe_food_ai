const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

class MailService {
  constructor() {
    this.useResendApi = !!process.env.RESEND_API_KEY;
    if (!this.useResendApi) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  async sendMailInternal(mailOptions) {
    if (this.useResendApi) {
      // Send using Resend HTTP API (Port 443 - Không bao giờ bị chặn)
      const payload = {
        from: mailOptions.from,
        to: [mailOptions.to],
        subject: mailOptions.subject,
        html: mailOptions.html,
      };

      try {
        await axios.post('https://api.resend.com/emails', payload, {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('[Resend API Error]', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message);
      }
    } else {
      // Send using SMTP (Sẽ bị Render chặn nếu dùng port 587/465)
      await this.transporter.sendMail(mailOptions);
    }
  }

  /**
   * Send verification OTP email to a user
   * @param {string} toEmail Recipient email address
   * @param {string} otp 6-digit OTP code
   * @param {string} name Recipient display name
   */
  async sendOtpEmail(toEmail, otp, name = '') {
    const fromAddress = process.env.SMTP_FROM || `"Safe Food AI" <${process.env.SMTP_USER}>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title>Safe Food AI - OTP Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=device-width, initial-scale=1">
        <style type="text/css">
          body, table, td, a { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
          table, td { mso-table-rspace: 0pt; mso-table-lspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; }
          body {
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f7f9fa;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #edf2f7;
          }
          .header {
            background-color: #10B981;
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 40px 30px;
            color: #2D3748;
            line-height: 1.6;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 16px;
          }
          .instruction {
            font-size: 15px;
            color: #4A5568;
            margin-bottom: 30px;
          }
          .otp-container {
            background-color: #f0fdf4;
            border: 2px dashed #10B981;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #10B981;
            margin: 0;
          }
          .expiry-warning {
            font-size: 13px;
            color: #E11D48;
            font-weight: 500;
            text-align: center;
            margin-bottom: 30px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <div class="email-container">
                <!-- Header -->
                <div class="header">
                  <h1>SAFE FOOD AI</h1>
                </div>
                <!-- Content -->
                <div class="content">
                  <p class="greeting">Xin chào ${name || 'bạn'},</p>
                  <p class="instruction">Cảm ơn bạn đã lựa chọn đăng ký tài khoản tại <strong>Safe Food AI</strong>. Vui lòng sử dụng mã OTP dưới đây để xác thực và hoàn tất quá trình đăng ký:</p>
                  
                  <!-- OTP -->
                  <div class="otp-container">
                    <p class="otp-code">${otp}</p>
                  </div>
                  
                  <p class="expiry-warning">🚨 Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                  
                  <p style="font-size: 14px; color: #718096; margin-bottom: 0;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
                </div>
                <!-- Footer -->
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Safe Food AI. All rights reserved.</p>
                  <p>Hệ thống hỗ trợ sức khỏe và an toàn thực phẩm thông minh</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `[Safe Food AI] Mã xác thực đăng ký tài khoản - ${otp}`,
      html: htmlContent,
    };

    try {
      await this.sendMailInternal(mailOptions);
      console.log(`[MailService] OTP email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('[MailService Error] Failed to send email:', error);
      throw new Error(`Failed to send email verification: ${error.message}`);
    }
  }

  async sendForgotPasswordOtpEmail(toEmail, otp, name = '') {
    const fromAddress = process.env.SMTP_FROM || `"Safe Food AI" <${process.env.SMTP_USER}>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title>Safe Food AI - Khôi phục mật khẩu</title>
        <meta name="viewport" content="width=device-width, initial-scale=device-width, initial-scale=1">
        <style type="text/css">
          body, table, td, a { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
          table, td { mso-table-rspace: 0pt; mso-table-lspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; }
          body {
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f7f9fa;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #edf2f7;
          }
          .header {
            background-color: #10B981;
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 40px 30px;
            color: #2D3748;
            line-height: 1.6;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 16px;
          }
          .instruction {
            font-size: 15px;
            color: #4A5568;
            margin-bottom: 30px;
          }
          .otp-container {
            background-color: #f0fdf4;
            border: 2px dashed #10B981;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #10B981;
            margin: 0;
          }
          .expiry-warning {
            font-size: 13px;
            color: #E11D48;
            font-weight: 500;
            text-align: center;
            margin-bottom: 30px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <div class="email-container">
                <!-- Header -->
                <div class="header">
                  <h1>SAFE FOOD AI</h1>
                </div>
                <!-- Content -->
                <div class="content">
                  <p class="greeting">Xin chào ${name || 'bạn'},</p>
                  <p class="instruction">Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu tài khoản <strong>Safe Food AI</strong> của bạn. Vui lòng sử dụng mã OTP dưới đây để xác thực và tiến hành đặt lại mật khẩu:</p>
                  
                  <!-- OTP -->
                  <div class="otp-container">
                    <p class="otp-code">${otp}</p>
                  </div>
                  
                  <p class="expiry-warning">🚨 Mã OTP khôi phục mật khẩu này có hiệu lực trong vòng 5 phút. Tuyệt đối không chia sẻ mã này với bất kỳ ai.</p>
                  
                  <p style="font-size: 14px; color: #718096; margin-bottom: 0;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi để được giúp đỡ.</p>
                </div>
                <!-- Footer -->
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Safe Food AI. All rights reserved.</p>
                  <p>Hệ thống hỗ trợ sức khỏe và an toàn thực phẩm thông minh</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `[Safe Food AI] Yêu cầu khôi phục mật khẩu - ${otp}`,
      html: htmlContent,
    };

    try {
      await this.sendMailInternal(mailOptions);
      console.log(`[MailService] Forgot Password OTP email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('[MailService Error] Failed to send forgot password email:', error);
      throw new Error(`Failed to send email verification: ${error.message}`);
    }
  }
}
module.exports = new MailService();
