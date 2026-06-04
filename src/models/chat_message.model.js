const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  message: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  isUser: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_user'
  }
}, {
  tableName: 'chat_messages',
  timestamps: true, // Thêm createdAt và updatedAt
});

module.exports = ChatMessage;
