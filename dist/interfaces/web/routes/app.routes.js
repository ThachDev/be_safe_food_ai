"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRoutes = appRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const app_controller_1 = require("../controllers/app.controller");
function appRoutes() {
    const router = (0, express_1.Router)();
    const appController = tsyringe_1.container.resolve(app_controller_1.AppController);
    router.get('/version', appController.getVersion);
    return router;
}
