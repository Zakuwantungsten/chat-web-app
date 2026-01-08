const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const chatRoomRoutes = require('./src/routes/chatRoomRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');

// Import socket handlers
const socketHandler = require('./src/sockets/socketHandler');

// Import database
const sequelize = require('./src/config/database');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Also make io globally accessible
global.io = io;

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chatrooms', chatRoomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat API is running' });
});

// Socket.IO handling
socketHandler(io);

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database models (create tables if they don't exist)
    // await sequelize.sync({ alter: true });
    // console.log('Database synchronized successfully.');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;