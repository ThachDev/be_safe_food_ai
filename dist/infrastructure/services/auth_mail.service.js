"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMailService = void 0;
const tsyringe_1 = require("tsyringe");
const nodemailer_1 = __importDefault(require("nodemailer"));
let AuthMailService = class AuthMailService {
    transporter;
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }
    async sendOtpEmail(toEmail, otpCode, userName) {
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
    async sendForgotPasswordOtpEmail(toEmail, otpCode, userName) {
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
};
exports.AuthMailService = AuthMailService;
exports.AuthMailService = AuthMailService = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], AuthMailService);
