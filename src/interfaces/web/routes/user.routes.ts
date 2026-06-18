import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/user.controller';

export function userRoutes(): Router {
  const router = Router();
  const userController = container.resolve(UserController);

  router.get('/', userController.getUsers);
  router.get('/:id', userController.getUserById);
  router.post('/', userController.createUser);
  router.put('/:id', userController.updateUser);

  return router;
}
