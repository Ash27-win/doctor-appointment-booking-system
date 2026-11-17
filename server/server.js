const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize DB pool connection
require('./config/db');

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const testRoutes = require('./routes/testRoutes');
const billRoutes = require('./routes/billRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/customer', customerRoutes); // Customer Auth & Profile
app.use('/api', doctorRoutes);             // Doctor Auth & Public List & Profile
app.use('/api', appointmentRoutes);        // Appointment Operations
app.use('/api', prescriptionRoutes);       // Prescriptions
app.use('/api', testRoutes);               // Lab Tests / Scans
app.use('/api', billRoutes);               // Billing Systems
app.use('/api/admin', adminRoutes);        // Admin Portal & Operations

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
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
