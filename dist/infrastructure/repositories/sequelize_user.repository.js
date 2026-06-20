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
exports.SequelizeUserRepository = void 0;
const tsyringe_1 = require("tsyringe");
const user_entity_1 = require("../../domain/entities/user/user.entity");
const pending_user_entity_1 = require("../../domain/entities/auth/pending_user.entity");
const password_reset_entity_1 = require("../../domain/entities/auth/password_reset.entity");
// Import existing sequelize models
const user_model_1 = __importDefault(require("../database/sequelize/models/user/user.model"));
const pending_user_model_1 = __importDefault(require("../database/sequelize/models/auth/pending_user.model"));
const password_reset_model_1 = __importDefault(require("../database/sequelize/models/auth/password_reset.model"));
let SequelizeUserRepository = class SequelizeUserRepository {
    mapToUserEntity(record) {
        return new user_entity_1.User(record.id, record.firebaseUid, record.email, record.displayName, record.photoUrl, record.isOnboarded, record.dietType, record.allergies, record.diseases, record.healthGoals, record.pushEnabled, record.emailEnabled, record.fcmToken);
    }
    mapToPendingUserEntity(record) {
        return new pending_user_entity_1.PendingUser(record.id, record.email, record.displayName, record.password, record.otp, record.expiresAt);
    }
    mapToPasswordResetEntity(record) {
        return new password_reset_entity_1.PasswordReset(record.id, record.email, record.otp, record.expiresAt);
    }
    async findById(id) {
        const userModel = await user_model_1.default.findByPk(id);
        if (!userModel)
            return null;
        return this.mapToUserEntity(userModel);
    }
    async findByFirebaseUid(uid) {
        const record = await user_model_1.default.findOne({ where: { firebaseUid: uid } });
        if (!record)
            return null;
        return this.mapToUserEntity(record);
    }
    async findByEmail(email) {
        const record = await user_model_1.default.findOne({ where: { email } });
        if (!record)
            return null;
        return this.mapToUserEntity(record);
    }
    async findAll() {
        const users = await user_model_1.default.findAll();
        return users.map((u) => this.mapToUserEntity(u));
    }
    async create(user) {
        const record = await user_model_1.default.create({
            firebaseUid: user.firebaseUid,
            email: user.email,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            isOnboarded: user.isOnboarded,
            dietType: user.dietType,
            allergies: user.allergies,
            diseases: user.diseases,
            healthGoals: user.healthGoals,
            pushEnabled: user.pushEnabled,
            emailEnabled: user.emailEnabled,
            fcmToken: user.fcmToken
        });
        return this.mapToUserEntity(record);
    }
    async update(id, data) {
        await user_model_1.default.update(data, { where: { id } });
    }
    async findPendingUserByEmail(email) {
        const record = await pending_user_model_1.default.findOne({ where: { email } });
        if (!record)
            return null;
        return this.mapToPendingUserEntity(record);
    }
    async savePendingUser(pendingUser) {
        if ('id' in pendingUser) {
            // update
            await pending_user_model_1.default.update({
                displayName: pendingUser.displayName,
                password: pendingUser.passwordHash,
                otp: pendingUser.otp,
                expiresAt: pendingUser.expiresAt
            }, { where: { id: pendingUser.id } });
            return pendingUser;
        }
        else {
            // create
            const record = await pending_user_model_1.default.create({
                email: pendingUser.email,
                displayName: pendingUser.displayName,
                password: pendingUser.passwordHash,
                otp: pendingUser.otp,
                expiresAt: pendingUser.expiresAt
            });
            return this.mapToPendingUserEntity(record);
        }
    }
    async deletePendingUser(email) {
        await pending_user_model_1.default.destroy({ where: { email } });
    }
    async findPasswordResetByEmail(email) {
        const record = await password_reset_model_1.default.findOne({ where: { email } });
        if (!record)
            return null;
        return this.mapToPasswordResetEntity(record);
    }
    async savePasswordReset(reset) {
        if ('id' in reset) {
            await password_reset_model_1.default.update({
                otp: reset.otp,
                expiresAt: reset.expiresAt
            }, { where: { id: reset.id } });
            return reset;
        }
        else {
            const record = await password_reset_model_1.default.create({
                email: reset.email,
                otp: reset.otp,
                expiresAt: reset.expiresAt
            });
            return this.mapToPasswordResetEntity(record);
        }
    }
    async deletePasswordReset(email) {
        await password_reset_model_1.default.destroy({ where: { email } });
    }
};
exports.SequelizeUserRepository = SequelizeUserRepository;
exports.SequelizeUserRepository = SequelizeUserRepository = __decorate([
    (0, tsyringe_1.injectable)()
], SequelizeUserRepository);
