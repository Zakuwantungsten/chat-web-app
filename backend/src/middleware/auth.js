const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Simple user cache to reduce database queries
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check cache first
    const cacheKey = `user_${decoded.userId}`;
    const cached = userCache.get(cacheKey);
    
    let user;
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      user = cached.user;
      console.log(`Using cached user data for user ${decoded.userId}`);
    } else {
      user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      
      // Cache the user data
      if (user) {
        userCache.set(cacheKey, {
          user: user,
          timestamp: Date.now()
        });
        console.log(`Cached user data for user ${decoded.userId}`);
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth;