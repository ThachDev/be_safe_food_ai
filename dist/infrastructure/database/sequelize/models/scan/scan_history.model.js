"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../connection"));
const ScanHistory = connection_1.default.define('ScanHistory', {
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
    scanType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'scan_type'
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    imageUrl: {
        type: sequelize_1.DataTypes.TEXT('medium'),
        allowNull: true,
        field: 'image_url'
    },
    rating: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    scoreText: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'score_text'
    },
    safeLevel: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'safe_level'
    },
    aiResult: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: false,
        field: 'ai_result'
    },
    personalWarnings: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: true,
        field: 'personal_warnings',
        get() {
            const rawValue = this.getDataValue('personalWarnings');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('personalWarnings', typeof value === 'string' ? value : JSON.stringify(value || []));
        }
    },
    healthyAlternatives: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: true,
        field: 'healthy_alternatives',
        get() {
            const rawValue = this.getDataValue('healthyAlternatives');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('healthyAlternatives', typeof value === 'string' ? value : JSON.stringify(value || []));
        }
    }
}, {
    tableName: 'scan_histories',
    timestamps: true
});
exports.default = ScanHistory;
