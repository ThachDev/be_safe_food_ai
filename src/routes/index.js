const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const chatRoutes = require('./chat.route');
const newsRoutes = require('./news.route');
const scanRoutes = require('./scan.route');
const profileRoutes = require('./profile.route');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/news', newsRoutes);
router.use('/scans', scanRoutes);
router.use('/profile', profileRoutes);
// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API server is running and healthy.',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
