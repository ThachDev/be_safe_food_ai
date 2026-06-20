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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordPendingUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const auth_error_1 = require("../../../domain/errors/auth.error");
let ForgotPasswordPendingUseCase = class ForgotPasswordPendingUseCase {
    userRepository;
    mailService;
    constructor(userRepository, mailService) {
        this.userRepository = userRepository;
        this.mailService = mailService;
    }
    async execute(email) {
        if (!email) {
            throw new Error('Email là bắt buộc.');
        }
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new auth_error_1.UserNotFoundError();
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        let resetRequest = await this.userRepository.findPasswordResetByEmail(email);
        if (resetRequest) {
            resetRequest.otp = otp;
            resetRequest.expiresAt = expiresAt;
            await this.userRepository.savePasswordReset(resetRequest);
        }
        else {
            await this.userRepository.savePasswordReset({
                email,
                otp,
                expiresAt
            });
        }
        await this.mailService.sendForgotPasswordOtpEmail(email, otp, user.displayName || '');
        return { success: true, message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.' };
    }
};
exports.ForgotPasswordPendingUseCase = ForgotPasswordPendingUseCase;
exports.ForgotPasswordPendingUseCase = ForgotPasswordPendingUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IMailService')),
    __metadata("design:paramtypes", [Object, Object])
], ForgotPasswordPendingUseCase);
