const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { verifyToken, isDoctor } = require('../middleware/auth');

// POST /api/prescriptions - Create a prescription (Doctor only)
router.post('/prescriptions', verifyToken, isDoctor, prescriptionController.createPrescription);

// GET /api/prescriptions/appointment/:appointmentId - Get prescription details (Doctor & Patient)
router.get('/prescriptions/appointment/:appointmentId', verifyToken, prescriptionController.getPrescriptionByAppointmentId);

// PUT /api/prescriptions/:id - Update prescription (Doctor only)
router.put('/prescriptions/:id', verifyToken, isDoctor, prescriptionController.updatePrescription);

module.exports = router;
