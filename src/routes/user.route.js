const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /users/
router.get('/', authMiddleware, userController.getUsers);

// GET /users/:id
router.get('/:id', authMiddleware, userController.getUserById);

// POST /users/
router.post('/', authMiddleware, userController.createUser);

// PUT /users/:id
router.put('/:id', authMiddleware, userController.updateUser);

module.exports = router;
