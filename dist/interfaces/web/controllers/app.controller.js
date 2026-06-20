"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const tsyringe_1 = require("tsyringe");
const constants_1 = require("../../../shared/constants");
const app_version_model_1 = __importDefault(require("../../../infrastructure/database/sequelize/models/app_version.model"));
let AppController = class AppController {
    getVersion = async (req, res) => {
        try {
            let versionConfig = await app_version_model_1.default.findOne();
            if (!versionConfig) {
                versionConfig = await app_version_model_1.default.create({
                    latestVersion: '1.0.4+4',
                    storeUrl: 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai',
                });
            }
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                message: 'Latest app version retrieved successfully',
                data: {
                    latestVersion: versionConfig.latestVersion,
                    storeUrl: versionConfig.storeUrl
                }
            });
        }
        catch (error) {
            console.error('[App Controller] Error getting version:', error);
            return res.status(constants_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve app version',
                error: error.message
            });
        }
    };
};
exports.AppController = AppController;
exports.AppController = AppController = __decorate([
    (0, tsyringe_1.injectable)()
], AppController);
