const db = require('../models');
const { HttpStatus } = require('../constants');
const AIService = require('../services/ai.service');

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
      const { scanType, base64Image } = req.body;

      if (!scanType || !base64Image) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'scanType and base64Image are required'
        });
      }

      console.log(`[ScanController.analyzeScan] Running AI Vision check for mode: ${scanType}`);
      const aiResult = await AIService.analyzeImage(scanType, base64Image);

      // Parse structured header fields using RegExp
      let title = 'Sản phẩm';
      let category = 'Thực phẩm';
      let rating = '7.5';
      let scoreText = 'Cần lưu ý';
      let safeLevel = 'Chưa xác định';

      const titleMatch = aiResult.match(/\[TÊN SẢN PHẨM\]:\s*([^\n]+)/);
      if (titleMatch) title = titleMatch[1].trim();

      const categoryMatch = aiResult.match(/\[DANH MỤC\]:\s*([^\n]+)/);
      if (categoryMatch) category = categoryMatch[1].trim();

      const ratingMatch = aiResult.match(/\[ĐIỂM SỐ\]:\s*([^\n]+)/);
      if (ratingMatch) {
        rating = ratingMatch[1].replace('/10', '').trim();
      }

      const scoreMatch = aiResult.match(/\[ĐÁNH GIÁ\]:\s*([^\n]+)/);
      if (scoreMatch) scoreText = scoreMatch[1].trim();

      const summaryMatch = aiResult.match(/\[TÓM TẮT\]:\s*([^\n]+)/);
      if (summaryMatch) safeLevel = summaryMatch[1].trim();

      // Clean the AI result to remove the parse header tags
      const cleanedResult = aiResult
        .replace(/\[TÊN SẢN PHẨM\]:[^\n]*\n?/g, '')
        .replace(/\[DANH MỤC\]:[^\n]*\n?/g, '')
        .replace(/\[ĐIỂM SỐ\]:[^\n]*\n?/g, '')
        .replace(/\[ĐÁNH GIÁ\]:[^\n]*\n?/g, '')
        .replace(/\[TÓM TẮT\]:[^\n]*\n?/g, '')
        .trim();

      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          title,
          category,
          rating,
          scoreText,
          safeLevel,
          aiResult: cleanedResult || aiResult,
          base64Image
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

      const { scanType, title, category, imageUrl, rating, scoreText, safeLevel, aiResult } = req.body;

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
        aiResult
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
