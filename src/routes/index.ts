import { Router, Request, Response } from 'express';
import { authRoutes } from '../interfaces/web/routes/auth.routes';
import { chatRoutes } from '../interfaces/web/routes/chat.routes';
import { scanRoutes } from '../interfaces/web/routes/scan.routes';
import { userRoutes } from '../interfaces/web/routes/user.routes';
import { newsRoutes } from '../interfaces/web/routes/news.routes';
import { profileRoutes } from '../interfaces/web/routes/profile.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes());
router.use('/users', userRoutes());
router.use('/chat', chatRoutes());
router.use('/news', newsRoutes());
router.use('/scans', scanRoutes());
router.use('/profile', profileRoutes());

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API server is running and healthy.',
    timestamp: new Date().toISOString()
  });
});

export default router;
