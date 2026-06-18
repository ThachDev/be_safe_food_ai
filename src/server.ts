import 'reflect-metadata';
import './di/container';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import db from './infrastructure/database/sequelize/models';

const { sequelize } = db;
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
    } else {
      console.log('[Database] Production environment detected; skipping auto-sync. Please manage database changes via migrations.');
    }

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`======================================================\n`);
    });
  } catch (error: any) {
    console.error('\n🔴 Failed to start the server due to database connection issue:');
    if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
      console.error(`🚨 Error: Database "${process.env.DB_NAME || 'safefood_db'}" does not exist in MySQL.`);
      console.error(`💡 Suggestion: Please create the database first using "CREATE DATABASE ${process.env.DB_NAME || 'safefood_db'};" in your MySQL CLI/GUI, then restart the server.\n`);
    } else {
      console.error(error.message, '\n');
    }
    process.exit(1);
  }
}

startServer();
