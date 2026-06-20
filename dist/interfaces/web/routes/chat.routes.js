"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = chatRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function chatRoutes() {
    const router = (0, express_1.Router)();
    const chatController = tsyringe_1.container.resolve(chat_controller_1.ChatController);
    // Protect chat routes with token verification
    router.use(auth_middleware_1.authMiddleware);
    router.post('/analyze', chatController.analyze);
    router.post('/analyze-general', chatController.analyzeGeneral);
    router.get('/history', chatController.getHistory);
    router.get('/sessions', chatController.getSessions);
    router.delete('/sessions/:sessionId', chatController.deleteSession);
    return router;
}
