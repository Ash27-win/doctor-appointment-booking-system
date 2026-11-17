const db = require('../config/db');

// Add a recommended test/scan (Doctor only)
exports.addRecommendedTest = async (req, res) => {
  const doctorId = req.user.id;
  const { appointment_id, test_name, test_type, instructions, priority, notes } = req.body;

  // Validation
  if (!appointment_id || !test_name || !test_type) {
    return res.status(400).json({ message: 'Appointment ID, test name, and test type are required.' });
  }

  const validTypes = ['Laboratory', 'Scan'];
  if (!validTypes.includes(test_type)) {
    return res.status(400).json({ message: 'Invalid test type. Choose from Laboratory, Scan.' });
  }

  try {
    // Verify appointment details and doctor ownership
    const [apptRows] = await db.query(
      'SELECT customer_id, doctor_id FROM appointments WHERE appointment_id = ?',
      [appointment_id]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = apptRows[0];
    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Access Denied: This appointment is assigned to another doctor.' });
    }

    // Insert recommended test
    const [result] = await db.query(
      `INSERT INTO recommended_tests (appointment_id, doctor_id, customer_id, test_name, test_type, instructions, priority, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment_id,
        doctorId,
        appointment.customer_id,
        test_name,
        test_type,
        instructions || '',
        priority || 'Routine',
        notes || ''
      ]
    );

    return res.status(201).json({
      message: 'Test recommendation added successfully!',
      testId: result.insertId
    });
  } catch (error) {
    console.error('Add Recommended Test Error:', error);
    return res.status(500).json({ message: 'Internal server error while saving test recommendation.' });
  }
};

// Get recommended tests by appointment ID (Doctor and Customer)
exports.getTestsByAppointmentId = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { appointmentId } = req.params;

  try {
    const [tests] = await db.query(
      'SELECT * FROM recommended_tests WHERE appointment_id = ? ORDER BY created_at ASC',
      [appointmentId]
    );

    if (tests.length > 0) {
      const firstTest = tests[0];
      // Authorization checks
      if (role === 'customer' && firstTest.customer_id !== userId) {
        return res.status(403).json({ message: 'Access Denied: You cannot view this recommendation.' });
      }
      if (role === 'doctor' && firstTest.doctor_id !== userId) {
        return res.status(403).json({ message: 'Access Denied: This recommendation belongs to another doctor\'s patient.' });
      }
    }

    return res.status(200).json(tests);
  } catch (error) {
    console.error('Fetch Recommended Tests Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching test recommendations.' });
  }
};

// Update a single test recommendation (Doctor only)
exports.updateRecommendedTest = async (req, res) => {
  const doctorId = req.user.id;
  const { id } = req.params; // test_id
  const { test_name, test_type, instructions, priority, notes } = req.body;

  if (!test_name || !test_type) {
    return res.status(400).json({ message: 'Test name and type are required.' });
  }

  const validTypes = ['Laboratory', 'Scan'];
  if (!validTypes.includes(test_type)) {
    return res.status(400).json({ message: 'Invalid test type. Choose from Laboratory, Scan.' });
  }

  try {
    // Verify test exists and belongs to the doctor
    const [testRows] = await db.query(
      'SELECT doctor_id FROM recommended_tests WHERE test_id = ?',
      [id]
    );

    if (testRows.length === 0) {
      return res.status(404).json({ message: 'Recommended test not found.' });
    }

    if (testRows[0].doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Access Denied: You cannot update another doctor\'s recommendations.' });
    }

    // Update details
    await db.query(
      `UPDATE recommended_tests 
       SET test_name = ?, test_type = ?, instructions = ?, priority = ?, notes = ? 
       WHERE test_id = ?`,
      [test_name, test_type, instructions || '', priority || 'Routine', notes || '', id]
    );

    return res.status(200).json({ message: 'Test recommendation updated successfully!' });
  } catch (error) {
    console.error('Update Recommended Test Error:', error);
    return res.status(500).json({ message: 'Internal server error while updating test recommendation.' });
  }
};

// Delete a recommended test (Doctor only)
exports.deleteRecommendedTest = async (req, res) => {
  const doctorId = req.user.id;
  const { id } = req.params; // test_id

  try {
    // Verify test exists and belongs to the doctor
    const [testRows] = await db.query(
      'SELECT doctor_id FROM recommended_tests WHERE test_id = ?',
      [id]
    );

    if (testRows.length === 0) {
      return res.status(404).json({ message: 'Recommended test not found.' });
    }

    if (testRows[0].doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Access Denied: You cannot delete another doctor\'s recommendations.' });
    }

    // Delete
    await db.query('DELETE FROM recommended_tests WHERE test_id = ?', [id]);

    return res.status(200).json({ message: 'Test recommendation removed successfully!' });
  } catch (error) {
    console.error('Delete Recommended Test Error:', error);
    return res.status(500).json({ message: 'Internal server error while deleting test recommendation.' });
  }
};
