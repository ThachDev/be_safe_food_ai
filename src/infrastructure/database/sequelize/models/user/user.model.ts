import { DataTypes } from 'sequelize';
import sequelize from '../../connection';

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
  },
  isOnboarded: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_onboarded'
  },
  dietType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Bình thường',
    field: 'diet_type'
  },
  allergies: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'allergies',
    get() {
      const rawValue = this.getDataValue('allergies');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('allergies', typeof value === 'string' ? value : JSON.stringify(value || []));
    }
  },
  diseases: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'diseases',
    get() {
      const rawValue = this.getDataValue('diseases');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('diseases', typeof value === 'string' ? value : JSON.stringify(value || []));
    }
  },
  healthGoals: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'health_goals',
    get() {
      const rawValue = this.getDataValue('healthGoals');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('healthGoals', typeof value === 'string' ? value : JSON.stringify(value || []));
    }
  },
  pushEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'push_enabled'
  },
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'email_enabled'
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fcm_token'
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

export default User;
