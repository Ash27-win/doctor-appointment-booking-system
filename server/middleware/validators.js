/**
 * ============================================================================
 * BACKEND REQUEST VALIDATION MIDDLEWARES (validators.js)
 * ============================================================================
 * 
 * VALIDATION DESIGN INSTRUCTIONS:
 * - Sanitizes incoming payloads to prevent malicious input.
 * - Enforces business logic and database constraints before queries run.
 * - Returns uniform JSON error responses with status 400 Bad Request.
 */

// 1. Validate Customer Registration
exports.validateCustomerRegister = (req, res, next) => {
  const { name, email, phone, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json({ message: 'Full name must be between 2 and 50 characters.' });
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
    return res.status(400).json({ message: 'Full name can only contain letters and standard punctuation.' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email address is required.' });
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim().toLowerCase())) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!/^(\+?[1-9]\d{0,3})?[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ message: 'Please provide a valid 10-digit mobile phone number.' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain uppercase, lowercase, numeric digit, and special symbol.' });
  }

  next();
};

// 2. Validate Login Requests
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email address is required.' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  next();
};

// 3. Validate Appointment Booking Request
exports.validateBooking = (req, res, next) => {
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

  if (!doctor_id) {
    return res.status(400).json({ message: 'Doctor ID is required.' });
  }

  if (!patient_name || patient_name.trim().length < 2) {
    return res.status(400).json({ message: 'Valid patient name is required (min 2 characters).' });
  }

  const age = parseInt(patient_age, 10);
  if (isNaN(age) || age < 1 || age > 120) {
    return res.status(400).json({ message: 'Patient age must be an integer between 1 and 120.' });
  }

  if (!patient_gender || !['Male', 'Female', 'Other'].includes(patient_gender)) {
    return res.status(400).json({ message: 'Gender must be Male, Female, or Other.' });
  }

  if (!patient_phone || !/^(\+?[1-9]\d{0,3})?[6-9]\d{9}$/.test(patient_phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ message: 'Valid 10-digit phone number is required.' });
  }

  if (!patient_email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(patient_email.trim())) {
    return res.status(400).json({ message: 'Valid email address is required.' });
  }

  if (!appointment_date) {
    return res.status(400).json({ message: 'Appointment date is required.' });
  }
  const apptDate = new Date(`${appointment_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (apptDate < today) {
    return res.status(400).json({ message: 'Appointment date cannot be in the past.' });
  }

  if (!appointment_time) {
    return res.status(400).json({ message: 'Appointment time slot is required.' });
  }

  if (!symptoms || symptoms.trim().length < 10) {
    return res.status(400).json({ message: 'Symptoms description must be at least 10 characters.' });
  }

  next();
};

// 4. Validate Billing Creation / Update
exports.validateBill = (req, res, next) => {
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

  if (!appointment_id) {
    return res.status(400).json({ message: 'Appointment ID is required.' });
  }
  if (!bill_date) {
    return res.status(400).json({ message: 'Bill date is required.' });
  }

  const fee = parseFloat(consultation_fee);
  if (isNaN(fee) || fee <= 0) {
    return res.status(400).json({ message: 'Consultation fee must be greater than 0.' });
  }

  const med = parseFloat(medicine_charges) || 0;
  const lab = parseFloat(lab_charges) || 0;
  const scan = parseFloat(scan_charges) || 0;
  const other = parseFloat(other_charges) || 0;
  const disc = parseFloat(discount) || 0;
  const tx = parseFloat(tax) || 0;

  if (med < 0 || lab < 0 || scan < 0 || other < 0 || disc < 0 || tx < 0) {
    return res.status(400).json({ message: 'Charges and discounts cannot be negative.' });
  }

  const subtotal = fee + med + lab + scan + other;
  if (disc > subtotal) {
    return res.status(400).json({ message: 'Discount cannot exceed the subtotal charges.' });
  }

  if (payment_status === 'Paid' && (!payment_method || payment_method === 'None')) {
    return res.status(400).json({ message: 'Payment method is required when marking invoice as Paid.' });
  }

  next();
};

