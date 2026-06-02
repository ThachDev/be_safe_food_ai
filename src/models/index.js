const sequelize = require('../config/db');
const User = require('./user.model');
const PendingUser = require('./pending_user.model');

const db = {
  sequelize,
  Sequelize: sequelize.constructor,
  User,
  PendingUser
};


// If we add associations later, we can initialize them here:
// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

module.exports = db;
