"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseIdentityProviderService = void 0;
const tsyringe_1 = require("tsyringe");
const firebase_1 = __importDefault(require("../external/firebase"));
let FirebaseIdentityProviderService = class FirebaseIdentityProviderService {
    async createUser(email, passwordHash, displayName) {
        const firebaseUser = await firebase_1.default.auth().createUser({
            email: email,
            password: passwordHash,
            displayName: displayName,
            emailVerified: true
        });
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || null
        };
    }
    async createCustomToken(uid) {
        return await firebase_1.default.auth().createCustomToken(uid);
    }
    async updatePassword(uid, newPassword) {
        await firebase_1.default.auth().updateUser(uid, {
            password: newPassword
        });
    }
    async getUserByEmail(email) {
        const firebaseUser = await firebase_1.default.auth().getUserByEmail(email);
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email || ''
        };
    }
};
exports.FirebaseIdentityProviderService = FirebaseIdentityProviderService;
exports.FirebaseIdentityProviderService = FirebaseIdentityProviderService = __decorate([
    (0, tsyringe_1.injectable)()
], FirebaseIdentityProviderService);
