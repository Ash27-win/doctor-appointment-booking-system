const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#';

// Customer Register
exports.customerRegister = async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Basic Validation
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if email already exists in customers
    const [existingCustomer] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (existingCustomer.length > 0) {
      return res.status(400).json({ message: 'A customer with this email already exists' });
    }

    // Check if email exists in doctors (emails must be unique across authentication scopes)
    const [existingDoctor] = await db.query('SELECT * FROM doctors WHERE email = ?', [email]);
    if (existingDoctor.length > 0) {
      return res.status(400).json({ message: 'This email is already in use by a doctor' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new customer
    const [result] = await db.query(
      'INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );

    return res.status(201).json({
      message: 'Registration successful! Please log in.',
      customerId: result.insertId
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

// Customer Login
exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find customer by email
    const [rows] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const customer = rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create JWT payload
    const payload = {
      id: customer.customer_id,
      email: customer.email,
      role: 'customer'
    };

    // Sign Token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: customer.customer_id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Customer Login Error:', error);
    return res.status(500).json({ message: 'Internal server error during customer login' });
  }
};

// Doctor Login
exports.doctorLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find doctor by email
    const [rows] = await db.query('SELECT * FROM doctors WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const doctor = rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create JWT payload
    const payload = {
      id: doctor.doctor_id,
      email: doctor.email,
      role: 'doctor'
    };

    // Sign Token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: doctor.doctor_id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        experience: doctor.experience,
        available_days: doctor.available_days,
        available_time: doctor.available_time,
        role: 'doctor'
      }
    });
  } catch (error) {
    console.error('Doctor Login Error:', error);
    return res.status(500).json({ message: 'Internal server error during doctor login' });
  }
};
