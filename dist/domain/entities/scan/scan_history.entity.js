"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanHistory = void 0;
class ScanHistory {
    id;
    userId;
    title;
    category;
    rating;
    scoreText;
    safeLevel;
    personalWarnings;
    healthyAlternatives;
    aiResult;
    scanType;
    imageUrl;
    createdAt;
    updatedAt;
    constructor(id, userId, title, category, rating, scoreText, safeLevel, personalWarnings, healthyAlternatives, aiResult, scanType, imageUrl, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.category = category;
        this.rating = rating;
        this.scoreText = scoreText;
        this.safeLevel = safeLevel;
        this.personalWarnings = personalWarnings;
        this.healthyAlternatives = healthyAlternatives;
        this.aiResult = aiResult;
        this.scanType = scanType;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.ScanHistory = ScanHistory;
