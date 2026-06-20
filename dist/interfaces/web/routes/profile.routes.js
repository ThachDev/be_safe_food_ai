"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoutes = profileRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const profile_controller_1 = require("../controllers/profile.controller");
function profileRoutes() {
    const router = (0, express_1.Router)();
    const profileController = tsyringe_1.container.resolve(profile_controller_1.ProfileController);
    router.get('/options', profileController.getOptions);
    return router;
}
