import { Router } from 'express';
import { container } from 'tsyringe';
import { ProfileController } from '../controllers/profile.controller';

export function profileRoutes(): Router {
  const router = Router();
  const profileController = container.resolve(ProfileController);

  router.get('/options', profileController.getOptions);

  return router;
}
