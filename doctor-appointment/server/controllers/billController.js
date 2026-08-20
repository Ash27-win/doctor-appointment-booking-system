const db = require('../config/db');

// Create a new bill (Doctor only)
exports.createBill = async (req, res) => {
  const doctorId = req.user.id;
  const {
    appointment_id,
    consultation_fee,
    medicine_charges,
    lab_charges,
    scan_charges,
    other_charges,
    discount,
    tax,
    payment_status,
    payment_method,
    bill_date
  } = req.body;

  // Basic validation
  if (!appointment_id || !bill_date) {
    return res.status(400).json({ message: 'Appointment ID and bill date are required.' });
  }

  // Parse numeric values
  const fee = parseFloat(consultation_fee) || 0;
  const med = parseFloat(medicine_charges) || 0;
  const lab = parseFloat(lab_charges) || 0;
  const scan = parseFloat(scan_charges) || 0;
  const other = parseFloat(other_charges) || 0;
  const disc = parseFloat(discount) || 0;
  const tx = parseFloat(tax) || 0;

  // Ensure no negative values
  if (fee < 0 || med < 0 || lab < 0 || scan < 0 || other < 0 || disc < 0 || tx < 0) {
    return res.status(400).json({ message: 'Monetary charges and discounts cannot be negative.' });
  }

  // Subtotal and Grand Total calculation
  const subtotal = fee + med + lab + scan + other;
  let grandTotal = subtotal - disc + tx;
  if (grandTotal < 0) grandTotal = 0; // prevent negative final invoice

  const validStatuses = ['Pending', 'Paid', 'Cancelled'];
  if (payment_status && !validStatuses.includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  const validMethods = ['Cash', 'UPI', 'Card', 'Online', 'None'];
  if (payment_method && !validMethods.includes(payment_method)) {
    return res.status(400).json({ message: 'Invalid payment method.' });
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

    // Check if a bill already exists for this appointment
    const [existingBills] = await db.query(
      'SELECT bill_id FROM bills WHERE appointment_id = ?',
      [appointment_id]
    );

    if (existingBills.length > 0) {
      return res.status(400).json({ message: 'A bill already exists for this appointment. Use update instead.' });
    }

    // Save bill
    const [result] = await db.query(
      `INSERT INTO bills 
       (appointment_id, doctor_id, customer_id, consultation_fee, medicine_charges, lab_charges, scan_charges, other_charges, discount, tax, grand_total, payment_status, payment_method, bill_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment_id,
        doctorId,
        appointment.customer_id,
        fee,
        med,
        lab,
        scan,
        other,
        disc,
        tx,
        grandTotal,
        payment_status || 'Pending',
        payment_method || 'None',
        bill_date
      ]
    );

    return res.status(201).json({
      message: 'Bill generated and saved successfully!',
      billId: result.insertId,
      grandTotal: grandTotal
    });
  } catch (error) {
    console.error('Create Bill Error:', error);
    return res.status(500).json({ message: 'Internal server error while creating bill.' });
  }
};

// Get bill details by appointment ID (Doctor and Customer)
exports.getBillByAppointmentId = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { appointmentId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT b.*, d.name AS doctor_name, d.specialization AS doctor_specialization, 
              c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
              a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email,
              a.appointment_date, a.appointment_time
       FROM bills b
       JOIN doctors d ON b.doctor_id = d.doctor_id
       JOIN customers c ON b.customer_id = c.customer_id
       JOIN appointments a ON b.appointment_id = a.appointment_id
       WHERE b.appointment_id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No bill found for this appointment.' });
    }

    const bill = rows[0];

    // Authorization checks
    if (role === 'customer' && bill.customer_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: You cannot view this bill.' });
    }
    if (role === 'doctor' && bill.doctor_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: This bill belongs to another doctor\'s patient.' });
    }

    return res.status(200).json(bill);
  } catch (error) {
    console.error('Fetch Bill Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching bill details.' });
  }
};

// Update an existing bill (Doctor only)
exports.updateBill = async (req, res) => {
  const doctorId = req.user.id;
  const { id } = req.params; // bill_id
  const {
    consultation_fee,
    medicine_charges,
    lab_charges,
    scan_charges,
    other_charges,
    discount,
    tax,
    payment_status,
    payment_method,
    bill_date
  } = req.body;

  if (!bill_date) {
    return res.status(400).json({ message: 'Bill date is required.' });
  }

  // Parse numeric values
  const fee = parseFloat(consultation_fee) || 0;
  const med = parseFloat(medicine_charges) || 0;
  const lab = parseFloat(lab_charges) || 0;
  const scan = parseFloat(scan_charges) || 0;
  const other = parseFloat(other_charges) || 0;
  const disc = parseFloat(discount) || 0;
  const tx = parseFloat(tax) || 0;

  if (fee < 0 || med < 0 || lab < 0 || scan < 0 || other < 0 || disc < 0 || tx < 0) {
    return res.status(400).json({ message: 'Monetary charges and discounts cannot be negative.' });
  }

  const subtotal = fee + med + lab + scan + other;
  let grandTotal = subtotal - disc + tx;
  if (grandTotal < 0) grandTotal = 0;

  const validStatuses = ['Pending', 'Paid', 'Cancelled'];
  if (payment_status && !validStatuses.includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  const validMethods = ['Cash', 'UPI', 'Card', 'Online', 'None'];
  if (payment_method && !validMethods.includes(payment_method)) {
    return res.status(400).json({ message: 'Invalid payment method.' });
  }

  try {
    // Verify bill exists and belongs to the doctor
    const [billRows] = await db.query(
      'SELECT doctor_id FROM bills WHERE bill_id = ?',
      [id]
    );

    if (billRows.length === 0) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    if (billRows[0].doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Access Denied: You cannot update another doctor\'s bill.' });
    }

    // Update
    await db.query(
      `UPDATE bills 
       SET consultation_fee = ?, medicine_charges = ?, lab_charges = ?, scan_charges = ?, other_charges = ?, 
           discount = ?, tax = ?, grand_total = ?, payment_status = ?, payment_method = ?, bill_date = ?
       WHERE bill_id = ?`,
      [
        fee,
        med,
        lab,
        scan,
        other,
        disc,
        tx,
        grandTotal,
        payment_status || 'Pending',
        payment_method || 'None',
        bill_date,
        id
      ]
    );

    return res.status(200).json({
      message: 'Bill updated successfully!',
      grandTotal: grandTotal
    });
  } catch (error) {
    console.error('Update Bill Error:', error);
    return res.status(500).json({ message: 'Internal server error while updating bill.' });
  }
};
