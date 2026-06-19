import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { GetNewsWarningsUseCase } from '../../../application/use_cases/news/news_management.use_cases';
import { HttpStatus } from '../../../shared/constants';

@injectable()
export class NewsController {
  constructor(
    @inject(GetNewsWarningsUseCase) private getNewsWarningsUseCase: GetNewsWarningsUseCase
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
}
