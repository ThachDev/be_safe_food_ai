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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmNotificationService = void 0;
const tsyringe_1 = require("tsyringe");
const firebase_1 = __importDefault(require("../external/firebase"));
let FcmNotificationService = class FcmNotificationService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async sendPushNotification(userId, fcmToken, title, body, dataPayload) {
        if (!firebase_1.default || !firebase_1.default.apps.length) {
            console.warn('[FcmNotificationService] Firebase Admin is not initialized.');
            return false;
        }
        try {
            const message = {
                notification: {
                    title,
                    body,
                },
                data: dataPayload || {},
                token: fcmToken,
            };
            const response = await firebase_1.default.messaging().send(message);
            console.log(`[FcmNotificationService] Push sent to user ${userId} successfully:`, response);
            return true;
        }
        catch (error) {
            console.error(`[FcmNotificationService] Failed to send push to user ${userId}:`, error);
            if (error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-argument' ||
                (error.message && error.message.includes('not-registered'))) {
                console.log(`[FcmNotificationService] Cleaning up inactive token for user ${userId}`);
                try {
                    await this.userRepository.update(userId, { fcmToken: null });
                }
                catch (dbError) {
                    console.error('[FcmNotificationService] Failed to clear invalid token from DB:', dbError);
                }
            }
            return false;
        }
    }
};
exports.FcmNotificationService = FcmNotificationService;
exports.FcmNotificationService = FcmNotificationService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], FcmNotificationService);
