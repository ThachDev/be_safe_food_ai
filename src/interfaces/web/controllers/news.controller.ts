import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { GetNewsWarningsUseCase } from '../../../application/use_cases/news/news_management.use_cases';
import { CronSyncNewsUseCase } from '../../../application/use_cases/news/news_cron_sync.use_case';
import { HttpStatus } from '../../../shared/constants';

@injectable()
export class NewsController {
  constructor(
    @inject(GetNewsWarningsUseCase) private getNewsWarningsUseCase: GetNewsWarningsUseCase,
    @inject(CronSyncNewsUseCase) private cronSyncNewsUseCase: CronSyncNewsUseCase
  ) {}

  getNewsWarnings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const articles = await this.getNewsWarningsUseCase.execute();
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'News fetched successfully',
        data: articles
      });
    } catch (error) {
      console.error('[NewsController] Error parsing RSS:', error);
      next(error);
    }
  };

  cronSync = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token as string;
      const expectedToken = process.env.CRON_SYNC_TOKEN || 'safe_food_ai_secret';
      
      if (token !== expectedToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized. Invalid security token.'
        });
      }

      const result = await this.cronSyncNewsUseCase.execute();
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('[NewsController] Error in cronSync:', error);
      next(error);
    }
  };
}

