const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API server is running and healthy.',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
