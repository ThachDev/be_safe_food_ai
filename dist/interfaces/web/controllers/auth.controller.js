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
exports.AuthController = void 0;
const tsyringe_1 = require("tsyringe");
const sync_user_use_case_1 = require("../../../application/use_cases/auth/sync_user.use_case");
const register_pending_use_case_1 = require("../../../application/use_cases/auth/register_pending.use_case");
const verify_otp_and_register_use_case_1 = require("../../../application/use_cases/auth/verify_otp_and_register.use_case");
const forgot_password_pending_use_case_1 = require("../../../application/use_cases/auth/forgot_password_pending.use_case");
const verify_otp_forgot_use_case_1 = require("../../../application/use_cases/auth/verify_otp_forgot.use_case");
const reset_password_use_case_1 = require("../../../application/use_cases/auth/reset_password.use_case");
const constants_1 = require("../../../shared/constants");
let AuthController = class AuthController {
    syncUserUseCase;
    registerPendingUseCase;
    verifyOtpAndRegisterUseCase;
    forgotPasswordPendingUseCase;
    verifyOtpForgotUseCase;
    resetPasswordUseCase;
    constructor(syncUserUseCase, registerPendingUseCase, verifyOtpAndRegisterUseCase, forgotPasswordPendingUseCase, verifyOtpForgotUseCase, resetPasswordUseCase) {
        this.syncUserUseCase = syncUserUseCase;
        this.registerPendingUseCase = registerPendingUseCase;
        this.verifyOtpAndRegisterUseCase = verifyOtpAndRegisterUseCase;
        this.forgotPasswordPendingUseCase = forgotPasswordPendingUseCase;
        this.verifyOtpForgotUseCase = verifyOtpForgotUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
    }
    sync = async (req, res) => {
        try {
            const firebaseUser = req.user;
            if (!firebaseUser) {
                return res.status(constants_1.HttpStatus.UNAUTHORIZED).json({
                    success: false,
                    code: constants_1.ErrorCodes.UNAUTHORIZED,
                    message: 'User authentication details are missing from request.'
                });
            }
            const { user, isNew } = await this.syncUserUseCase.execute(firebaseUser.uid, firebaseUser.email, firebaseUser.name, firebaseUser.picture);
            return res.status(isNew ? constants_1.HttpStatus.CREATED : constants_1.HttpStatus.OK).json({
                success: true,
                message: isNew ? 'User registered and synchronized successfully.' : 'User details synchronized successfully.',
                data: user
            });
        }
        catch (error) {
            return res.status(constants_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                code: constants_1.ErrorCodes.DATABASE_ERROR,
                message: 'An error occurred while synchronizing user data with the database.',
                error: error.message
            });
        }
    };
    registerRequest = async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const result = await this.registerPendingUseCase.execute(name, email, password);
            return res.status(constants_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                code: constants_1.ErrorCodes.VALIDATION_ERROR,
                message: error.message
            });
        }
    };
    verifyOtp = async (req, res) => {
        try {
            const { email, otp } = req.body;
            const { user, customToken } = await this.verifyOtpAndRegisterUseCase.execute(email, otp);
            return res.status(constants_1.HttpStatus.CREATED).json({
                success: true,
                message: 'Xác thực OTP thành công. Tài khoản đã được khởi tạo.',
                data: {
                    token: customToken,
                    user: user
                }
            });
        }
        catch (error) {
            return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                code: constants_1.ErrorCodes.VALIDATION_ERROR,
                message: error.message
            });
        }
    };
    forgotPassword = async (req, res) => {
        try {
            const { email } = req.body;
            const result = await this.forgotPasswordPendingUseCase.execute(email);
            return res.status(constants_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                code: constants_1.ErrorCodes.VALIDATION_ERROR,
                message: error.message
            });
        }
    };
    verifyOtpForgot = async (req, res) => {
        try {
            const { email, otp } = req.body;
            const result = await this.verifyOtpForgotUseCase.execute(email, otp);
            return res.status(constants_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                code: constants_1.ErrorCodes.VALIDATION_ERROR,
                message: error.message
            });
        }
    };
    resetPassword = async (req, res) => {
        try {
            const { email, otp, password } = req.body;
            const result = await this.resetPasswordUseCase.execute(email, otp, password);
            return res.status(constants_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                code: constants_1.ErrorCodes.VALIDATION_ERROR,
                message: error.message
            });
        }
    };
};
exports.AuthController = AuthController;
exports.AuthController = AuthController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(sync_user_use_case_1.SyncUserUseCase)),
    __param(1, (0, tsyringe_1.inject)(register_pending_use_case_1.RegisterPendingUseCase)),
    __param(2, (0, tsyringe_1.inject)(verify_otp_and_register_use_case_1.VerifyOtpAndRegisterUseCase)),
    __param(3, (0, tsyringe_1.inject)(forgot_password_pending_use_case_1.ForgotPasswordPendingUseCase)),
    __param(4, (0, tsyringe_1.inject)(verify_otp_forgot_use_case_1.VerifyOtpForgotUseCase)),
    __param(5, (0, tsyringe_1.inject)(reset_password_use_case_1.ResetPasswordUseCase)),
    __metadata("design:paramtypes", [sync_user_use_case_1.SyncUserUseCase,
        register_pending_use_case_1.RegisterPendingUseCase,
        verify_otp_and_register_use_case_1.VerifyOtpAndRegisterUseCase,
        forgot_password_pending_use_case_1.ForgotPasswordPendingUseCase,
        verify_otp_forgot_use_case_1.VerifyOtpForgotUseCase,
        reset_password_use_case_1.ResetPasswordUseCase])
], AuthController);
