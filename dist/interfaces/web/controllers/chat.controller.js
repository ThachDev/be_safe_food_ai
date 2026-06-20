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
exports.ChatController = void 0;
const tsyringe_1 = require("tsyringe");
const analyze_food_use_case_1 = require("../../../application/use_cases/chat/analyze_food.use_case");
const analyze_general_use_case_1 = require("../../../application/use_cases/chat/analyze_general.use_case");
const chat_management_use_cases_1 = require("../../../application/use_cases/chat/chat_management.use_cases");
let ChatController = class ChatController {
    analyzeFoodUseCase;
    analyzeGeneralUseCase;
    getChatHistoryUseCase;
    getChatSessionsUseCase;
    deleteChatSessionUseCase;
    constructor(analyzeFoodUseCase, analyzeGeneralUseCase, getChatHistoryUseCase, getChatSessionsUseCase, deleteChatSessionUseCase) {
        this.analyzeFoodUseCase = analyzeFoodUseCase;
        this.analyzeGeneralUseCase = analyzeGeneralUseCase;
        this.getChatHistoryUseCase = getChatHistoryUseCase;
        this.getChatSessionsUseCase = getChatSessionsUseCase;
        this.deleteChatSessionUseCase = deleteChatSessionUseCase;
    }
    analyze = async (req, res) => {
        try {
            const firebaseUid = req.user.uid;
            const { sessionId, prompt, base64Image, scanHistoryId } = req.body;
            if (!sessionId || !prompt) {
                return res.status(400).json({ status: 'error', message: 'Prompt and sessionId are required' });
            }
            const result = await this.analyzeFoodUseCase.execute(firebaseUid, sessionId, prompt, base64Image, scanHistoryId);
            return res.status(200).json({ status: 'success', data: result });
        }
        catch (error) {
            console.error('ChatController analyze error:', error);
            return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
        }
    };
    analyzeGeneral = async (req, res) => {
        try {
            const { prompt, base64Image } = req.body;
            if (!prompt) {
                return res.status(400).json({ status: 'error', message: 'Prompt is required' });
            }
            const reply = await this.analyzeGeneralUseCase.execute(prompt, base64Image);
            return res.status(200).json({ status: 'success', data: { reply } });
        }
        catch (error) {
            console.error('ChatController analyzeGeneral error:', error);
            return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
        }
    };
    getHistory = async (req, res) => {
        try {
            const firebaseUid = req.user.uid;
            const sessionId = req.query.sessionId;
            if (!sessionId) {
                return res.status(400).json({ status: 'error', message: 'sessionId is required' });
            }
            const history = await this.getChatHistoryUseCase.execute(firebaseUid, sessionId);
            return res.status(200).json({ status: 'success', data: history });
        }
        catch (error) {
            console.error('ChatController getHistory error:', error);
            return res.status(500).json({ status: 'error', message: 'Could not fetch history' });
        }
    };
    getSessions = async (req, res) => {
        try {
            const firebaseUid = req.user.uid;
            const sessions = await this.getChatSessionsUseCase.execute(firebaseUid);
            return res.status(200).json({ status: 'success', data: sessions });
        }
        catch (error) {
            console.error('ChatController getSessions error:', error);
            return res.status(500).json({ status: 'error', message: 'Could not fetch sessions' });
        }
    };
    deleteSession = async (req, res) => {
        try {
            const firebaseUid = req.user.uid;
            const sessionId = req.params.sessionId;
            if (!sessionId) {
                return res.status(400).json({ status: 'error', message: 'sessionId is required' });
            }
            await this.deleteChatSessionUseCase.execute(firebaseUid, sessionId);
            return res.status(200).json({ status: 'success', message: 'Session deleted' });
        }
        catch (error) {
            console.error('ChatController deleteSession error:', error);
            return res.status(500).json({ status: 'error', message: 'Could not delete session' });
        }
    };
};
exports.ChatController = ChatController;
exports.ChatController = ChatController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(analyze_food_use_case_1.AnalyzeFoodUseCase)),
    __param(1, (0, tsyringe_1.inject)(analyze_general_use_case_1.AnalyzeGeneralUseCase)),
    __param(2, (0, tsyringe_1.inject)(chat_management_use_cases_1.GetChatHistoryUseCase)),
    __param(3, (0, tsyringe_1.inject)(chat_management_use_cases_1.GetChatSessionsUseCase)),
    __param(4, (0, tsyringe_1.inject)(chat_management_use_cases_1.DeleteChatSessionUseCase)),
    __metadata("design:paramtypes", [analyze_food_use_case_1.AnalyzeFoodUseCase,
        analyze_general_use_case_1.AnalyzeGeneralUseCase,
        chat_management_use_cases_1.GetChatHistoryUseCase,
        chat_management_use_cases_1.GetChatSessionsUseCase,
        chat_management_use_cases_1.DeleteChatSessionUseCase])
], ChatController);
