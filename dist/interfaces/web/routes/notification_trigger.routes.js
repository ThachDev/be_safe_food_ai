"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTriggerRoutes = notificationTriggerRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const sequelize_1 = require("sequelize");
const fcm_notification_service_1 = require("../../../infrastructure/services/fcm_notification.service");
const models_1 = require("../../../infrastructure/database/sequelize/models");
const constants_1 = require("../../../shared/constants");
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
function notificationTriggerRoutes() {
    const router = (0, express_1.Router)();
    const fcmService = tsyringe_1.container.resolve(fcm_notification_service_1.FcmNotificationService);
    // POST /api/v1/news/recalls/trigger
    router.post('/recalls/trigger', async (req, res) => {
        try {
            const { productName, reason, url } = req.body;
            if (!productName || !reason) {
                return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'productName and reason are required'
                });
            }
            // Extract unique words from productName for a loose database search
            const queryTokens = productName.split(/\s+/).filter((t) => t.length > 1);
            const histories = await models_1.ScanHistory.findAll({
                where: {
                    [sequelize_1.Op.or]: queryTokens.map((t) => ({
                        title: {
                            [sequelize_1.Op.like]: `%${t}%`
                        }
                    }))
                }
            });
            // Semantic filtering in memory
            const matchedHistories = histories.filter((h) => isSemanticMatch(h.title, productName));
            if (matchedHistories.length === 0) {
                return res.status(constants_1.HttpStatus.OK).json({
                    success: true,
                    message: 'No users have scanned this product. No notifications sent.',
                    matchedUsers: 0
                });
            }
            // Get unique user IDs
            const userIds = Array.from(new Set(matchedHistories.map((h) => h.userId)));
            // Find matching users with push enabled and active fcmToken
            const users = await models_1.User.findAll({
                where: {
                    id: {
                        [sequelize_1.Op.in]: userIds
                    },
                    pushEnabled: true,
                    fcmToken: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            });
            let sentCount = 0;
            for (const user of users) {
                const success = await fcmService.sendPushNotification(user.id, user.fcmToken, '🔴 CẢNH BÁO THU HỒI KHẨN CẤP', `Sản phẩm "${productName}" bạn từng quét vừa bị yêu cầu thu hồi do ${reason}. Vui lòng ngừng sử dụng!`, {
                    type: 'recall',
                    url: url || '',
                    productName
                });
                if (success)
                    sentCount++;
            }
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                message: 'Processed food recall alert.',
                matchedUsers: userIds.length,
                notificationsSent: sentCount
            });
        }
        catch (error) {
            console.error('[Notification Trigger Recalls Error]:', error);
            return res.status(constants_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to process recalls trigger.',
                error: error.message
            });
        }
    });
    // POST /api/v1/news/allergies/trigger
    router.post('/allergies/trigger', async (req, res) => {
        try {
            const { productName, allergen } = req.body;
            if (!productName || !allergen) {
                return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'productName and allergen are required'
                });
            }
            // Find all users with push notifications enabled and a token
            const users = await models_1.User.findAll({
                where: {
                    pushEnabled: true,
                    fcmToken: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            });
            let sentCount = 0;
            const matchedUserIds = [];
            for (const user of users) {
                // allergies is a JSON array
                const userAllergies = user.allergies || [];
                // Match allergen semantically (e.g. "Đậu phộng (Lạc)" matches "Đậu phộng")
                const hasAllergy = userAllergies.some((a) => isAllergenMatch(a, allergen));
                if (hasAllergy) {
                    matchedUserIds.push(user.id);
                    const success = await fcmService.sendPushNotification(user.id, user.fcmToken, '⚠️ CẢNH BÁO DỊ ỨNG CÁ NHÂN HÓA', `Lưu ý: Món "${productName}" mới ra mắt có chứa ${allergen}. Hãy cẩn thận vì nó có trong danh sách dị ứng của bạn!`, {
                        type: 'allergy',
                        productName,
                        allergen
                    });
                    if (success)
                        sentCount++;
                }
            }
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                message: 'Processed allergy alert.',
                matchedUsers: matchedUserIds.length,
                notificationsSent: sentCount
            });
        }
        catch (error) {
            console.error('[Notification Trigger Allergies Error]:', error);
            return res.status(constants_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to process allergies trigger.',
                error: error.message
            });
        }
    });
    return router;
}
