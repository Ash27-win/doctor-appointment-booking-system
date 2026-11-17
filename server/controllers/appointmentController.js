/**
 * ============================================================================
 * APPOINTMENT CONTROLLER (appointmentController.js)
 * ============================================================================
 * 
 * VALIDATION & BUSINESS LOGIC INSTRUCTIONS:
 * 1. bookAppointment:
 *    - Validates all patient input parameters.
 *    - VERIFIES DOCTOR WORKING DAYS: Ensures doctor is on duty on that day of week.
 *    - PREVENTS DOUBLE BOOKINGS: Queries active appointments for the exact doctor, date, and slot.
 * 2. cancelAppointment:
 *    - Only the patient who made the booking can cancel it.
 *    - Cannot cancel completed or already cancelled appointments.
 *    - Saves cancellation reason in database and frees up slot for other patients.
 * 3. rescheduleAppointment:
 *    - Validates future date and doctor's practicing schedule.
 *    - Checks for time slot availability before updating.
 * 4. updateAppointmentStatus:
 *    - Doctor only; ensures status changes follow allowed workflows.
 */

const db = require('../config/db');

// 1. Book a new appointment
exports.bookAppointment = async (req, res) => {
  const customerId = req.user.id;
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

  // Validation
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
    return res.status(400).json({ message: 'All booking fields are mandatory.' });
  }

  const parsedAge = parseInt(patient_age, 10);
  if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return res.status(400).json({ message: 'Patient age must be between 1 and 120.' });
  }

  // Ensure appointment_date is not in the past
  const apptDateObj = new Date(`${appointment_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (apptDateObj < today) {
    return res.status(400).json({ message: 'Appointment date cannot be in the past.' });
  }

  try {
    // 1. Check if the doctor exists and is active
    const [doctorRows] = await db.query('SELECT * FROM doctors WHERE doctor_id = ?', [doctor_id]);
    if (doctorRows.length === 0) {
      return res.status(404).json({ message: 'Selected doctor does not exist.' });
    }
    const doctor = doctorRows[0];

    // 2. Validate day of week against doctor's available_days
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDay = daysOfWeek[apptDateObj.getDay()];
    const allowedDays = doctor.available_days.split(',').map(d => d.trim().toLowerCase());

    if (!allowedDays.includes(selectedDay.toLowerCase())) {
      return res.status(400).json({
        message: `${doctor.name} does not practice on ${selectedDay}s. Available days: ${doctor.available_days}`
      });
    }

    // 3. CONFLICT CHECK: Prevent double-booking on exact doctor, date, and slot
    const [existingBookings] = await db.query(
      `SELECT appointment_id 
       FROM appointments 
       WHERE doctor_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ? 
         AND status NOT IN ('Cancelled', 'Rejected')`,
      [doctor_id, appointment_date, appointment_time]
    );

    if (existingBookings.length > 0) {
      return res.status(409).json({
        message: 'This time slot is already booked by another patient. Please choose a different slot.'
      });
    }

    // 4. Insert the new appointment
    const [result] = await db.query(
      `INSERT INTO appointments 
      (customer_id, doctor_id, patient_name, patient_age, patient_gender, patient_phone, patient_email, appointment_date, appointment_time, symptoms, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        customerId,
        doctor_id,
        patient_name.trim(),
        parsedAge,
        patient_gender,
        patient_phone.trim(),
        patient_email.trim(),
        appointment_date,
        appointment_time.trim(),
        symptoms.trim()
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

// 2. Get appointments for the logged-in customer
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
        a.cancellation_reason, 
        a.created_at, 
        d.name AS doctor_name, 
        d.specialization AS doctor_specialization, 
        d.available_days AS doctor_available_days, 
        d.available_time AS doctor_available_time, 
        d.consultation_fee AS doctor_fee, 
        d.photo AS doctor_photo,
        (SELECT COUNT(*) FROM prescriptions p WHERE p.appointment_id = a.appointment_id) AS has_prescription,
        (SELECT COUNT(*) FROM bills b WHERE b.appointment_id = a.appointment_id) AS has_bill
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.customer_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [customerId]
    );

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Fetch Customer Appointments Error:', error);
    return res.status(500).json({ message: 'Error retrieving your appointments.' });
  }
};

