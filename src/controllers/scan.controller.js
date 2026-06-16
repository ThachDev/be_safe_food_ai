const db = require('../models');
const { HttpStatus } = require('../constants');
const AIService = require('../services/ai.service');
const CloudinaryService = require('../services/cloudinary.service');

class ScanController {
  /**
   * Helper to find user by firebaseUid
   */
  static async _findUser(firebaseUid) {
    return await db.User.findOne({ where: { firebaseUid } });
  }

  /**
   * Analyze image using Groq Vision AI
   */
  static async analyzeScan(req, res, next) {
    try {
      const { scanType, base64Image, additionalContext } = req.body;

      if (!scanType || !base64Image) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'scanType and base64Image are required'
        });
      }

      const firebaseUid = req.user.uid;
      const user = await ScanController._findUser(firebaseUid);
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      console.log(`[ScanController.analyzeScan] Running AI Vision check for mode: ${scanType}`);
      const [aiResult, uploadedImageUrl] = await Promise.all([
        AIService.analyzeImage(scanType, base64Image, user, additionalContext || null),
        CloudinaryService.uploadImage(base64Image)
      ]);

      let title = 'Sản phẩm';
      let category = 'Thực phẩm';
      let rating = '7.5';
      let scoreText = 'Cần lưu ý';
      let safeLevel = 'Chưa xác định';
      let personalWarnings = [];
      let healthyAlternatives = [];
      let cleanedResult = aiResult;

      try {
        const parsed = JSON.parse(aiResult);
        
        // Phát hiện nếu không phải thực phẩm
        if (parsed.isFood === false) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Hình ảnh này dường như không phải là thực phẩm hoặc bao bì. Vui lòng chụp lại.'
          });
        }

        title = parsed.title || title;
        category = parsed.category || category;
        rating = parsed.rating || rating;
        scoreText = parsed.scoreText || scoreText;
        safeLevel = parsed.safeLevel || safeLevel;
        personalWarnings = parsed.personalWarnings || [];
        healthyAlternatives = parsed.healthyAlternatives || [];
        
        // Save the details object as a JSON string to be sent to frontend
        if (parsed.details) {
          cleanedResult = JSON.stringify(parsed.details);
        }
      } catch (parseError) {
        console.warn('[ScanController.analyzeScan] Could not parse AI result as JSON. Using fallback.', parseError);
        // Fallback for unexpected format
        cleanedResult = aiResult;
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          title,
          category,
          rating,
          scoreText,
          safeLevel,
          personalWarnings,
          healthyAlternatives,
          aiResult: cleanedResult || aiResult,
          imageUrl: uploadedImageUrl
        }
      });
    } catch (error) {
      console.error('[ScanController.analyzeScan] Error:', error);
      next(error);
    }
  }

  /**
   * Create a new scan history entry
   */
  static async createScan(req, res, next) {
    try {
      const firebaseUid = req.user.uid;
      const user = await ScanController._findUser(firebaseUid);
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      const { scanType, title, category, imageUrl, rating, scoreText, safeLevel, aiResult, personalWarnings, healthyAlternatives } = req.body;

      if (!scanType || !title || !category || !rating || !scoreText || !safeLevel || !aiResult) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'Missing required fields for scan history'
        });
      }

      const scan = await db.ScanHistory.create({
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

      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: scan
      });
    } catch (error) {
      console.error('[ScanController.createScan] Error:', error);
      next(error);
    }
  }

  /**
   * Fetch all scan history items for the user
   */
  static async getScans(req, res, next) {
    try {
      const firebaseUid = req.user.uid;
      const user = await ScanController._findUser(firebaseUid);
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      const scans = await db.ScanHistory.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']]
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        data: scans
      });
    } catch (error) {
      console.error('[ScanController.getScans] Error:', error);
      next(error);
    }
  }

  /**
   * Delete a scan history entry
   */
  static async deleteScan(req, res, next) {
    try {
      const firebaseUid = req.user.uid;
      const user = await ScanController._findUser(firebaseUid);
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'Scan ID is required'
        });
      }

      const deletedCount = await db.ScanHistory.destroy({
        where: { id, userId: user.id }
      });

      if (deletedCount === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'SCAN_NOT_FOUND',
          message: 'Scan history item not found or does not belong to you'
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Scan history entry deleted successfully'
      });
    } catch (error) {
      console.error('[ScanController.deleteScan] Error:', error);
      next(error);
    }
  }
}

module.exports = ScanController;
