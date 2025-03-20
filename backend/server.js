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
const jobRoutes = require('./routes/jobRoutes');
const driverRoutes = require('./routes/driverRoutes');
const locationRoutes = require('./routes/locationRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const { initSocket } = require('./socket');

const app = express();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB using config
connectDB();

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
