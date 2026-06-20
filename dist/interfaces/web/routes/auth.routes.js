"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function authRoutes() {
    const router = (0, express_1.Router)();
    // Lấy instance của AuthController từ DI container
    const authController = tsyringe_1.container.resolve(auth_controller_1.AuthController);
    // Endpoint to sync firebase user data
    router.post('/sync', auth_middleware_1.authMiddleware, authController.sync);
    // Email/Password Registration Flow
    router.post('/register', authController.registerRequest);
    router.post('/register/verify', authController.verifyOtp);
    // Email/Password Forgot Password Flow
    router.post('/forgot-password', authController.forgotPassword);
    router.post('/forgot-password/verify', authController.verifyOtpForgot);
    router.post('/reset-password', authController.resetPassword);
    return router;
}
