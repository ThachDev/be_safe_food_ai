"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../connection"));
const AppVersion = connection_1.default.define('AppVersion', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    latestVersion: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: '1.0.4+4',
        field: 'latest_version'
    },
    storeUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai',
        field: 'store_url'
    }
}, {
    tableName: 'app_versions'
});
exports.default = AppVersion;
