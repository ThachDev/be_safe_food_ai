"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordReset = void 0;
class PasswordReset {
    id;
    email;
    otp;
    expiresAt;
    constructor(id, email, otp, expiresAt) {
        this.id = id;
        this.email = email;
        this.otp = otp;
        this.expiresAt = expiresAt;
    }
}
exports.PasswordReset = PasswordReset;
