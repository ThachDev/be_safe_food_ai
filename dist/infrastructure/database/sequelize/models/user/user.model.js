"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../connection"));
const User = connection_1.default.define('User', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    firebaseUid: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'firebase_uid'
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
    photoUrl: {
        type: sequelize_1.DataTypes.TEXT('medium'),
        allowNull: true,
        field: 'photo_url'
    },
    isOnboarded: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_onboarded'
    },
    dietType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Bình thường',
        field: 'diet_type'
    },
    allergies: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: true,
        field: 'allergies',
        get() {
            const rawValue = this.getDataValue('allergies');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('allergies', typeof value === 'string' ? value : JSON.stringify(value || []));
        }
    },
    diseases: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: true,
        field: 'diseases',
        get() {
            const rawValue = this.getDataValue('diseases');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('diseases', typeof value === 'string' ? value : JSON.stringify(value || []));
        }
    },
    healthGoals: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: true,
        field: 'health_goals',
        get() {
            const rawValue = this.getDataValue('healthGoals');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('healthGoals', typeof value === 'string' ? value : JSON.stringify(value || []));
        }
    },
    pushEnabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'push_enabled'
    },
    emailEnabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'email_enabled'
    },
    fcmToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'fcm_token'
    }
}, {
    tableName: 'users',
    indexes: [
        {
            unique: true,
            fields: ['firebase_uid']
        },
        {
            unique: true,
            fields: ['email']
        }
    ]
});
exports.default = User;
