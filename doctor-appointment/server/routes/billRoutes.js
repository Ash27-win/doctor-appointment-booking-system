const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { verifyToken, isDoctor } = require('../middleware/auth');

// POST /api/bills - Generate a bill (Doctor only)
router.post('/bills', verifyToken, isDoctor, billController.createBill);

// GET /api/bills/appointment/:appointmentId - Retrieve bill details (Doctor & Patient)
router.get('/bills/appointment/:appointmentId', verifyToken, billController.getBillByAppointmentId);

// PUT /api/bills/:id - Update bill details (Doctor only)
router.put('/bills/:id', verifyToken, isDoctor, billController.updateBill);

module.exports = router;
