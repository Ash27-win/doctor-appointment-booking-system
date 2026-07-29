const db = require('../config/db');

// Book a new appointment
exports.bookAppointment = async (req, res) => {
  const customerId = req.user.id; // From verifyToken middleware
  const {
    doctor_id,
    patient_name,
    patient_age,
    patient_gender,
    patient_phone,
    patient_email,
    appointment_date,
    appointment_time,
    symptoms
  } = req.body;

  // Validate fields
  if (
    !doctor_id ||
    !patient_name ||
    !patient_age ||
    !patient_gender ||
    !patient_phone ||
    !patient_email ||
    !appointment_date ||
    !appointment_time ||
    !symptoms
  ) {
    return res.status(400).json({ message: 'All booking fields are required.' });
  }

  // Parse and validate age
  const parsedAge = parseInt(patient_age, 10);
  if (isNaN(parsedAge) || parsedAge <= 0) {
    return res.status(400).json({ message: 'Please provide a valid age.' });
  }

  try {
    // Check if the doctor exists
    const [doctorRows] = await db.query('SELECT * FROM doctors WHERE doctor_id = ?', [doctor_id]);
    if (doctorRows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    // Insert appointment
    const [result] = await db.query(
      `INSERT INTO appointments 
      (customer_id, doctor_id, patient_name, patient_age, patient_gender, patient_phone, patient_email, appointment_date, appointment_time, symptoms, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        customerId,
        doctor_id,
        patient_name,
        parsedAge,
        patient_gender,
        patient_phone,
        patient_email,
        appointment_date,
        appointment_time,
        symptoms
      ]
    );

    return res.status(201).json({
      message: 'Appointment booked successfully!',
      appointmentId: result.insertId
    });
  } catch (error) {
    console.error('Book Appointment Error:', error);
    return res.status(500).json({ message: 'Internal server error while booking appointment.' });
  }
};

// Get appointments for the logged-in customer
exports.getCustomerAppointments = async (req, res) => {
  const customerId = req.user.id;

  try {
    const [appointments] = await db.query(
      `SELECT 
        a.appointment_id, 
        a.doctor_id, 
        a.patient_name,
        a.patient_age,
        a.patient_gender,
        a.patient_phone,
        a.patient_email,
        a.appointment_date, 
        a.appointment_time, 
        a.symptoms, 
        a.status, 
        a.created_at,
        d.name AS doctor_name, 
        d.specialization AS doctor_specialization,
        d.photo AS doctor_photo
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.customer_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [customerId]
    );

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Fetch Customer Appointments Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching appointments.' });
  }
};

// Get appointments for the logged-in doctor
exports.getDoctorAppointments = async (req, res) => {
  const doctorId = req.user.id;

  try {
    const [appointments] = await db.query(
      `SELECT 
        appointment_id, 
        customer_id, 
        patient_name, 
        patient_age, 
        patient_gender, 
        patient_phone, 
        patient_email, 
        appointment_date, 
        appointment_time, 
        symptoms, 
        status, 
        created_at
      FROM appointments 
      WHERE doctor_id = ?
      ORDER BY appointment_date ASC, appointment_time ASC`,
      [doctorId]
    );

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Fetch Doctor Appointments Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching doctor appointments.' });
  }
};

// Update appointment status (Accept, Reject, Mark Completed)
exports.updateAppointmentStatus = async (req, res) => {
  const doctorId = req.user.id;
  const { id } = req.params;
  const { status } = req.body;

  // Validate status input
  const validStatuses = ['Accepted', 'Rejected', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status update. Choose from Accepted, Rejected, Completed.' });
  }

  try {
    // Check if appointment exists and belongs to the logged-in doctor
    const [rows] = await db.query(
      'SELECT * FROM appointments WHERE appointment_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = rows[0];
    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Forbidden: You cannot modify appointments for other doctors.' });
    }

    // Update status
    await db.query(
      'UPDATE appointments SET status = ? WHERE appointment_id = ?',
      [status, id]
    );

    return res.status(200).json({
      message: `Appointment successfully marked as ${status}.`,
      appointmentId: id,
      status: status
    });
  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    return res.status(500).json({ message: 'Internal server error while updating appointment status.' });
  }
};
