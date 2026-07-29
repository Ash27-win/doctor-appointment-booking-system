const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/customer/register
router.post('/register', authController.customerRegister);

// POST /api/customer/login
router.post('/login', authController.customerLogin);

module.exports = router;
