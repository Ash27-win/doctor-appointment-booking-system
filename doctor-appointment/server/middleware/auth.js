const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT and decode payload
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access Denied: No Authorization header provided' });
  }

  // Expect header format "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: Token missing' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#');
    req.user = verified; // verified payload contains { id, email, role }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Access Denied: Invalid or expired token' });
  }
};

// Check if user is a customer
const isCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Access Denied: Customer access only' });
  }
  next();
};

// Check if user is a doctor
const isDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Access Denied: Doctor access only' });
  }
  next();
};

module.exports = {
  verifyToken,
  isCustomer,
  isDoctor
};
