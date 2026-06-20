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
exports.NewsController = void 0;
const tsyringe_1 = require("tsyringe");
const news_management_use_cases_1 = require("../../../application/use_cases/news/news_management.use_cases");
const constants_1 = require("../../../shared/constants");
let NewsController = class NewsController {
    getNewsWarningsUseCase;
    constructor(getNewsWarningsUseCase) {
        this.getNewsWarningsUseCase = getNewsWarningsUseCase;
    }
    getNewsWarnings = async (req, res, next) => {
        try {
            const articles = await this.getNewsWarningsUseCase.execute();
            res.status(constants_1.HttpStatus.OK).json({
                success: true,
                message: 'News fetched successfully',
                data: articles
            });
        }
        catch (error) {
            console.error('[NewsController] Error parsing RSS:', error);
            next(error);
        }
    };
};
exports.NewsController = NewsController;
exports.NewsController = NewsController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(news_management_use_cases_1.GetNewsWarningsUseCase)),
    __metadata("design:paramtypes", [news_management_use_cases_1.GetNewsWarningsUseCase])
], NewsController);
