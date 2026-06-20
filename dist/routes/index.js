"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = require("../interfaces/web/routes/auth.routes");
const chat_routes_1 = require("../interfaces/web/routes/chat.routes");
const scan_routes_1 = require("../interfaces/web/routes/scan.routes");
const user_routes_1 = require("../interfaces/web/routes/user.routes");
const news_routes_1 = require("../interfaces/web/routes/news.routes");
const profile_routes_1 = require("../interfaces/web/routes/profile.routes");
const notification_trigger_routes_1 = require("../interfaces/web/routes/notification_trigger.routes");
const app_routes_1 = require("../interfaces/web/routes/app.routes");
const router = (0, express_1.Router)();
// Mount routes
router.use('/auth', (0, auth_routes_1.authRoutes)());
router.use('/users', (0, user_routes_1.userRoutes)());
router.use('/chat', (0, chat_routes_1.chatRoutes)());
router.use('/news', (0, news_routes_1.newsRoutes)());
router.use('/news', (0, notification_trigger_routes_1.notificationTriggerRoutes)());
router.use('/scans', (0, scan_routes_1.scanRoutes)());
router.use('/profile', (0, profile_routes_1.profileRoutes)());
router.use('/app', (0, app_routes_1.appRoutes)());
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API server is running and healthy.',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
