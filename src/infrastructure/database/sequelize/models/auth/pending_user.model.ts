import { DataTypes } from 'sequelize';
import sequelize from '../../connection';

const PendingUser = sequelize.define('PendingUser', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'display_name'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  }
}, {
  tableName: 'pending_users',
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

export default PendingUser;
