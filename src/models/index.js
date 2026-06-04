const sequelize = require('../config/db');
const User = require('./user.model');
const PendingUser = require('./pending_user.model');
const PasswordReset = require('./password_reset.model');
const ChatMessage = require('./chat_message.model');

const db = {
  sequelize,
  Sequelize: sequelize.constructor,
  User,
  PendingUser,
  PasswordReset,
  ChatMessage
};

// Set up associations
db.User.hasMany(db.ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
db.ChatMessage.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

module.exports = db;
