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
exports.DeleteScanUseCase = exports.GetScansUseCase = exports.CreateScanUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const auth_error_1 = require("../../../domain/errors/auth.error");
let CreateScanUseCase = class CreateScanUseCase {
    userRepository;
    scanRepository;
    constructor(userRepository, scanRepository) {
        this.userRepository = userRepository;
        this.scanRepository = scanRepository;
    }
    async execute(firebaseUid, data) {
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user)
            throw new auth_error_1.UserNotFoundError();
        const { scanType, title, category, imageUrl, rating, scoreText, safeLevel, aiResult, personalWarnings, healthyAlternatives } = data;
        if (!scanType || !title || !category || !rating || !scoreText || !safeLevel || !aiResult) {
            throw new Error('Missing required fields for scan history');
        }
        return await this.scanRepository.create({
            userId: user.id,
            scanType,
            title,
            category,
            imageUrl: imageUrl || null,
            rating,
            scoreText,
            safeLevel,
            aiResult,
            personalWarnings: personalWarnings || [],
            healthyAlternatives: healthyAlternatives || []
        });
    }
};
exports.CreateScanUseCase = CreateScanUseCase;
exports.CreateScanUseCase = CreateScanUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IScanRepository')),
    __metadata("design:paramtypes", [Object, Object])
], CreateScanUseCase);
let GetScansUseCase = class GetScansUseCase {
    userRepository;
    scanRepository;
    constructor(userRepository, scanRepository) {
        this.userRepository = userRepository;
        this.scanRepository = scanRepository;
    }
    async execute(firebaseUid) {
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user)
            throw new auth_error_1.UserNotFoundError();
        return await this.scanRepository.findAllByUserId(user.id);
    }
};
exports.GetScansUseCase = GetScansUseCase;
exports.GetScansUseCase = GetScansUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IScanRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GetScansUseCase);
let DeleteScanUseCase = class DeleteScanUseCase {
    userRepository;
    scanRepository;
    constructor(userRepository, scanRepository) {
        this.userRepository = userRepository;
        this.scanRepository = scanRepository;
    }
    async execute(firebaseUid, id) {
        if (!id)
            throw new Error('Scan ID is required');
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user)
            throw new auth_error_1.UserNotFoundError();
        const success = await this.scanRepository.delete(id, user.id);
        if (!success) {
            throw new Error('SCAN_NOT_FOUND');
        }
    }
};
exports.DeleteScanUseCase = DeleteScanUseCase;
exports.DeleteScanUseCase = DeleteScanUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __param(1, (0, tsyringe_1.inject)('IScanRepository')),
    __metadata("design:paramtypes", [Object, Object])
], DeleteScanUseCase);
