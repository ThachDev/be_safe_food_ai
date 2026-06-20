import { DataTypes } from 'sequelize';
import sequelize from '../connection';

const AppVersion = sequelize.define('AppVersion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  latestVersion: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0.4+4',
    field: 'latest_version'
  },
  storeUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai',
    field: 'store_url'
  }
}, {
  tableName: 'app_versions'
});

export default AppVersion;
