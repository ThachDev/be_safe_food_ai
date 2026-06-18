import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';

import { authMiddleware } from '../middlewares/auth.middleware';

export function authRoutes(): Router {
  const router = Router();
  // Lấy instance của AuthController từ DI container
  const authController = container.resolve(AuthController);

  // Endpoint to sync firebase user data
  router.post('/sync', authMiddleware, authController.sync);

  // Email/Password Registration Flow
  router.post('/register', authController.registerRequest);
  router.post('/register/verify', authController.verifyOtp);

  // Email/Password Forgot Password Flow
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/forgot-password/verify', authController.verifyOtpForgot);
  router.post('/reset-password', authController.resetPassword);

  return router;
}
