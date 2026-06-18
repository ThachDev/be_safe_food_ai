import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { AnalyzeScanUseCase } from '../../../application/use_cases/scan/analyze_scan.use_case';
import { 
  CreateScanUseCase, 
  GetScansUseCase, 
  DeleteScanUseCase 
} from '../../../application/use_cases/scan/scan_management.use_cases';

const { HttpStatus } = require('../../../constants');

@injectable()
export class ScanController {
  constructor(
    @inject(AnalyzeScanUseCase) private analyzeScanUseCase: AnalyzeScanUseCase,
    @inject(CreateScanUseCase) private createScanUseCase: CreateScanUseCase,
    @inject(GetScansUseCase) private getScansUseCase: GetScansUseCase,
    @inject(DeleteScanUseCase) private deleteScanUseCase: DeleteScanUseCase
  ) {}

  analyzeScan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scanType, base64Image, additionalContext } = req.body;
      const firebaseUid = (req as any).user.uid;

      if (!scanType || !base64Image) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'scanType and base64Image are required'
        });
      }

      console.log(`[ScanController.analyzeScan] Running AI Vision check for mode: ${scanType}`);
      const result = await this.analyzeScanUseCase.execute(firebaseUid, scanType, base64Image, additionalContext);

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
      if (error.message === 'Hình ảnh này dường như không phải là thực phẩm hoặc bao bì. Vui lòng chụp lại.') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      }
      console.error('[ScanController.analyzeScan] Error:', error);
      next(error);
    }
  };

  createScan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const scan = await this.createScanUseCase.execute(firebaseUid, req.body);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: scan
      });
    } catch (error: any) {
      if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
      if (error.message === 'Missing required fields for scan history') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: 'BAD_REQUEST',
          message: error.message
        });
      }
      console.error('[ScanController.createScan] Error:', error);
      next(error);
    }
  };

  getScans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const scans = await this.getScansUseCase.execute(firebaseUid);

      return res.status(HttpStatus.OK).json({
        success: true,
        data: scans
      });
    } catch (error: any) {
      if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
      console.error('[ScanController.getScans] Error:', error);
      next(error);
    }
  };

  deleteScan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const id = parseInt(req.params.id as string, 10);
      
      if (isNaN(id)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: 'BAD_REQUEST',
          message: 'Valid Scan ID is required'
        });
      }

      await this.deleteScanUseCase.execute(firebaseUid, id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Scan history entry deleted successfully'
      });
    } catch (error: any) {
      if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
      if (error.message === 'SCAN_NOT_FOUND') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          code: 'SCAN_NOT_FOUND',
          message: 'Scan history item not found or does not belong to you'
        });
      }
      console.error('[ScanController.deleteScan] Error:', error);
      next(error);
    }
  };
}
