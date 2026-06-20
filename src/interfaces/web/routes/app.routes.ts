import { Router } from 'express';
import { container } from 'tsyringe';
import { AppController } from '../controllers/app.controller';

export function appRoutes(): Router {
  const router = Router();
  const appController = container.resolve(AppController);

  router.get('/version', appController.getVersion);

  return router;
}
