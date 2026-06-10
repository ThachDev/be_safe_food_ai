const sequelize = require('../config/db');
const User = require('./user.model');
const PendingUser = require('./pending_user.model');
const PasswordReset = require('./password_reset.model');
const ChatMessage = require('./chat_message.model');
const ScanHistory = require('./scan_history.model');

const db = {
  sequelize,
  Sequelize: sequelize.constructor,
  User,
  PendingUser,
  PasswordReset,
  ChatMessage,
  ScanHistory
};

// Set up associations
db.User.hasMany(db.ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
db.ChatMessage.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.ScanHistory, { foreignKey: 'userId', as: 'scanHistories' });
db.ScanHistory.belongsTo(db.User, { foreignKey: 'userId', as: 'userScanHistories' });

module.exports = db;
