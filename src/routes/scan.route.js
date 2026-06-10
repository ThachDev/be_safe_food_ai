const express = require('express');
const router = express.Router();
const ScanController = require('../controllers/scan.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, ScanController.createScan);
router.post('/analyze', authMiddleware, ScanController.analyzeScan);
router.get('/', authMiddleware, ScanController.getScans);
router.delete('/:id', authMiddleware, ScanController.deleteScan);

module.exports = router;
