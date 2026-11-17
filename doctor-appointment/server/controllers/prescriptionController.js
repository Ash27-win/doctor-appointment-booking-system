const db = require('../config/db');

// Create a new prescription (Doctor only)
exports.createPrescription = async (req, res) => {
  const doctorId = req.user.id;
  const { appointment_id, diagnosis, notes, prescription_date, medicines } = req.body;

  // Validation
  if (!appointment_id || !diagnosis || !prescription_date) {
    return res.status(400).json({ message: 'Appointment ID, diagnosis, and prescription date are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verify appointment details and doctor ownership
    const [apptRows] = await connection.query(
      'SELECT customer_id, doctor_id FROM appointments WHERE appointment_id = ?',
      [appointment_id]
    );

    if (apptRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = apptRows[0];
    if (appointment.doctor_id !== doctorId) {
      await connection.rollback();
      return res.status(403).json({ message: 'Access Denied: This appointment is assigned to another doctor.' });
    }

    // Check if prescription already exists for this appointment
    const [existingPrescr] = await connection.query(
      'SELECT prescription_id FROM prescriptions WHERE appointment_id = ?',
      [appointment_id]
    );

    if (existingPrescr.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'A prescription already exists for this appointment. Use update instead.' });
    }

    // Insert prescription
    const [prescriptionResult] = await connection.query(
      `INSERT INTO prescriptions (appointment_id, doctor_id, customer_id, diagnosis, notes, prescription_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [appointment_id, doctorId, appointment.customer_id, diagnosis, notes || '', prescription_date]
    );

    const prescriptionId = prescriptionResult.insertId;

    // Insert medicines if provided
    if (Array.isArray(medicines) && medicines.length > 0) {
      for (const med of medicines) {
        if (!med.medicine_name || !med.dosage || !med.frequency || !med.duration || !med.timing) {
          await connection.rollback();
          return res.status(400).json({ message: 'All medicine details (Name, Dosage, Frequency, Duration, Timing) are required.' });
        }

        await connection.query(
          `INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration, timing, instructions) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            prescriptionId,
            med.medicine_name,
            med.dosage,
            med.frequency,
            med.duration,
            med.timing,
            med.instructions || ''
          ]
        );
      }
    }

    await connection.commit();
    return res.status(201).json({
      message: 'Prescription saved successfully!',
      prescriptionId: prescriptionId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create Prescription Error:', error);
    return res.status(500).json({ message: 'Internal server error while saving prescription.' });
  } finally {
    connection.release();
  }
};

// Get prescription details by appointment ID (Doctor and Customer)
exports.getPrescriptionByAppointmentId = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { appointmentId } = req.params;

  try {
    // Retrieve prescription and verify access
    const [prescrRows] = await db.query(
      `SELECT p.*, d.name AS doctor_name, d.specialization AS doctor_specialization 
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.doctor_id
       WHERE p.appointment_id = ?`,
      [appointmentId]
    );

    if (prescrRows.length === 0) {
      return res.status(404).json({ message: 'No prescription found for this appointment.' });
    }

    const prescription = prescrRows[0];

    // Authorization checks
    if (role === 'customer' && prescription.customer_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: You cannot view this prescription.' });
    }
    if (role === 'doctor' && prescription.doctor_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: This prescription belongs to another doctor.' });
    }

    // Retrieve medicines
    const [medicines] = await db.query(
      'SELECT * FROM prescription_medicines WHERE prescription_id = ?',
      [prescription.prescription_id]
    );

    return res.status(200).json({
      ...prescription,
      medicines: medicines
    });
  } catch (error) {
    console.error('Fetch Prescription Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching prescription.' });
  }
};

// Update an existing prescription (Doctor only)
exports.updatePrescription = async (req, res) => {
  const doctorId = req.user.id;
  const { id } = req.params; // prescription_id
  const { diagnosis, notes, prescription_date, medicines } = req.body;

  if (!diagnosis || !prescription_date) {
    return res.status(400).json({ message: 'Diagnosis and prescription date are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verify prescription exists and belongs to the doctor
    const [prescrRows] = await connection.query(
      'SELECT * FROM prescriptions WHERE prescription_id = ?',
      [id]
    );

    if (prescrRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    const prescription = prescrRows[0];
    if (prescription.doctor_id !== doctorId) {
      await connection.rollback();
      return res.status(403).json({ message: 'Access Denied: You cannot update another doctor\'s prescription.' });
    }

    // Update prescription details
    await connection.query(
      `UPDATE prescriptions 
       SET diagnosis = ?, notes = ?, prescription_date = ? 
       WHERE prescription_id = ?`,
      [diagnosis, notes || '', prescription_date, id]
    );

    // Delete old medicines
    await connection.query(
      'DELETE FROM prescription_medicines WHERE prescription_id = ?',
      [id]
    );

    // Insert new medicines
    if (Array.isArray(medicines) && medicines.length > 0) {
      for (const med of medicines) {
        if (!med.medicine_name || !med.dosage || !med.frequency || !med.duration || !med.timing) {
          await connection.rollback();
          return res.status(400).json({ message: 'All medicine details are required.' });
        }

        await connection.query(
          `INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration, timing, instructions) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            med.medicine_name,
            med.dosage,
            med.frequency,
            med.duration,
            med.timing,
            med.instructions || ''
          ]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({ message: 'Prescription updated successfully!' });
  } catch (error) {
    await connection.rollback();
    console.error('Update Prescription Error:', error);
    return res.status(500).json({ message: 'Internal server error while updating prescription.' });
  } finally {
    connection.release();
  }
};
