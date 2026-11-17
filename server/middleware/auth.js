/**
 * ============================================================================
 * JWT AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARES
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. verifyToken:
 *    - Expects "Authorization: Bearer <token>" format.
 *    - Validates signature against JWT_SECRET.
 *    - Attaches decoded user payload { id, email, role } to req.user.
 * 2. Role Guards (isCustomer, isDoctor, isAdmin):
 *    - Checks req.user.role strictly.
 *    - Returns 403 Forbidden with descriptive error if role unauthorized.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT and decode payload
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access Denied: No Authorization header provided.' });
  }

  // Expect header format "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: Bearer token is missing.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#');
    req.user = verified; // verified payload contains { id, email, role }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Access Denied: Invalid or expired session token. Please log in again.' });
  }
};

// Check if user is a customer
const isCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Forbidden: Patient/Customer access required.' });
  }
  next();
};

// Check if user is a doctor
const isDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Forbidden: Clinician/Doctor access required.' });
  }
  next();
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Hospital Administrator access required.' });
  }
  next();
};

module.exports = {
  verifyToken,
  isCustomer,
  isDoctor,
  isAdmin
};
