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
exports.CronSyncNewsUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const fcm_notification_service_1 = require("../../../infrastructure/services/fcm_notification.service");
const scan_history_model_1 = __importDefault(require("../../../infrastructure/database/sequelize/models/scan/scan_history.model"));
const user_model_1 = __importDefault(require("../../../infrastructure/database/sequelize/models/user/user.model"));
const sequelize_1 = require("sequelize");
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^\w\s]/g, '') // remove special characters
        .trim();
}
function isSemanticMatch(nameA, nameB) {
    const normA = normalizeString(nameA);
    const normB = normalizeString(nameB);
    const tokensA = new Set(normA.split(/\s+/).filter(w => w.length > 1));
    const tokensB = new Set(normB.split(/\s+/).filter(w => w.length > 1));
    if (tokensA.size === 0 || tokensB.size === 0)
        return false;
    const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
    const minSize = Math.min(tokensA.size, tokensB.size);
    const overlapRatio = intersection.size / minSize;
    const isSubstring = normA.includes(normB) || normB.includes(normA);
    return overlapRatio >= 0.7 || isSubstring;
}
function isAllergenMatch(userAllergy, targetAllergen) {
    const normUser = normalizeString(userAllergy);
    const normTarget = normalizeString(targetAllergen);
    return normUser.includes(normTarget) || normTarget.includes(normUser);
}
let CronSyncNewsUseCase = class CronSyncNewsUseCase {
    newsProvider;
    aiService;
    fcmService;
    constructor(newsProvider, aiService, fcmService) {
        this.newsProvider = newsProvider;
        this.aiService = aiService;
        this.fcmService = fcmService;
    }
    async execute() {
        try {
            // 1. Fetch news articles
            console.log('[CronSync] Fetching news warnings...');
            const articles = await this.newsProvider.getNewsWarnings();
            if (!articles || articles.length === 0) {
                return { success: true, warningsFound: 0, notificationsSent: 0, details: [] };
            }
            // 2. Prepare articles for AI analysis
            const articlesData = articles.map(a => ({
                title: a.title,
                snippet: a.contentSnippet,
                url: a.link
            }));
            // 3. Prompt AI to analyze articles
            const systemPrompt = `Bạn là một AI phân tích an toàn thực phẩm. Nhiệm vụ của bạn là đọc danh sách các bài báo tiếng Việt và phát hiện xem có sản phẩm thực phẩm nào bị thu hồi (recall) hoặc cảnh báo dị ứng (allergy alert) không.
Hãy trả về một đối tượng JSON có thuộc tính duy nhất là 'warnings' chứa danh sách các cảnh báo. Định dạng JSON như sau:
{
  "warnings": [
    {
      "type": "recall" hoặc "allergy",
      "productName": "Tên sản phẩm (viết hoa các chữ cái đầu, ví dụ: Mì Ăn Liền Hảo Hảo)",
      "reason": "Lý do thu hồi (chỉ áp dụng cho type='recall')",
      "allergen": "Chất gây dị ứng cụ thể, ví dụ: Đậu phộng, Trứng, Sữa (chỉ áp dụng cho type='allergy')",
      "url": "Đường link bài báo"
    }
  ]
}
Chỉ trả về chuỗi JSON thô, không kèm thẻ markdown hay bất kỳ từ giải thích nào. Nếu không tìm thấy cảnh báo nào, hãy trả về {"warnings": []}.`;
            const prompt = `Dưới đây là danh sách bài báo: ${JSON.stringify(articlesData)}`;
            console.log('[CronSync] Analyzing news with Groq AI...');
            const aiResponse = await this.aiService.analyzeTextOnly(systemPrompt, prompt);
            let parsedResponse;
            try {
                // Clean up markdown markers if AI mistakenly included them
                const cleanedJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedResponse = JSON.parse(cleanedJson);
            }
            catch (e) {
                console.error('[CronSync] Failed to parse JSON from AI response:', aiResponse);
                throw new Error('AI response is not valid JSON: ' + e.message);
            }
            const warnings = parsedResponse.warnings || [];
            console.log(`[CronSync] AI detected ${warnings.length} warnings.`);
            let totalSent = 0;
            const details = [];
            // 4. Process each warning
            for (const warning of warnings) {
                let sentCount = 0;
                let matchedUsersCount = 0;
                if (warning.type === 'recall' && warning.productName) {
                    // Extract unique words from productName for a loose database search
                    const queryTokens = warning.productName.split(/\s+/).filter((t) => t.length > 1);
                    const histories = await scan_history_model_1.default.findAll({
                        where: {
                            [sequelize_1.Op.or]: queryTokens.map((t) => ({
                                title: {
                                    [sequelize_1.Op.like]: `%${t}%`
                                }
                            }))
                        }
                    });
                    // Semantic filtering in memory
                    const matchedHistories = histories.filter((h) => isSemanticMatch(h.title, warning.productName));
                    if (matchedHistories.length > 0) {
                        const userIds = Array.from(new Set(matchedHistories.map((h) => h.userId)));
                        matchedUsersCount = userIds.length;
                        const users = await user_model_1.default.findAll({
                            where: {
                                id: { [sequelize_1.Op.in]: userIds },
                                pushEnabled: true,
                                fcmToken: { [sequelize_1.Op.ne]: null }
                            }
                        });
                        for (const user of users) {
                            const success = await this.fcmService.sendPushNotification(user.id, user.fcmToken, '🔴 CẢNH BÁO THU HỒI KHẨN CẤP', `Sản phẩm "${warning.productName}" bạn từng quét vừa bị yêu cầu thu hồi do ${warning.reason}. Vui lòng ngừng sử dụng!`, {
                                type: 'recall',
                                url: warning.url || '',
                                productName: warning.productName
                            });
                            if (success)
                                sentCount++;
                        }
                    }
                    details.push({
                        type: 'recall',
                        productName: warning.productName,
                        matchedUsers: matchedUsersCount,
                        notificationsSent: sentCount
                    });
                }
                else if (warning.type === 'allergy' && warning.productName && warning.allergen) {
                    // Find users with push enabled and active fcmToken
                    const users = await user_model_1.default.findAll({
                        where: {
                            pushEnabled: true,
                            fcmToken: { [sequelize_1.Op.ne]: null }
                        }
                    });
                    for (const user of users) {
                        const userAllergies = user.allergies || [];
                        const hasAllergy = userAllergies.some((a) => isAllergenMatch(a, warning.allergen));
                        if (hasAllergy) {
                            matchedUsersCount++;
                            const success = await this.fcmService.sendPushNotification(user.id, user.fcmToken, '⚠️ CẢNH BÁO DỊ ỨNG CÁ NHÂN HÓA', `Lưu ý: Món "${warning.productName}" mới ra mắt có chứa ${warning.allergen}. Hãy cẩn thận vì nó có trong danh sách dị ứng của bạn!`, {
                                type: 'allergy',
                                productName: warning.productName,
                                allergen: warning.allergen
                            });
                            if (success)
                                sentCount++;
                        }
                    }
                    details.push({
                        type: 'allergy',
                        productName: warning.productName,
                        allergen: warning.allergen,
                        matchedUsers: matchedUsersCount,
                        notificationsSent: sentCount
                    });
                }
                totalSent += sentCount;
            }
            return {
                success: true,
                warningsFound: warnings.length,
                notificationsSent: totalSent,
                details
            };
        }
        catch (error) {
            console.error('[CronSync Error]:', error);
            throw error;
        }
    }
};
exports.CronSyncNewsUseCase = CronSyncNewsUseCase;
exports.CronSyncNewsUseCase = CronSyncNewsUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('INewsProviderService')),
    __param(1, (0, tsyringe_1.inject)('IGenerativeAiService')),
    __param(2, (0, tsyringe_1.inject)(fcm_notification_service_1.FcmNotificationService)),
    __metadata("design:paramtypes", [Object, Object, fcm_notification_service_1.FcmNotificationService])
], CronSyncNewsUseCase);
