"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const user_controller_1 = require("../controllers/user.controller");
function userRoutes() {
    const router = (0, express_1.Router)();
    const userController = tsyringe_1.container.resolve(user_controller_1.UserController);
    router.get('/', userController.getUsers);
    router.get('/:id', userController.getUserById);
    router.post('/', userController.createUser);
    router.put('/:id', userController.updateUser);
    return router;
}
