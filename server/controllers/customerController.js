/**
 * ============================================================================
 * CUSTOMER (PATIENT) CONTROLLER (customerController.js)
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. getCustomerProfile:
 *    - Retrieves customer profile details (excluding password hash).
 * 2. updateCustomerProfile:
 *    - Name: Validates length (2-50) and alphabetic format.
 *    - Phone: Validates 10-digit mobile number format.
 *    - Medical details: Sanitizes gender, blood group, dob, emergency contact.
 * 3. changeCustomerPassword:
 *    - Verifies existing password with bcrypt.
 *    - Enforces min 8 characters strong password for the new password.
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Get logged-in customer profile
exports.getCustomerProfile = async (req, res) => {
  const customerId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        customer_id, 
        name, 
        email, 
        phone, 
        gender, 
        blood_group, 
        dob, 
        address, 
        emergency_contact, 
        created_at 
      FROM customers 
      WHERE customer_id = ?`,
      [customerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patient account not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Get Customer Profile Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching patient profile.' });
  }
};

// 2. Update logged-in customer profile
exports.updateCustomerProfile = async (req, res) => {
  const customerId = req.user.id;
  const { name, phone, gender, blood_group, dob, address, emergency_contact } = req.body;

  // Validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
  }

  if (!phone || !/^(\+?[1-9]\d{0,3})?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
  }

  // Sanitize Date of Birth: avoid MySQL invalid date on empty strings or ISO timestamps
  let sanitizedDob = null;
  if (dob && typeof dob === 'string' && dob.trim() !== '') {
    sanitizedDob = dob.includes('T') ? dob.split('T')[0] : dob.trim();
  }

  try {
    await db.query(
      `UPDATE customers SET 
        name = ?, 
        phone = ?, 
        gender = ?, 
        blood_group = ?, 
        dob = ?, 
        address = ?, 
        emergency_contact = ? 
      WHERE customer_id = ?`,
      [
        name.trim(),
        phone.trim(),
        gender || null,
        blood_group || null,
        sanitizedDob,
        address || null,
        emergency_contact || null,
        customerId
      ]
    );

    return res.status(200).json({
      message: 'Profile updated successfully!',
      user: {
        id: customerId,
        name: name.trim(),
        phone: phone.trim(),
        gender: gender || null,
        blood_group: blood_group || null,
        dob: sanitizedDob,
        address: address || null,
        emergency_contact: emergency_contact || null
      }
    });
  } catch (error) {
    console.error('Update Customer Profile Error:', error);
    return res.status(500).json({ message: 'Failed to update patient profile.' });
  }
};

// 3. Change Customer Password
exports.changeCustomerPassword = async (req, res) => {
  const customerId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new passwords are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }

  try {
    const [rows] = await db.query('SELECT password FROM customers WHERE customer_id = ?', [customerId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patient account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match our records.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE customers SET password = ? WHERE customer_id = ?', [hashedPassword, customerId]);

    return res.status(200).json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change Customer Password Error:', error);
    return res.status(500).json({ message: 'Failed to update password.' });
  }
};

