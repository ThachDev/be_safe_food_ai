"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAlreadyExistsError = exports.InvalidOtpError = exports.UserNotFoundError = exports.AuthError = void 0;
class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
}
exports.AuthError = AuthError;
class UserNotFoundError extends AuthError {
    constructor() {
        super('Người dùng không tồn tại.');
        this.name = 'UserNotFoundError';
    }
}
exports.UserNotFoundError = UserNotFoundError;
class InvalidOtpError extends AuthError {
    constructor() {
        super('Mã OTP không chính xác hoặc đã hết hạn.');
        this.name = 'InvalidOtpError';
    }
}
exports.InvalidOtpError = InvalidOtpError;
class EmailAlreadyExistsError extends AuthError {
    constructor() {
        super('Email này đã được sử dụng.');
        this.name = 'EmailAlreadyExistsError';
    }
}
exports.EmailAlreadyExistsError = EmailAlreadyExistsError;
