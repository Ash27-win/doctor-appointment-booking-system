const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize DB pool connection
require('./config/db');

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/customer', customerRoutes); // Customer Auth
app.use('/api', doctorRoutes);             // Doctor Auth & Public List
app.use('/api', appointmentRoutes);        // Appointment Operations

// Custom API 404 Route
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Basic check route
app.get('/', (req, res) => {
  res.send('Doctor Appointment Booking System API is active.');
});

// Port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
