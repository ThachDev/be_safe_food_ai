"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("./connection"));
const sequelize_1 = require("sequelize");
async function migrate() {
    try {
        console.log('[Migration] Connecting to MySQL...');
        await connection_1.default.authenticate();
        console.log('[Migration] Connected successfully.');
        const queryInterface = connection_1.default.getQueryInterface();
        // 1. Alter users table
        console.log('[Migration] Checking columns for "users" table...');
        const userTableInfo = await queryInterface.describeTable('users');
        if (!userTableInfo.is_onboarded) {
            console.log('[Migration] Adding column "is_onboarded" to "users" table...');
            await queryInterface.addColumn('users', 'is_onboarded', {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            });
        }
        if (!userTableInfo.diet_type) {
            console.log('[Migration] Adding column "diet_type" to "users" table...');
            await queryInterface.addColumn('users', 'diet_type', {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Bình thường'
            });
        }
        if (!userTableInfo.allergies) {
            console.log('[Migration] Adding column "allergies" to "users" table...');
            await queryInterface.addColumn('users', 'allergies', {
                type: sequelize_1.DataTypes.TEXT('long'),
                allowNull: true
            });
        }
        if (!userTableInfo.diseases) {
            console.log('[Migration] Adding column "diseases" to "users" table...');
            await queryInterface.addColumn('users', 'diseases', {
                type: sequelize_1.DataTypes.TEXT('long'),
                allowNull: true
            });
        }
        if (!userTableInfo.health_goals) {
            console.log('[Migration] Adding column "health_goals" to "users" table...');
            await queryInterface.addColumn('users', 'health_goals', {
                type: sequelize_1.DataTypes.TEXT('long'),
                allowNull: true
            });
        }
        // 2. Alter scan_histories table
        console.log('[Migration] Checking columns for "scan_histories" table...');
        const scanTableInfo = await queryInterface.describeTable('scan_histories');
        if (!scanTableInfo.personal_warnings) {
            console.log('[Migration] Adding column "personal_warnings" to "scan_histories" table...');
            await queryInterface.addColumn('scan_histories', 'personal_warnings', {
                type: sequelize_1.DataTypes.TEXT('long'),
                allowNull: true
            });
        }
        if (!scanTableInfo.healthy_alternatives) {
            console.log('[Migration] Adding column "healthy_alternatives" to "scan_histories" table...');
            await queryInterface.addColumn('scan_histories', 'healthy_alternatives', {
                type: sequelize_1.DataTypes.TEXT('long'),
                allowNull: true
            });
        }
        console.log('[Migration] Database migration completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('[Migration] Database migration failed:', error);
        process.exit(1);
    }
}
migrate();
