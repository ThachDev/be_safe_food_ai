"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../connection"));
const ChatMessage = connection_1.default.define('ChatMessage', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    sessionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'session_id'
    },
    message: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: false
    },
    isUser: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_user'
    },
    scanHistoryId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'scan_history_id'
    }
}, {
    tableName: 'chat_messages',
    timestamps: true, // Thêm createdAt và updatedAt
});
exports.default = ChatMessage;
