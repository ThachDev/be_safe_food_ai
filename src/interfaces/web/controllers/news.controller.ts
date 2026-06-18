import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { GetNewsWarningsUseCase, ExtractArticleUseCase } from '../../../application/use_cases/news/news_management.use_cases';
import { HttpStatus } from '../../../shared/constants';

@injectable()
export class NewsController {
  constructor(
    @inject(GetNewsWarningsUseCase) private getNewsWarningsUseCase: GetNewsWarningsUseCase,
    @inject(ExtractArticleUseCase) private extractArticleUseCase: ExtractArticleUseCase
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

  getNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.query.url as string;
      const article = await this.extractArticleUseCase.execute(url);
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Article extracted successfully',
        data: article
      });
    } catch (error: any) {
      if (error.message === 'Missing URL parameter') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      }
      console.error('[NewsController] Error extracting article:', error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to extract article content'
      });
    }
  };
}
