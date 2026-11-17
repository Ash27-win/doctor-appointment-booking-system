/**
 * ============================================================================
 * ADMIN CONTROLLER (adminController.js)
 * ============================================================================
 * 
 * VALIDATION & BUSINESS LOGIC INSTRUCTIONS:
 * 1. adminLogin:
 *    - Authenticates hospital administrators against the `admins` table.
 *    - Signs JWT with role: 'admin'.
 * 2. getClinicStats:
 *    - Computes live hospital KPIs: Total Doctors, Total Patients, Total Bookings, Today's Consultations, Total Revenue.
 * 3. Doctor Management (createDoctor, updateDoctor, deleteDoctor):
 *    - Enforces email uniqueness across doctors and customers.
 *    - Validates experience, working days, and consultation fees.
 * 4. getAllAppointments:
 *    - Clinic-wide oversight across all medical specialties and clinicians.
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#';

// 1. Admin Login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Admin email and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email.trim().toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { id: admin.admin_id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Admin authentication successful.',
      token,
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ message: 'Internal server error during admin login.' });
  }
};

// 2. Get Clinic Dashboard Statistics
exports.getClinicStats = async (req, res) => {
  try {
    const [[{ totalDoctors }]] = await db.query('SELECT COUNT(*) AS totalDoctors FROM doctors');
    const [[{ totalPatients }]] = await db.query('SELECT COUNT(*) AS totalPatients FROM customers');
    const [[{ totalAppointments }]] = await db.query('SELECT COUNT(*) AS totalAppointments FROM appointments');
    const [[{ todayAppointments }]] = await db.query(
      'SELECT COUNT(*) AS todayAppointments FROM appointments WHERE appointment_date = CURDATE()'
    );
    const [[{ completedAppointments }]] = await db.query(
      "SELECT COUNT(*) AS completedAppointments FROM appointments WHERE status = 'Completed'"
    );
    const [[{ totalRevenue }]] = await db.query(
      "SELECT COALESCE(SUM(grand_total), 0) AS totalRevenue FROM bills WHERE payment_status = 'Paid'"
    );

    return res.status(200).json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      totalRevenue: parseFloat(totalRevenue)
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ message: 'Error retrieving hospital analytics.' });
  }
};

// 3. Get All Doctors (Admin view with full details)
exports.getAllDoctors = async (req, res) => {
  try {
    const [doctors] = await db.query(
      `SELECT 
        doctor_id, 
        name, 
        specialization, 
        experience, 
        available_days, 
        available_time, 
        consultation_fee, 
        bio, 
        email, 
        created_at,
        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = doctors.doctor_id) AS total_consultations
      FROM doctors 
      ORDER BY doctor_id DESC`
    );
    return res.status(200).json(doctors);
  } catch (error) {
    console.error('Admin Fetch Doctors Error:', error);
    return res.status(500).json({ message: 'Error fetching doctors directory.' });
  }
};

// 4. Create New Doctor (Admin only)
exports.createDoctor = async (req, res) => {
  const {
    name,
    specialization,
    experience,
    available_days,
    available_time,
    consultation_fee,
    bio,
    email,
    password
  } = req.body;

  // Validation
  if (!name || !specialization || !available_days || !available_time || !email || !password) {
    return res.status(400).json({ message: 'All doctor fields (Name, Specialization, Days, Time, Email, Password) are required.' });
  }

  const exp = parseInt(experience, 10);
  if (isNaN(exp) || exp < 0) {
    return res.status(400).json({ message: 'Experience must be a positive integer.' });
  }

  const fee = parseFloat(consultation_fee);
  if (isNaN(fee) || fee <= 0) {
    return res.status(400).json({ message: 'Consultation fee must be greater than 0.' });
  }

  try {
    // Check email uniqueness
    const [existing] = await db.query('SELECT doctor_id FROM doctors WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A doctor with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO doctors 
      (name, specialization, experience, available_days, available_time, consultation_fee, bio, email, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        specialization.trim(),
        exp,
        available_days.trim(),
        available_time.trim(),
        fee,
        bio ? bio.trim() : null,
        email.trim().toLowerCase(),
        hashedPassword
      ]
    );

    return res.status(201).json({
      message: 'New clinician added successfully!',
      doctorId: result.insertId
    });
  } catch (error) {
    console.error('Admin Create Doctor Error:', error);
    return res.status(500).json({ message: 'Failed to onboard new doctor.' });
  }
};

// 5. Update Doctor Details (Admin only)
exports.updateDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    specialization,
    experience,
    available_days,
    available_time,
    consultation_fee,
    bio,
    email
  } = req.body;

  try {
    await db.query(
      `UPDATE doctors SET 
        name = ?, 
        specialization = ?, 
        experience = ?, 
        available_days = ?, 
        available_time = ?, 
        consultation_fee = ?, 
        bio = ?, 
        email = ? 
      WHERE doctor_id = ?`,
      [
        name.trim(),
        specialization.trim(),
        parseInt(experience, 10) || 0,
        available_days.trim(),
        available_time.trim(),
        parseFloat(consultation_fee) || 500.00,
        bio ? bio.trim() : null,
        email.trim().toLowerCase(),
        id
      ]
    );

    return res.status(200).json({ message: 'Doctor details updated successfully.' });
  } catch (error) {
    console.error('Admin Update Doctor Error:', error);
    return res.status(500).json({ message: 'Failed to update doctor details.' });
  }
};

// 6. Delete Doctor (Admin only)
exports.deleteDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM doctors WHERE doctor_id = ?', [id]);
    return res.status(200).json({ message: 'Doctor record removed successfully.' });
  } catch (error) {
    console.error('Admin Delete Doctor Error:', error);
    return res.status(500).json({ message: 'Failed to delete doctor.' });
  }
};

// 7. Get All Appointments Across Clinic
exports.getAllAppointments = async (req, res) => {
  try {
    const [appointments] = await db.query(
      `SELECT 
        a.appointment_id, 
        a.customer_id, 
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
        c.name AS customer_account_name,
        c.phone AS customer_phone
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN customers c ON a.customer_id = c.customer_id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`
    );

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Admin Fetch Appointments Error:', error);
    return res.status(500).json({ message: 'Error fetching clinic appointments.' });
  }
};

