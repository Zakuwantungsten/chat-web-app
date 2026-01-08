const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');

// All routes require authentication
router.get('/profile', auth, UserController.getProfile);
router.put('/profile', auth, UserController.updateProfileValidation, UserController.updateProfile);
router.put('/status', auth, UserController.updateOnlineStatus);
router.get('/', auth, UserController.getAllUsers);
router.get('/class/:className', auth, UserController.getUsersByClass);

module.exports = router;