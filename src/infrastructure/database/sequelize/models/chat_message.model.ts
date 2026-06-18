import { DataTypes } from 'sequelize';
import sequelize from '../connection';

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
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'session_id'
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

export default ChatMessage;
