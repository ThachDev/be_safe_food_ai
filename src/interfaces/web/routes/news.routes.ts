import { Router } from 'express';
import { container } from 'tsyringe';
import { NewsController } from '../controllers/news.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export function newsRoutes(): Router {
  const router = Router();
  const newsController = container.resolve(NewsController);

  router.get('/warnings', authMiddleware, newsController.getNewsWarnings);
  router.get('/article', authMiddleware, newsController.getNewsArticle);

  return router;
}
