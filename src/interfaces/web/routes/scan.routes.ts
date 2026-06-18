import { Router } from 'express';
import { container } from 'tsyringe';
import { ScanController } from '../controllers/scan.controller';

const authMiddleware = require('../../../middlewares/auth.middleware');

export function scanRoutes(): Router {
  const router = Router();
  const scanController = container.resolve(ScanController);

  router.post('/', authMiddleware, scanController.createScan);
  router.post('/analyze', authMiddleware, scanController.analyzeScan);
  router.get('/', authMiddleware, scanController.getScans);
  router.delete('/:id', authMiddleware, scanController.deleteScan);

  return router;
}
