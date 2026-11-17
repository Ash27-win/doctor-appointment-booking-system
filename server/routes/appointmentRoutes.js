/**
 * ============================================================================
 * APPOINTMENT ROUTES (appointmentRoutes.js)
 * ============================================================================
 * 
 * ROUTE SPECIFICATIONS:
 * 1. POST /api/appointments: Book appointment (Customer only, validated)
 * 2. GET /api/customer/appointments: Patient appointments (Customer only)
 * 3. PUT /api/appointments/:id/cancel: Cancel appointment (Customer only)
 * 4. PUT /api/appointments/:id/reschedule: Reschedule appointment (Customer only)
 * 5. GET /api/doctor/appointments: Doctor schedule list (Doctor only)
 * 6. PUT /api/appointments/:id/status: Status update (Doctor only)
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, isCustomer, isDoctor } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validators');

// Patient Endpoints
router.post('/appointments', verifyToken, isCustomer, validateBooking, appointmentController.bookAppointment);
router.get('/customer/appointments', verifyToken, isCustomer, appointmentController.getCustomerAppointments);
router.put('/appointments/:id/cancel', verifyToken, isCustomer, appointmentController.cancelAppointment);
router.put('/appointments/:id/reschedule', verifyToken, isCustomer, appointmentController.rescheduleAppointment);

// Doctor Endpoints
router.get('/doctor/appointments', verifyToken, isDoctor, appointmentController.getDoctorAppointments);
router.put('/appointments/:id/status', verifyToken, isDoctor, appointmentController.updateAppointmentStatus);

module.exports = router;
