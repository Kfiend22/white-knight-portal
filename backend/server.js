  require('dotenv').config();
  const cors = require('cors');
  const express = require('express');
  const mongoose = require('mongoose');
  const connectDB = require('./config/db');
  const applicationRoutes = require('./routes/Applications');
  const net = require('net');
  const bodyParser = require('body-parser');
  const userRoutes = require('./routes/userRoutes');
  const authRoutes = require('./routes/authRoutes');
  
  const app = express();

  const PORT = process.env.PORT || 5000;
  const MONGODB_URI = 'mongodb://localhost/white-knight-portal';

  // Add this configuration when connecting to MongoDB
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

// Add this to disable strict schema validation temporarily
mongoose.set('strictQuery', false);

const db = mongoose.connection;
db.on('connected', () => console.log('Connected to MongoDB'));

const emailRoutes = require('./routes/emailRoutes');
app.use('/api/v1/email', emailRoutes);

  // Enable CORS
  app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Middleware to log all incoming requests
  app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
  });

  // Mount the router
  app.use('/api/v1', applicationRoutes);

  // Middleware
  app.use('/images', express.static('public/images')); // For profile images

  // Routes
  app.use('/api/v1/applications', require('./routes/Applications'));
  app.use('/api/v1/users', userRoutes);
  app.use('/api/auth', authRoutes);
  // Serve static files from 'uploads' directory
  app.use('/uploads', express.static('uploads'));

  // Catch-all route for unmatched requests
  app.use('*', (req, res) => {
    console.log(`No route found for ${req.method} ${req.url}`);
    res.status(404).send('Not Found');
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });