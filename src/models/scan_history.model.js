 const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ScanHistory = sequelize.define('ScanHistory', {
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
  scanType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'scan_type'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.TEXT('medium'),
    allowNull: true,
    field: 'image_url'
  },
  rating: {
    type: DataTypes.STRING,
    allowNull: false
  },
  scoreText: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'score_text'
  },
  safeLevel: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'safe_level'
  },
  aiResult: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    field: 'ai_result'
  },
  personalWarnings: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'personal_warnings',
    get() {
      const rawValue = this.getDataValue('personalWarnings');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('personalWarnings', typeof value === 'string' ? value : JSON.stringify(value || []));
    }
  },
  healthyAlternatives: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'healthy_alternatives',
    get() {
      const rawValue = this.getDataValue('healthyAlternatives');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('healthyAlternatives', typeof value === 'string' ? value : JSON.stringify(value || []));
    }
  }
}, {
  tableName: 'scan_histories',
  timestamps: true
});

module.exports = ScanHistory;
