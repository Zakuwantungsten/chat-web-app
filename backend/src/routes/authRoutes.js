const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', AuthController.registerValidation, AuthController.register);
router.post('/login', AuthController.loginValidation, AuthController.login);

// Protected routes
router.post('/logout', auth, AuthController.logout);
router.get('/me', auth, AuthController.me);

module.exports = router;