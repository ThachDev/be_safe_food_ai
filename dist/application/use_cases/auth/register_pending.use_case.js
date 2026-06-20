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
exports.RegisterPendingUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const auth_error_1 = require("../../../domain/errors/auth.error");
let RegisterPendingUseCase = class RegisterPendingUseCase {
    userRepository;
    mailService;
    constructor(userRepository, mailService) {
        this.userRepository = userRepository;
        this.mailService = mailService;
    }
    async execute(name, email, passwordHash) {
        if (!name || !email || !passwordHash) {
            throw new Error('Họ tên, email và mật khẩu là bắt buộc.');
        }
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new auth_error_1.EmailAlreadyExistsError();
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
        }
        else {
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
};
exports.RegisterPendingUseCase = RegisterPendingUseCase;
exports.RegisterPendingUseCase = RegisterPendingUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IMailService')),
    __metadata("design:paramtypes", [Object, Object])
], RegisterPendingUseCase);
