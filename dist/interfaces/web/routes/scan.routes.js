"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanRoutes = scanRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const scan_controller_1 = require("../controllers/scan.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function scanRoutes() {
    const router = (0, express_1.Router)();
    const scanController = tsyringe_1.container.resolve(scan_controller_1.ScanController);
    router.post('/', auth_middleware_1.authMiddleware, scanController.createScan);
    router.post('/analyze', auth_middleware_1.authMiddleware, scanController.analyzeScan);
    router.get('/', auth_middleware_1.authMiddleware, scanController.getScans);
    router.delete('/:id', auth_middleware_1.authMiddleware, scanController.deleteScan);
    return router;
}
