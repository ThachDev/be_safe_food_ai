const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');

router.get('/', newsController.getNewsWarnings);
router.get('/read', newsController.getNewsArticle);

module.exports = router;
