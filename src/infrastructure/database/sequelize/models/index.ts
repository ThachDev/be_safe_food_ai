import sequelize from '../connection';
import User from './user/user.model';
import PendingUser from './auth/pending_user.model';
import PasswordReset from './auth/password_reset.model';
import ChatMessage from './chat/chat_message.model';
import ScanHistory from './scan/scan_history.model';
import AppVersion from './app_version.model';

const db = {
  sequelize,
  Sequelize: sequelize.constructor,
  User,
  PendingUser,
  PasswordReset,
  ChatMessage,
  ScanHistory,
  AppVersion
};

// Set up associations
db.User.hasMany(db.ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
db.ChatMessage.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.ScanHistory, { foreignKey: 'userId', as: 'scanHistories' });
db.ScanHistory.belongsTo(db.User, { foreignKey: 'userId', as: 'userScanHistories' });

export default db;
export { User, PendingUser, PasswordReset, ChatMessage, ScanHistory, AppVersion };
