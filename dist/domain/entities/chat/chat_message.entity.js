"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
class ChatMessage {
    id;
    userId;
    sessionId;
    message;
    isUser;
    createdAt;
    updatedAt;
    scanHistoryId;
    constructor(id, userId, sessionId, message, isUser, createdAt, updatedAt, scanHistoryId) {
        this.id = id;
        this.userId = userId;
        this.sessionId = sessionId;
        this.message = message;
        this.isUser = isUser;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.scanHistoryId = scanHistoryId;
    }
}
exports.ChatMessage = ChatMessage;
