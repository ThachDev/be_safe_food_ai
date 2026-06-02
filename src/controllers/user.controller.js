const userService = require('../services/user.service');
const { HttpStatus, ErrorCodes } = require('../constants');

class UserController {
  async getUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      return res.status(HttpStatus.OK).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('[UserController getUsers Error]:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ErrorCodes.DATABASE_ERROR,
        message: 'An error occurred while retrieving users.',
        error: error.message
      });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }
      return res.status(HttpStatus.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('[UserController getUserById Error]:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ErrorCodes.DATABASE_ERROR,
        message: 'An error occurred while retrieving the user.',
        error: error.message
      });
    }
  }

  async createUser(req, res) {
    try {
      const user = await userService.createUser(req.body);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('[UserController createUser Error]:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'An error occurred while creating the user.',
        error: error.message
      });
    }
  }

  async updateUser(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('[UserController updateUser Error]:', error);
      if (error.message === 'User not found') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'An error occurred while updating the user.',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
