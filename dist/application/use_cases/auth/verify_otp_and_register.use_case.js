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
exports.VerifyOtpAndRegisterUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const auth_error_1 = require("../../../domain/errors/auth.error");
let VerifyOtpAndRegisterUseCase = class VerifyOtpAndRegisterUseCase {
    userRepository;
    identityProvider;
    constructor(userRepository, identityProvider) {
        this.userRepository = userRepository;
        this.identityProvider = identityProvider;
    }
    async execute(email, otp) {
        if (!email || !otp) {
            throw new Error('Email và mã OTP là bắt buộc.');
        }
        const pendingUser = await this.userRepository.findPendingUserByEmail(email);
        if (!pendingUser) {
            throw new Error('Không tìm thấy yêu cầu xác thực cho email này.');
        }
        if (pendingUser.otp !== otp) {
            throw new auth_error_1.InvalidOtpError();
        }
        if (new Date() > pendingUser.expiresAt) {
            throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
        }
        let firebaseUser;
        try {
            firebaseUser = await this.identityProvider.createUser(pendingUser.email, pendingUser.passwordHash, pendingUser.displayName);
        }
        catch (fbError) {
            throw new Error(`Lỗi khởi tạo tài khoản trên hệ thống xác thực: ${fbError.message}`);
        }
        // sync user to local DB
        let user = await this.userRepository.findByEmail(firebaseUser.email);
        if (user) {
            user.firebaseUid = firebaseUser.uid;
            user.displayName = firebaseUser.displayName;
            await this.userRepository.update(user.id, user);
        }
        else {
            user = await this.userRepository.create({
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoUrl: null,
                isOnboarded: false,
                dietType: 'Bình thường',
                allergies: [],
                diseases: [],
                healthGoals: []
            });
        }
        const customToken = await this.identityProvider.createCustomToken(firebaseUser.uid);
        await this.userRepository.deletePendingUser(email);
        return { user, customToken };
    }
};
exports.VerifyOtpAndRegisterUseCase = VerifyOtpAndRegisterUseCase;
exports.VerifyOtpAndRegisterUseCase = VerifyOtpAndRegisterUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IIdentityProviderService')),
    __metadata("design:paramtypes", [Object, Object])
], VerifyOtpAndRegisterUseCase);
