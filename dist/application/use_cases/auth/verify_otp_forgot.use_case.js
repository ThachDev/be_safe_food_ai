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
exports.VerifyOtpForgotUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const auth_error_1 = require("../../../domain/errors/auth.error");
let VerifyOtpForgotUseCase = class VerifyOtpForgotUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(email, otp) {
        if (!email || !otp) {
            throw new Error('Email và mã OTP là bắt buộc.');
        }
        const resetRequest = await this.userRepository.findPasswordResetByEmail(email);
        if (!resetRequest) {
            throw new Error('Không tìm thấy yêu cầu khôi phục mật khẩu cho email này.');
        }
        if (resetRequest.otp !== otp) {
            throw new auth_error_1.InvalidOtpError();
        }
        if (new Date() > resetRequest.expiresAt) {
            throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
        }
        return { success: true, message: 'Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.' };
    }
};
exports.VerifyOtpForgotUseCase = VerifyOtpForgotUseCase;
exports.VerifyOtpForgotUseCase = VerifyOtpForgotUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], VerifyOtpForgotUseCase);
