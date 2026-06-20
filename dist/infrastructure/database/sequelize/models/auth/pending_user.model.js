"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../connection"));
const PendingUser = connection_1.default.define('PendingUser', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    displayName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'display_name'
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    otp: {
        type: sequelize_1.DataTypes.STRING(6),
        allowNull: false
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'expires_at'
    }
}, {
    tableName: 'pending_users',
    indexes: [
        {
            unique: true,
            fields: ['email']
        }
    ]
});
exports.default = PendingUser;
