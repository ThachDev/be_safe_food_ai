import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from '../controllers/chat.controller';

import { authMiddleware as verifyToken } from '../middlewares/auth.middleware';

export function chatRoutes(): Router {
  const router = Router();
  const chatController = container.resolve(ChatController);

  // Protect chat routes with token verification
  router.use(verifyToken);

  router.post('/analyze', chatController.analyze);
  router.post('/analyze-general', chatController.analyzeGeneral);
  router.get('/history', chatController.getHistory);
  router.get('/sessions', chatController.getSessions);
  router.delete('/sessions/:sessionId', chatController.deleteSession);

  return router;
}
