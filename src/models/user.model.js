const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  firebaseUid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'firebase_uid'
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
  photoUrl: {
    type: DataTypes.TEXT('medium'),
    allowNull: true,
    field: 'photo_url'
  }
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['firebase_uid']
    },
    {
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;
