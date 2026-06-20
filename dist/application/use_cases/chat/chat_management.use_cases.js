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
exports.DeleteChatSessionUseCase = exports.GetChatSessionsUseCase = exports.GetChatHistoryUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let GetChatHistoryUseCase = class GetChatHistoryUseCase {
    userRepository;
    chatRepository;
    constructor(userRepository, chatRepository) {
        this.userRepository = userRepository;
        this.chatRepository = chatRepository;
    }
    async execute(firebaseUid, sessionId) {
        if (!sessionId)
            throw new Error('sessionId is required');
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user)
            return [];
        return await this.chatRepository.findHistory(user.id, sessionId);
    }
};
exports.GetChatHistoryUseCase = GetChatHistoryUseCase;
exports.GetChatHistoryUseCase = GetChatHistoryUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IChatRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GetChatHistoryUseCase);
let GetChatSessionsUseCase = class GetChatSessionsUseCase {
    userRepository;
    chatRepository;
    constructor(userRepository, chatRepository) {
        this.userRepository = userRepository;
        this.chatRepository = chatRepository;
    }
    async execute(firebaseUid) {
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user)
            return [];
        return await this.chatRepository.findSessions(user.id);
    }
};
exports.GetChatSessionsUseCase = GetChatSessionsUseCase;
exports.GetChatSessionsUseCase = GetChatSessionsUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IChatRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GetChatSessionsUseCase);
let DeleteChatSessionUseCase = class DeleteChatSessionUseCase {
    userRepository;
    chatRepository;
    constructor(userRepository, chatRepository) {
        this.userRepository = userRepository;
        this.chatRepository = chatRepository;
    }
    async execute(firebaseUid, sessionId) {
        if (!sessionId)
            throw new Error('sessionId is required');
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user)
            throw new Error('User not found');
        await this.chatRepository.deleteSession(user.id, sessionId);
    }
};
exports.DeleteChatSessionUseCase = DeleteChatSessionUseCase;
exports.DeleteChatSessionUseCase = DeleteChatSessionUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IChatRepository')),
    __metadata("design:paramtypes", [Object, Object])
], DeleteChatSessionUseCase);
