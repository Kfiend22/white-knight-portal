require('dotenv').config();
const cors = require('cors');
const http = require('http');
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const applicationRoutes = require('./routes/Applications');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const regionRoutes = require('./routes/regionRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const facilityRoutes = require('./routes/facilityRoutes'); // Import facility routes
const jobRoutes = require('./routes/jobRoutes');
const driverRoutes = require('./routes/driverRoutes');
const locationRoutes = require('./routes/locationRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const { initSocket } = require('./socket');

const app = express();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB using config
connectDB();

console.log("Server starting up... Logging test for job deletion debugging");

app.use(bodyParser.json());
app.use(cors());

// Serve static files
app.use('/images', express.static('public/images'));
app.use('/uploads', express.static('uploads'));
app.use('/csvs', express.static('public/csvs'));

// Routes
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/user', userRoutes); // Add this route for user/companies endpoint
app.use('/api/vehicles', vehicleRoutes); // Add new vehicle routes
app.use('/api/v1/facilities', facilityRoutes); // Register facility routes

// In production, serve the frontend build folder so that unknown routes return index.html
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../build', 'index.html'))
  );
} else {
  // In development, if the root route is accessed, simply send a friendly message
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Health check endpoint
app.get('/api/auth/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Test MongoDB connection
app.get('/api/test/db', async (req, res) => {
  try {
    const Job = require('./models/Job');
    const count = await Job.countDocuments();
    console.log(`MongoDB connection test: Found ${count} jobs`);
    res.status(200).json({ 
      status: 'ok', 
      message: 'MongoDB connection is working', 
      jobCount: count 
    });
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'MongoDB connection test failed', 
      error: error.message 
    });
  }
});

// Test authentication middleware
const { protect } = require('./middleware/authMiddleware');
app.get('/api/test/auth', protect, (req, res) => {
  console.log('Auth test - User:', JSON.stringify(req.user));
  res.status(200).json({
    status: 'ok',
    message: 'Authentication is working',
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      primaryRole: req.user.primaryRole,
      secondaryRoles: req.user.secondaryRoles
    }
  });
});

// Test job deletion
app.delete('/api/test/delete-job/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Test route - Attempting to delete job with ID: ${id}`);
    console.log(`Test route - User: ${JSON.stringify(req.user)}`);
    
    // Check if user has permission to delete jobs
    const allowedRoles = ['OW', 'sOW', 'RM'];
    if (!allowedRoles.includes(req.user.primaryRole)) {
      console.log(`Test route - Permission denied: User role ${req.user.primaryRole} not in allowed roles`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete jobs'
      });
    }
    
    // Find the job
    const Job = require('./models/Job');
    console.log(`Test route - Finding job with ID: ${id}`);
    const job = await Job.findById(id);
    
    if (!job) {
      console.log(`Test route - Job not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    console.log(`Test route - Job found: ${job.id}, status: ${job.status}`);
    
    // Only allow deletion of cancelled jobs
    if (job.status !== 'Canceled') {
      console.log(`Test route - Cannot delete job with status: ${job.status}`);
      return res.status(400).json({
        success: false,
        message: 'Only cancelled jobs can be permanently deleted'
      });
    }
    
    // Delete the job from the database using findByIdAndDelete
    console.log(`Test route - Deleting job from database: ${job.id}`);
    await Job.findByIdAndDelete(id);
    
    console.log(`Test route - Job deleted successfully: ${job.id}`);
    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error(`Test route - Error in deleteJob function: ${error.message}`);
    console.error(error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

// Optional: a catch-all route for unknown API calls (only for /api routes)
app.use('/api', (req, res) => {
  console.log(`No API route found for ${req.method} ${req.url}`);
  res.status(404).send('API route not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

// Create an HTTP server instance
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
