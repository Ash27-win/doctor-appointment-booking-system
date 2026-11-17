const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { verifyToken, isDoctor } = require('../middleware/auth');

// POST /api/tests - Add recommended test/scan (Doctor only)
router.post('/tests', verifyToken, isDoctor, testController.addRecommendedTest);

// GET /api/tests/appointment/:appointmentId - Get recommended tests (Doctor & Patient)
router.get('/tests/appointment/:appointmentId', verifyToken, testController.getTestsByAppointmentId);

// PUT /api/tests/:id - Update recommended test details (Doctor only)
router.put('/tests/:id', verifyToken, isDoctor, testController.updateRecommendedTest);

// DELETE /api/tests/:id - Remove test recommendation (Doctor only)
router.delete('/tests/:id', verifyToken, isDoctor, testController.deleteRecommendedTest);

module.exports = router;
