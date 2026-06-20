"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppVersion = exports.ScanHistory = exports.ChatMessage = exports.PasswordReset = exports.PendingUser = exports.User = void 0;
const connection_1 = __importDefault(require("../connection"));
const user_model_1 = __importDefault(require("./user/user.model"));
exports.User = user_model_1.default;
const pending_user_model_1 = __importDefault(require("./auth/pending_user.model"));
exports.PendingUser = pending_user_model_1.default;
const password_reset_model_1 = __importDefault(require("./auth/password_reset.model"));
exports.PasswordReset = password_reset_model_1.default;
const chat_message_model_1 = __importDefault(require("./chat/chat_message.model"));
exports.ChatMessage = chat_message_model_1.default;
const scan_history_model_1 = __importDefault(require("./scan/scan_history.model"));
exports.ScanHistory = scan_history_model_1.default;
const app_version_model_1 = __importDefault(require("./app_version.model"));
exports.AppVersion = app_version_model_1.default;
const db = {
    sequelize: connection_1.default,
    Sequelize: connection_1.default.constructor,
    User: user_model_1.default,
    PendingUser: pending_user_model_1.default,
    PasswordReset: password_reset_model_1.default,
    ChatMessage: chat_message_model_1.default,
    ScanHistory: scan_history_model_1.default,
    AppVersion: app_version_model_1.default
};
// Set up associations
db.User.hasMany(db.ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
db.ChatMessage.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasMany(db.ScanHistory, { foreignKey: 'userId', as: 'scanHistories' });
db.ScanHistory.belongsTo(db.User, { foreignKey: 'userId', as: 'userScanHistories' });
exports.default = db;