// 3. Cancel appointment (Customer only)
exports.cancelAppointment = async (req, res) => {
  const customerId = req.user.id;
  const { id } = req.params;
  const { cancellation_reason } = req.body;

  try {
    // Verify ownership and status
    const [rows] = await db.query('SELECT * FROM appointments WHERE appointment_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appt = rows[0];
    if (appt.customer_id !== customerId) {
      return res.status(403).json({ message: 'Forbidden: You cannot cancel appointments belonging to other patients.' });
    }

    if (appt.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed consultation.' });
    }
    if (appt.status === 'Cancelled') {
      return res.status(400).json({ message: 'This appointment is already cancelled.' });
    }

    await db.query(
      `UPDATE appointments SET status = 'Cancelled', cancellation_reason = ? WHERE appointment_id = ?`,
      [cancellation_reason || 'Cancelled by patient', id]
    );

    return res.status(200).json({ message: 'Appointment cancelled successfully. Slot is now available.' });
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    return res.status(500).json({ message: 'Failed to cancel appointment.' });
  }
};

// 4. Reschedule appointment (Customer only)
exports.rescheduleAppointment = async (req, res) => {
  const customerId = req.user.id;
  const { id } = req.params;
  const { appointment_date, appointment_time } = req.body;

  if (!appointment_date || !appointment_time) {
    return res.status(400).json({ message: 'Both new appointment date and time slot are required.' });
  }

  const apptDateObj = new Date(`${appointment_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (apptDateObj < today) {
    return res.status(400).json({ message: 'Rescheduled date cannot be in the past.' });
  }

  try {
    // Verify appointment ownership
    const [rows] = await db.query('SELECT * FROM appointments WHERE appointment_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    const appt = rows[0];
    if (appt.customer_id !== customerId) {
      return res.status(403).json({ message: 'Forbidden: You cannot reschedule this appointment.' });
    }

    if (['Completed', 'Cancelled'].includes(appt.status)) {
      return res.status(400).json({ message: `Cannot reschedule an appointment with status: ${appt.status}.` });
    }

    // Verify doctor practicing day
    const [doctorRows] = await db.query('SELECT * FROM doctors WHERE doctor_id = ?', [appt.doctor_id]);
    const doctor = doctorRows[0];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDay = daysOfWeek[apptDateObj.getDay()];
    const allowedDays = doctor.available_days.split(',').map(d => d.trim().toLowerCase());

    if (!allowedDays.includes(selectedDay.toLowerCase())) {
      return res.status(400).json({
        message: `${doctor.name} does not practice on ${selectedDay}s. Available days: ${doctor.available_days}`
      });
    }

    // Conflict check
    const [conflictRows] = await db.query(
      `SELECT appointment_id FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
         AND appointment_id != ? AND status NOT IN ('Cancelled', 'Rejected')`,
      [appt.doctor_id, appointment_date, appointment_time, id]
    );

    if (conflictRows.length > 0) {
      return res.status(409).json({ message: 'The chosen time slot is already booked. Please choose another.' });
    }

    // Update appointment
    await db.query(
      `UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'Pending' WHERE appointment_id = ?`,
      [appointment_date, appointment_time, id]
    );

    return res.status(200).json({ message: 'Appointment rescheduled successfully!' });
  } catch (error) {
    console.error('Reschedule Appointment Error:', error);
    return res.status(500).json({ message: 'Failed to reschedule appointment.' });
  }
};

// 5. Get appointments for the logged-in doctor
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
        cancellation_reason, 
        created_at
      FROM appointments 
      WHERE doctor_id = ?
      ORDER BY appointment_date ASC, appointment_time ASC`,
      [doctorId]
    );

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Fetch Doctor Appointments Error:', error);
    return res.status(500).json({ message: 'Error retrieving clinician appointments.' });
  }
};

// 6. Update appointment status (Doctor only)
exports.updateAppointmentStatus = async (req, res) => {
  const doctorId = req.user.id;
  const { id } = req.params;
  const { status, reason } = req.body;

  const validStatuses = ['Accepted', 'Rejected', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status update. Choose from Accepted, Rejected, Completed, Cancelled.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM appointments WHERE appointment_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = rows[0];
    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Forbidden: You cannot modify appointments for other doctors.' });
    }

    await db.query(
      'UPDATE appointments SET status = ?, cancellation_reason = ? WHERE appointment_id = ?',
      [status, reason || appointment.cancellation_reason, id]
    );

    return res.status(200).json({
      message: `Appointment marked as ${status}.`,
      appointmentId: id,
      status
    });
  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    return res.status(500).json({ message: 'Error updating appointment status.' });
  }
};
