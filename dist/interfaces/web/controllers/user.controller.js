"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const tsyringe_1 = require("tsyringe");
const user_management_use_cases_1 = require("../../../application/use_cases/user/user_management.use_cases");
const constants_1 = require("../../../shared/constants");
let UserController = class UserController {
    getUsersUseCase;
    getUserByIdUseCase;
    createUserUseCase;
    updateUserUseCase;
    constructor(getUsersUseCase, getUserByIdUseCase, createUserUseCase, updateUserUseCase) {
        this.getUsersUseCase = getUsersUseCase;
        this.getUserByIdUseCase = getUserByIdUseCase;
        this.createUserUseCase = createUserUseCase;
        this.updateUserUseCase = updateUserUseCase;
    }
    getUsers = async (req, res) => {
        try {
            const users = await this.getUsersUseCase.execute();
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                data: users
            });
        }
        catch (error) {
            console.error('[UserController getUsers Error]:', error);
            return res.status(constants_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                code: constants_1.ErrorCodes.DATABASE_ERROR,
                message: 'An error occurred while retrieving users.',
                error: error.message
            });
        }
    };
    getUserById = async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const user = await this.getUserByIdUseCase.execute(id);
            if (!user) {
                return res.status(constants_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error('[UserController getUserById Error]:', error);
            return res.status(constants_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                code: constants_1.ErrorCodes.DATABASE_ERROR,
                message: 'An error occurred while retrieving the user.',
                error: error.message
            });
        }
    };
    createUser = async (req, res) => {
        try {
            const user = await this.createUserUseCase.execute(req.body);
            return res.status(constants_1.HttpStatus.CREATED).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error('[UserController createUser Error]:', error);
            return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                code: constants_1.ErrorCodes.VALIDATION_ERROR,
                message: 'An error occurred while creating the user.',
                error: error.message
            });
        }
    };
    updateUser = async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const user = await this.updateUserUseCase.execute(id, req.body);
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error('[UserController updateUser Error]:', error);
            if (error.message === 'User not found') {
                return res.status(constants_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }
            return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                code: constants_1.ErrorCodes.VALIDATION_ERROR,
                message: 'An error occurred while updating the user.',
                error: error.message
            });
        }
    };
};
exports.UserController = UserController;
exports.UserController = UserController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(user_management_use_cases_1.GetUsersUseCase)),
    __param(1, (0, tsyringe_1.inject)(user_management_use_cases_1.GetUserByIdUseCase)),
    __param(2, (0, tsyringe_1.inject)(user_management_use_cases_1.CreateUserUseCase)),
    __param(3, (0, tsyringe_1.inject)(user_management_use_cases_1.UpdateUserUseCase)),
    __metadata("design:paramtypes", [user_management_use_cases_1.GetUsersUseCase,
        user_management_use_cases_1.GetUserByIdUseCase,
        user_management_use_cases_1.CreateUserUseCase,
        user_management_use_cases_1.UpdateUserUseCase])
], UserController);
