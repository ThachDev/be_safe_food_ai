const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// POST /api/v1/auth/sync
router.post('/sync', authMiddleware, authController.sync);

// POST /api/v1/auth/register-request
router.post('/register-request', authController.registerRequest);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);


module.exports = router;
