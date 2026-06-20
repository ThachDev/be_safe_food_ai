import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { HttpStatus } from '../../../shared/constants';
import AppVersion from '../../../infrastructure/database/sequelize/models/app_version.model';

@injectable()
export class AppController {
  getVersion = async (req: Request, res: Response) => {
    try {
      let versionConfig = await AppVersion.findOne();

      if (!versionConfig) {
        versionConfig = await AppVersion.create({
          latestVersion: '1.0.4+4',
          storeUrl: 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Latest app version retrieved successfully',
        data: {
          latestVersion: (versionConfig as any).latestVersion,
          storeUrl: (versionConfig as any).storeUrl
        }
      });
    } catch (error: any) {
      console.error('[App Controller] Error getting version:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve app version',
        error: error.message
      });
    }
  };
}
