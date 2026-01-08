const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

class AuthController {
  // User Registration
  static registerValidation = [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    body('role')
      .optional()
      .isIn(['student', 'class_rep', 'admin'])
      .withMessage('Invalid role specified'),
    body('studentId')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Student ID must be less than 20 characters'),
    body('class')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Class name must be less than 100 characters')
  ];

  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        username,
        email,
        password,
        firstName,
        lastName,
        role = 'student',
        studentId,
        class: userClass
      } = req.body;

      // Check if user already exists
      const { Op } = require('sequelize');
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email },
            { username },
            ...(studentId ? [{ studentId }] : [])
          ]
        }
      });

      if (existingUser) {
        let field = 'User';
        if (existingUser.email === email) field = 'Email';
        else if (existingUser.username === username) field = 'Username';
        else if (existingUser.studentId === studentId) field = 'Student ID';
        
        return res.status(409).json({
          error: `${field} already exists`
        });
      }

      // Create new user (password will be hashed by the model hook)
      const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        studentId,
        class: userClass
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const userResponse = { ...user.toJSON() };
      delete userResponse.password;

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration'
      });
    }
  }

  // User Login
  static loginValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
  ];

  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Update user's online status and last seen
      await user.update({
        isOnline: true,
        lastSeen: new Date()
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const userResponse = { ...user.toJSON() };
      delete userResponse.password;

      res.json({
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login'
      });
    }
  }

  // User Logout
  static async logout(req, res) {
    try {
      // Update user's online status
      if (req.user) {
        await req.user.update({
          isOnline: false,
          lastSeen: new Date()
        });
      }

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error during logout'
      });
    }
  }

  // Get current user info
  static async me(req, res) {
    try {
      const userResponse = { ...req.user.toJSON() };
      delete userResponse.password;

      res.json({
        user: userResponse
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;