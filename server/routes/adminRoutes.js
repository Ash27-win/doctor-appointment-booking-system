/**
 * ============================================================================
 * ADMIN ROUTES (adminRoutes.js)
 * ============================================================================
 * 
 * ROUTE SPECIFICATIONS:
 * 1. POST /api/admin/login: Administrator authentication
 * 2. GET /api/admin/stats: Real-time clinic statistics
 * 3. GET /api/admin/doctors: All doctors directory
 * 4. POST /api/admin/doctors: Add new doctor
 * 5. PUT /api/admin/doctors/:id: Edit doctor
 * 6. DELETE /api/admin/doctors/:id: Delete doctor
 * 7. GET /api/admin/appointments: Clinic-wide appointments
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validators');

// Public Admin Login
router.post('/login', validateLogin, adminController.adminLogin);

// Protected Admin Actions
router.get('/stats', verifyToken, isAdmin, adminController.getClinicStats);
router.get('/doctors', verifyToken, isAdmin, adminController.getAllDoctors);
router.post('/doctors', verifyToken, isAdmin, adminController.createDoctor);
router.put('/doctors/:id', verifyToken, isAdmin, adminController.updateDoctor);
router.delete('/doctors/:id', verifyToken, isAdmin, adminController.deleteDoctor);
router.get('/appointments', verifyToken, isAdmin, adminController.getAllAppointments);

module.exports = router;

