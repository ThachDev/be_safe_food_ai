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
exports.SequelizeChatRepository = void 0;
const tsyringe_1 = require("tsyringe");
const chat_message_entity_1 = require("../../domain/entities/chat/chat_message.entity");
const chat_message_model_1 = __importDefault(require("../database/sequelize/models/chat/chat_message.model"));
const models_1 = __importDefault(require("../database/sequelize/models"));
let SequelizeChatRepository = class SequelizeChatRepository {
    mapToEntity(record) {
        return new chat_message_entity_1.ChatMessage(record.id, record.userId, record.sessionId, record.message, record.isUser, record.createdAt, record.updatedAt, record.scanHistoryId);
    }
    async create(chatMessage) {
        const msg = await chat_message_model_1.default.create({
            userId: chatMessage.userId,
            sessionId: chatMessage.sessionId,
            message: chatMessage.message,
            isUser: chatMessage.isUser,
            scanHistoryId: chatMessage.scanHistoryId
        });
        return this.mapToEntity(msg);
    }
    async findHistory(userId, sessionId) {
        const messages = await chat_message_model_1.default.findAll({
            where: { userId, sessionId },
            order: [['createdAt', 'ASC']]
        });
        return messages.map((msg) => this.mapToEntity(msg));
    }
    async findSessions(userId) {
        const sessions = await chat_message_model_1.default.findAll({
            attributes: [
                'sessionId',
                [models_1.default.sequelize.fn('MAX', models_1.default.sequelize.col('created_at')), 'lastActivity']
            ],
            where: { userId },
            group: ['sessionId'],
            order: [[models_1.default.sequelize.literal('lastActivity'), 'DESC']],
            raw: true
        });
        const result = [];
        for (let session of sessions) {
            const firstMsg = await chat_message_model_1.default.findOne({
                where: { userId, sessionId: session.sessionId, isUser: true },
                order: [['createdAt', 'ASC']],
                attributes: ['message', 'scanHistoryId']
            });
            result.push({
                sessionId: session.sessionId,
                lastActivity: session.lastActivity,
                title: firstMsg ? (firstMsg.message.substring(0, 30) + '...') : 'New Chat',
                scanHistoryId: firstMsg ? firstMsg.scanHistoryId : undefined
            });
        }
        return result;
    }
    async deleteSession(userId, sessionId) {
        await chat_message_model_1.default.destroy({
            where: { userId, sessionId }
        });
    }
};
exports.SequelizeChatRepository = SequelizeChatRepository;
exports.SequelizeChatRepository = SequelizeChatRepository = __decorate([
    (0, tsyringe_1.injectable)()
], SequelizeChatRepository);
