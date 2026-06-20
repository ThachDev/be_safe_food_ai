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
exports.SequelizeScanRepository = void 0;
const tsyringe_1 = require("tsyringe");
const scan_history_entity_1 = require("../../domain/entities/scan/scan_history.entity");
const scan_history_model_1 = __importDefault(require("../database/sequelize/models/scan/scan_history.model"));
let SequelizeScanRepository = class SequelizeScanRepository {
    async findByIdAndUserId(id, userId) {
        const scan = await scan_history_model_1.default.findOne({ where: { id, userId } });
        if (!scan)
            return null;
        return this.mapToEntity(scan);
    }
    async create(scan) {
        const created = await scan_history_model_1.default.create({
            userId: scan.userId,
            scanType: scan.scanType,
            title: scan.title,
            category: scan.category,
            imageUrl: scan.imageUrl,
            rating: scan.rating,
            scoreText: scan.scoreText,
            safeLevel: scan.safeLevel,
            aiResult: scan.aiResult,
            personalWarnings: scan.personalWarnings,
            healthyAlternatives: scan.healthyAlternatives
        });
        return this.mapToEntity(created);
    }
    async findAllByUserId(userId) {
        const scans = await scan_history_model_1.default.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        return scans.map((s) => this.mapToEntity(s));
    }
    async delete(id, userId) {
        const deletedCount = await scan_history_model_1.default.destroy({
            where: { id, userId }
        });
        return deletedCount > 0;
    }
    mapToEntity(scan) {
        return new scan_history_entity_1.ScanHistory(scan.id, scan.userId, scan.title, scan.category, scan.rating, scan.scoreText, scan.safeLevel, scan.personalWarnings || [], scan.healthyAlternatives || [], scan.aiResult, scan.scanType, scan.imageUrl, scan.createdAt, scan.updatedAt);
    }
};
exports.SequelizeScanRepository = SequelizeScanRepository;
exports.SequelizeScanRepository = SequelizeScanRepository = __decorate([
    (0, tsyringe_1.injectable)()
], SequelizeScanRepository);
