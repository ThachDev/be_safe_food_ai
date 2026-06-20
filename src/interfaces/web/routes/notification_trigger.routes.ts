import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { Op } from 'sequelize';
import { FcmNotificationService } from '../../../infrastructure/services/fcm_notification.service';
import { ScanHistory, User } from '../../../infrastructure/database/sequelize/models';
import { HttpStatus } from '../../../shared/constants';

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s]/g, '') // remove special characters
    .trim();
}

function isSemanticMatch(nameA: string, nameB: string): boolean {
  const normA = normalizeString(nameA);
  const normB = normalizeString(nameB);
  
  const tokensA = new Set(normA.split(/\s+/).filter(w => w.length > 1));
  const tokensB = new Set(normB.split(/\s+/).filter(w => w.length > 1));
  
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  
  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const minSize = Math.min(tokensA.size, tokensB.size);
  const overlapRatio = intersection.size / minSize;
  
  const isSubstring = normA.includes(normB) || normB.includes(normA);
  
  return overlapRatio >= 0.7 || isSubstring;
}

function isAllergenMatch(userAllergy: string, targetAllergen: string): boolean {
  const normUser = normalizeString(userAllergy);
  const normTarget = normalizeString(targetAllergen);
  return normUser.includes(normTarget) || normTarget.includes(normUser);
}

export function notificationTriggerRoutes(): Router {
  const router = Router();
  const fcmService = container.resolve(FcmNotificationService);

  // POST /api/v1/news/recalls/trigger
  router.post('/recalls/trigger', async (req: Request, res: Response) => {
    try {
      const { productName, reason, url } = req.body;
      if (!productName || !reason) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'productName and reason are required'
        });
      }

      // Extract unique words from productName for a loose database search
      const queryTokens = productName.split(/\s+/).filter((t: string) => t.length > 1);
      
      const histories = await ScanHistory.findAll({
        where: {
          [Op.or]: queryTokens.map((t: string) => ({
            title: {
              [Op.like]: `%${t}%`
            }
          }))
        }
      });

      // Semantic filtering in memory
      const matchedHistories = histories.filter((h: any) => isSemanticMatch(h.title, productName));

      if (matchedHistories.length === 0) {
        return res.status(HttpStatus.OK).json({
          success: true,
          message: 'No users have scanned this product. No notifications sent.',
          matchedUsers: 0
        });
      }

      // Get unique user IDs
      const userIds = Array.from(new Set(matchedHistories.map((h: any) => h.userId)));

      // Find matching users with push enabled and active fcmToken
      const users = await User.findAll({
        where: {
          id: {
            [Op.in]: userIds
          },
          pushEnabled: true,
          fcmToken: {
            [Op.ne]: null
          }
        }
      });

      let sentCount = 0;
      for (const user of users as any[]) {
        const success = await fcmService.sendPushNotification(
          user.id,
          user.fcmToken,
          '🔴 CẢNH BÁO THU HỒI KHẨN CẤP',
          `Sản phẩm "${productName}" bạn từng quét vừa bị yêu cầu thu hồi do ${reason}. Vui lòng ngừng sử dụng!`,
          {
            type: 'recall',
            url: url || '',
            productName
          }
        );
        if (success) sentCount++;
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Processed food recall alert.',
        matchedUsers: userIds.length,
        notificationsSent: sentCount
      });
    } catch (error: any) {
      console.error('[Notification Trigger Recalls Error]:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to process recalls trigger.',
        error: error.message
      });
    }
  });

  // POST /api/v1/news/allergies/trigger
  router.post('/allergies/trigger', async (req: Request, res: Response) => {
    try {
      const { productName, allergen } = req.body;
      if (!productName || !allergen) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'productName and allergen are required'
        });
      }

      // Find all users with push notifications enabled and a token
      const users = await User.findAll({
        where: {
          pushEnabled: true,
          fcmToken: {
            [Op.ne]: null
          }
        }
      });

      let sentCount = 0;
      const matchedUserIds: number[] = [];

      for (const user of users as any[]) {
        // allergies is a JSON array
        const userAllergies: string[] = user.allergies || [];
        // Match allergen semantically (e.g. "Đậu phộng (Lạc)" matches "Đậu phộng")
        const hasAllergy = userAllergies.some((a) => isAllergenMatch(a, allergen));

        if (hasAllergy) {
          matchedUserIds.push(user.id);
          const success = await fcmService.sendPushNotification(
            user.id,
            user.fcmToken,
            '⚠️ CẢNH BÁO DỊ ỨNG CÁ NHÂN HÓA',
            `Lưu ý: Món "${productName}" mới ra mắt có chứa ${allergen}. Hãy cẩn thận vì nó có trong danh sách dị ứng của bạn!`,
            {
              type: 'allergy',
              productName,
              allergen
            }
          );
          if (success) sentCount++;
        }
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Processed allergy alert.',
        matchedUsers: matchedUserIds.length,
        notificationsSent: sentCount
      });
    } catch (error: any) {
      console.error('[Notification Trigger Allergies Error]:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to process allergies trigger.',
        error: error.message
      });
    }
  });

  return router;
}

