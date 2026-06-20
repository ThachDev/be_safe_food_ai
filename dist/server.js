"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("./di/container");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const models_1 = __importDefault(require("./infrastructure/database/sequelize/models"));
const { sequelize } = models_1.default;
const PORT = process.env.PORT || 5001;
async function startServer() {
    try {
        console.log('[Database] Connecting to MySQL...');
        await sequelize.authenticate();
        console.log('[Database] Connection established successfully.');
        if (process.env.NODE_ENV === 'development') {
            console.log('[Database] Synchronizing schema (safe mode)...');
            await sequelize.sync();
            console.log('[Database] Schema synchronization complete.');
        }
        else {
            console.log('[Database] Production environment detected; skipping auto-sync. Please manage database changes via migrations.');
        }
        app_1.default.listen(PORT, () => {
            console.log(`\n======================================================`);
            console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode`);
            console.log(`🔗 API endpoint: http://localhost:${PORT}/api/v1`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
            console.log(`======================================================\n`);
        });
    }
    catch (error) {
        console.error('\n🔴 Failed to start the server due to database connection issue:');
        if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
            console.error(`🚨 Error: Database "${process.env.DB_NAME || 'safefood_db'}" does not exist in MySQL.`);
            console.error(`💡 Suggestion: Please create the database first using "CREATE DATABASE ${process.env.DB_NAME || 'safefood_db'};" in your MySQL CLI/GUI, then restart the server.\n`);
        }
        else {
            console.error(error.message, '\n');
        }
        process.exit(1);
    }
}
startServer();
