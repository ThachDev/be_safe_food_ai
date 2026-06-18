import sequelize from '../connection';
import User from './user.model';
import PendingUser from './pending_user.model';
import PasswordReset from './password_reset.model';
import ChatMessage from './chat_message.model';
import ScanHistory from './scan_history.model';

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

export default db;
export { User, PendingUser, PasswordReset, ChatMessage, ScanHistory };
