const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Protect chat routes with token verification
router.use(verifyToken);

router.post('/analyze', ChatController.analyze);
router.post('/analyze-general', ChatController.analyzeGeneral);
router.get('/history', ChatController.getHistory);

module.exports = router;
