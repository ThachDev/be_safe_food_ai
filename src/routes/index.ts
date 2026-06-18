import { Router, Request, Response } from 'express';
const router = Router();
const { authRoutes } = require('../interfaces/web/routes/auth.routes');
const { chatRoutes } = require('../interfaces/web/routes/chat.routes');
const { scanRoutes } = require('../interfaces/web/routes/scan.routes');
const userRoutes = require('./user.route');
const newsRoutes = require('./news.route');
const profileRoutes = require('./profile.route');

// Mount routes
router.use('/auth', authRoutes());
router.use('/users', userRoutes);
router.use('/chat', chatRoutes());
router.use('/news', newsRoutes);
router.use('/scans', scanRoutes());
router.use('/profile', profileRoutes);
// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API server is running and healthy.',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
