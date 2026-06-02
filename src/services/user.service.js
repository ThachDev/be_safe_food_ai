const User = require('../models/user.model');

class UserService {
  async getAllUsers() {
    return await User.findAll();
  }

  async getUserById(id) {
    return await User.findByPk(id);
  }

  async createUser(data) {
    return await User.create(data);
  }

  async updateUser(id, data) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    return await user.update(data);
  }
}

module.exports = new UserService();
