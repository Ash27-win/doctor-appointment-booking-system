/**
 * ============================================================================
 * DOCTOR ROUTES (doctorRoutes.js)
 * ============================================================================
 * 
 * ROUTE SPECIFICATIONS:
 * 1. POST /api/doctor/login: Public clinician login
 * 2. GET /api/doctors: Public list of doctors
 * 3. GET /api/doctors/:id: Public doctor detail
 * 4. GET /api/doctors/:id/available-slots: Real-time dynamic slots calculation
 * 5. GET /api/doctor/profile: Get logged-in doctor profile (Doctor only)
 * 6. PUT /api/doctor/profile: Update doctor profile (Doctor only)
 * 7. PUT /api/doctor/change-password: Change doctor password (Doctor only)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const doctorController = require('../controllers/doctorController');
const { verifyToken, isDoctor } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validators');

// Public Doctor Auth & Directory
router.post('/doctor/login', validateLogin, authController.doctorLogin);
router.get('/doctors', doctorController.getAllDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.get('/doctors/:id/available-slots', doctorController.getAvailableSlots);

// Doctor Protected Profile Management
router.get('/doctor/profile', verifyToken, isDoctor, doctorController.getDoctorProfile);
router.put('/doctor/profile', verifyToken, isDoctor, doctorController.updateDoctorProfile);
router.put('/doctor/change-password', verifyToken, isDoctor, doctorController.changeDoctorPassword);

module.exports = router;
