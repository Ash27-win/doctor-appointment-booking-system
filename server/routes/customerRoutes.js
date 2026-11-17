/**
 * ============================================================================
 * CUSTOMER (PATIENT) ROUTES (customerRoutes.js)
 * ============================================================================
 * 
 * ROUTE SPECIFICATIONS:
 * 1. POST /api/customer/register: Patient registration with strict validation
 * 2. POST /api/customer/login: Patient login
 * 3. GET /api/customer/profile: Get patient medical profile (Protected, Customer)
 * 4. PUT /api/customer/profile: Update patient medical profile (Protected, Customer)
 * 5. PUT /api/customer/change-password: Change patient password (Protected, Customer)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { verifyToken, isCustomer } = require('../middleware/auth');
const { validateCustomerRegister, validateLogin } = require('../middleware/validators');

// Public Authentication
router.post('/register', validateCustomerRegister, authController.customerRegister);
router.post('/login', validateLogin, authController.customerLogin);

// Protected Patient Profile Management
router.get('/profile', verifyToken, isCustomer, customerController.getCustomerProfile);
router.put('/profile', verifyToken, isCustomer, customerController.updateCustomerProfile);
router.put('/change-password', verifyToken, isCustomer, customerController.changeCustomerPassword);

module.exports = router;
