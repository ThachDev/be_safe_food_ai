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
exports.SyncUserUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let SyncUserUseCase = class SyncUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(uid, email, name, picture) {
        if (!uid || !email) {
            throw new Error('Firebase UID and Email are required for user synchronization.');
        }
        let user = await this.userRepository.findByFirebaseUid(uid);
        let isNew = false;
        if (user) {
            let hasChanges = false;
            if (user.email !== email) {
                user.email = email;
                hasChanges = true;
            }
            if (user.displayName !== name) {
                user.displayName = name || null;
                hasChanges = true;
            }
            if (picture && user.photoUrl !== picture) {
                user.photoUrl = picture;
                hasChanges = true;
            }
            if (hasChanges) {
                await this.userRepository.update(user.id, user);
            }
        }
        else {
            let userByEmail = await this.userRepository.findByEmail(email);
            if (userByEmail) {
                userByEmail.firebaseUid = uid;
                if (name)
                    userByEmail.displayName = name;
                if (picture)
                    userByEmail.photoUrl = picture;
                await this.userRepository.update(userByEmail.id, userByEmail);
                user = userByEmail;
            }
            else {
                user = await this.userRepository.create({
                    firebaseUid: uid,
                    email,
                    displayName: name || null,
                    photoUrl: picture || null,
                    isOnboarded: false,
                    dietType: 'Bình thường',
                    allergies: [],
                    diseases: [],
                    healthGoals: []
                });
                isNew = true;
            }
        }
        return { user, isNew };
    }
};
exports.SyncUserUseCase = SyncUserUseCase;
exports.SyncUserUseCase = SyncUserUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], SyncUserUseCase);
