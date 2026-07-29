const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, isCustomer, isDoctor } = require('../middleware/auth');

// POST /api/appointments - Book appointment (Customer only)
router.post('/appointments', verifyToken, isCustomer, appointmentController.bookAppointment);

// GET /api/customer/appointments - View customer appointments (Customer only)
router.get('/customer/appointments', verifyToken, isCustomer, appointmentController.getCustomerAppointments);

// GET /api/doctor/appointments - View doctor appointments (Doctor only)
router.get('/doctor/appointments', verifyToken, isDoctor, appointmentController.getDoctorAppointments);

// PUT /api/appointments/:id/status - Update status (Doctor only)
router.put('/appointments/:id/status', verifyToken, isDoctor, appointmentController.updateAppointmentStatus);

module.exports = router;
