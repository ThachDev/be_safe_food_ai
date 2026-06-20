"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingUser = void 0;
class PendingUser {
    id;
    email;
    displayName;
    passwordHash;
    otp;
    expiresAt;
    constructor(id, email, displayName, passwordHash, otp, expiresAt) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.otp = otp;
        this.expiresAt = expiresAt;
    }
}
exports.PendingUser = PendingUser;
