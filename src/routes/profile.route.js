const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

// GET /profile/options
router.get('/options', profileController.getOptions);

module.exports = router;
