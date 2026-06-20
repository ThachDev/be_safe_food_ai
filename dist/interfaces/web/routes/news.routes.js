"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsRoutes = newsRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const news_controller_1 = require("../controllers/news.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function newsRoutes() {
    const router = (0, express_1.Router)();
    const newsController = tsyringe_1.container.resolve(news_controller_1.NewsController);
    router.get('/warnings', auth_middleware_1.authMiddleware, newsController.getNewsWarnings);
    return router;
}
