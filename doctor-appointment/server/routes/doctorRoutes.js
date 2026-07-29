const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const doctorController = require('../controllers/doctorController');

// POST /api/doctor/login
router.post('/doctor/login', authController.doctorLogin);

// GET /api/doctors
router.get('/doctors', doctorController.getAllDoctors);

// GET /api/doctors/:id
router.get('/doctors/:id', doctorController.getDoctorById);

module.exports = router;
