const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
// Keep track of connected users for debugging
const connectedUsers = new Map();

const initSocket = (server) => {
  console.log('Initializing Socket.IO server');
  
  io = socketIO(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    console.log('Socket authentication middleware called');
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error('Socket authentication failed: Token not provided');
      return next(new Error('Authentication error: Token not provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Socket authentication failed: Invalid token', err);
        return next(new Error('Authentication error: Invalid token'));
      }
      console.log(`Socket authenticated for user: ${decoded.id}`);
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}, Socket ID: ${socket.id}`);
    
    // Store connected user info
    connectedUsers.set(socket.user.id, {
      socketId: socket.id,
      userId: socket.user.id,
      connectedAt: new Date().toISOString()
    });
    
    // Log current connected users
    console.log(`Currently connected users: ${connectedUsers.size}`);
    
    // Join a room specific to this user
    socket.join(`user_${socket.user.id}`);
    console.log(`User ${socket.user.id} joined room: user_${socket.user.id}`);
    
    // Send a test message to confirm connection
    try {
      socket.emit('connectionTest', { 
        message: 'Socket connection established successfully',
        timestamp: new Date().toISOString()
      });
      console.log(`Sent connectionTest event to user ${socket.user.id}`);
    } catch (error) {
      console.error(`Error sending connectionTest event to user ${socket.user.id}:`, error);
    }
    
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.id}, Reason: ${reason}`);
      // Remove from connected users
      connectedUsers.delete(socket.user.id);
      console.log(`User ${socket.user.id} removed from connected users. Remaining: ${connectedUsers.size}`);
    });
  });

  return io;
};

// Enhanced getIO function with additional checks
const getIO = () => {
  if (!io) {
    console.error('Socket.io not initialized when getIO was called');
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper function to emit events with better error handling and logging
const emitToUser = (userId, eventName, data) => {
  try {
    if (!io) {
      console.error(`Cannot emit ${eventName} to user ${userId}: Socket.io not initialized`);
      return false;
    }
    
    console.log(`Attempting to emit ${eventName} to user ${userId}:`, data);
    
    // Check if user is connected
    const userInfo = connectedUsers.get(userId);
    if (!userInfo) {
      console.warn(`User ${userId} is not connected, but attempting to emit ${eventName} anyway`);
    } else {
      console.log(`User ${userId} is connected with socket ID: ${userInfo.socketId}`);
    }
    
    // Emit to the user's room
    io.to(`user_${userId}`).emit(eventName, data);
    console.log(`Successfully emitted ${eventName} to user ${userId}`);
    
    return true;
  } catch (error) {
    console.error(`Error emitting ${eventName} to user ${userId}:`, error);
    return false;
  }
};

module.exports = { initSocket, getIO, emitToUser };
