/**
 * ============================================================================
 * CENTRALIZED CLIENT-SIDE VALIDATION ENGINE (validators.js)
 * ============================================================================
 * 
 * VALIDATION DESIGN PRINCIPLES:
 * 1. PURE & REUSABLE: Every validation function returns { isValid: boolean, error: string }.
 * 2. USER FRIENDLY: Error messages describe the exact expected format to guide the user.
 * 3. SECURITY CONSCIOUS: Prevents SQL/Script injection patterns, invalid bounds, and negative values.
 * 4. SYSTEM-WIDE COHESION: Shared across Customer, Doctor, and Admin modules.
 */

/**
 * ----------------------------------------------------------------------------
 * 1. EMAIL VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Must not be empty.
 * - Must conform to standard email syntax (RFC 5322 subset): username@domain.tld
 * - Top-Level Domain (TLD) must have at least 2 alphabetic characters.
 * - Whitespace is trimmed before evaluation.
 */
export const validateEmail = (email, fieldLabel = 'Email address') => {
  if (!email || !email.toString().trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const trimmed = email.toString().trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@example.com).' };
  }
  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 2. PHONE NUMBER VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Must not be empty.
 * - Must be a valid 10-digit mobile number starting with digits 6-9 (Standard Indian Telco format)
 *   or an international standard number with optional leading plus (+) and 10 to 14 digits.
 */
export const validatePhone = (phone, fieldLabel = 'Phone number') => {
  if (!phone || !phone.toString().trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const cleanPhone = phone.toString().replace(/[\s-]/g, '');
  // Standard 10-digit mobile check (digits 6-9 leading) or international E.164 (10-15 digits)
  const phoneRegex = /^(\+?[1-9]\d{0,3})?[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number (e.g., 9876543210).' };
  }
  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 3. PERSON / PATIENT / DOCTOR NAME VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Must not be empty.
 * - Must contain only alphabetic characters, spaces, periods, or hyphens (e.g. "Dr. Sarah O'Connor").
 * - Minimum length: 2 characters; Maximum length: 50 characters.
 * - Numbers and special scripting characters are strictly rejected.
 */
export const validateName = (name, fieldLabel = 'Full Name') => {
  if (!name || !name.toString().trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const trimmed = name.toString().trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters.` };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: `${fieldLabel} cannot exceed 50 characters.` };
  }
  const nameRegex = /^[a-zA-Z\s.'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} can only contain letters, spaces, and standard punctuation (. or -).` };
  }
  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 4. PASSWORD VALIDATION (LOGIN vs REGISTRATION)
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - For Login: Non-empty, min 6 characters.
 * - For Registration & Password Updates (Strong Policy):
 *   - At least 8 characters in length.
 *   - At least one uppercase letter (A-Z).
 *   - At least one lowercase letter (a-z).
 *   - At least one numeric digit (0-9).
 *   - At least one special character (!@#$%^&* etc).
 */
export const validatePassword = (password, isNewPassword = false) => {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (!isNewPassword) {
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters.' };
    }
    return { isValid: true, error: '' };
  }

  // Strong password checks
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one numeric digit (0-9).' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one special symbol (!@#$%^&*).' };
  }
  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 5. PATIENT AGE VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Must be a valid whole number integer.
 * - Allowed range: 1 to 120.
 * - Disallows floats, negatives, strings, and zero.
 */
export const validateAge = (age) => {
  if (age === undefined || age === null || age === '') {
    return { isValid: false, error: 'Patient age is required.' };
  }
  const parsed = Number(age);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) {
    return { isValid: false, error: 'Please enter a valid age between 1 and 120 years.' };
  }
  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 6. APPOINTMENT DATE & DOCTOR WORKING DAY VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Must not be empty.
 * - Must be a valid date formatted as YYYY-MM-DD.
 * - Must NOT be in the past (today or future only).
 * - Must not exceed `maxAdvanceDays` (default 90 days from today).
 * - DOCTOR SCHEDULE MATCH: If `availableDaysStr` is provided (e.g. "Monday, Wednesday, Friday"),
 *   the day of week of the selected date MUST match one of the doctor's practicing days.
 */
export const validateAppointmentDate = (dateStr, availableDaysStr = null, maxAdvanceDays = 90) => {
  if (!dateStr) {
    return { isValid: false, error: 'Please select an appointment date.' };
  }

  const selectedDate = new Date(`${dateStr}T00:00:00`);
  if (isNaN(selectedDate.getTime())) {
    return { isValid: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }

  // Today comparison at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { isValid: false, error: 'Appointment date cannot be in the past.' };
  }

  // Maximum advance booking restriction
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + maxAdvanceDays);
  maxDate.setHours(23, 59, 59, 999);
  if (selectedDate > maxDate) {
    return { isValid: false, error: `Bookings can only be scheduled up to ${maxAdvanceDays} days in advance.` };
  }

  // Doctor working day verification
  if (availableDaysStr) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDayName = daysOfWeek[selectedDate.getDay()];
    const allowedDays = availableDaysStr.split(',').map(d => d.trim().toLowerCase());
    
    if (!allowedDays.includes(selectedDayName.toLowerCase())) {
      return { 
        isValid: false, 
        error: `Doctor is only available on: ${availableDaysStr}. (${selectedDayName} is an off-day)` 
      };
    }
  }

  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 7. APPOINTMENT TIME SLOT VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Must not be empty.
 * - Must conform to standard 12-hour slot pattern: "hh:mm AM|PM"
 * - If `visitingHoursStr` is provided (e.g. "09:00 AM - 01:00 PM"), ensures slot
 *   falls chronologically within start and end boundaries.
 */
export const validateTimeSlot = (timeSlot, visitingHoursStr = null) => {
  if (!timeSlot) {
    return { isValid: false, error: 'Please select an appointment time slot.' };
  }
  const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;
  if (!timeRegex.test(timeSlot.trim())) {
    return { isValid: false, error: 'Invalid time format. Expected format like "10:00 AM".' };
  }

  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 8. SYMPTOMS / REASON FOR CONSULTATION VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Must not be empty.
 * - Minimum length: 10 characters to ensure meaningful clinical context.
 * - Maximum length: 1000 characters.
 * - Disallows dangerous HTML script tags.
 */
export const validateSymptoms = (symptoms) => {
  if (!symptoms || !symptoms.toString().trim()) {
    return { isValid: false, error: 'Please describe the symptoms or reason for visit.' };
  }
  const trimmed = symptoms.toString().trim();
  if (trimmed.length < 10) {
    return { isValid: false, error: 'Please provide at least 10 characters describing the symptoms.' };
  }
  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Symptoms description cannot exceed 1000 characters.' };
  }
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(trimmed)) {
    return { isValid: false, error: 'Invalid content detected in symptoms description.' };
  }
  return { isValid: true, error: '' };
};

/**
 * ----------------------------------------------------------------------------
 * 9. MEDICAL PRESCRIPTION VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Diagnosis: Non-empty, min 3 chars, max 255 chars.
 * - Prescription Date: Required, cannot be in future.
 * - Medicines Array: Must contain at least 1 valid prescribed medicine.
 * - Each Medicine: Name, dosage, frequency, duration, timing must be filled.
 */
export const validatePrescriptionForm = ({ diagnosis, prescriptionDate, medicines }) => {
  const errors = {};

  if (!diagnosis || !diagnosis.trim()) {
    errors.diagnosis = 'Clinical diagnosis is required.';
  } else if (diagnosis.trim().length < 3) {
    errors.diagnosis = 'Diagnosis must be at least 3 characters.';
  }

  if (!prescriptionDate) {
    errors.prescriptionDate = 'Prescription date is required.';
  } else {
    const pDate = new Date(prescriptionDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (pDate > today) {
      errors.prescriptionDate = 'Prescription date cannot be in the future.';
    }
  }

  if (!Array.isArray(medicines) || medicines.length === 0) {
    errors.medicines = 'At least one medicine must be added to the prescription.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * ----------------------------------------------------------------------------
 * 10. BILLING & INVOICE VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Consultation fee: Must be a number > 0.
 * - Line item charges: Non-negative numbers (>= 0).
 * - Discount: Must be non-negative and CANNOT exceed subtotal amount.
 * - Tax: Must be non-negative.
 * - Payment consistency: If payment_status is 'Paid', payment_method CANNOT be 'None'.
 */
export const validateBillingForm = ({
  consultationFee,
  medicineCharges,
  labCharges,
  scanCharges,
  otherCharges,
  discount,
  tax,
  paymentStatus,
  paymentMethod,
  billDate
}) => {
  const errors = {};

  const fee = parseFloat(consultationFee);
  if (isNaN(fee) || fee <= 0) {
    errors.consultationFee = 'Consultation fee must be greater than ₹0.';
  }

  const med = parseFloat(medicineCharges) || 0;
  const lab = parseFloat(labCharges) || 0;
  const scan = parseFloat(scanCharges) || 0;
  const other = parseFloat(otherCharges) || 0;
  const disc = parseFloat(discount) || 0;
  const tx = parseFloat(tax) || 0;

  if (med < 0 || lab < 0 || scan < 0 || other < 0 || disc < 0 || tx < 0) {
    errors.charges = 'Charges and discounts cannot be negative.';
  }

  const subtotal = (isNaN(fee) ? 0 : fee) + med + lab + scan + other;
  if (disc > subtotal) {
    errors.discount = `Discount (₹${disc}) cannot exceed the subtotal amount (₹${subtotal.toFixed(2)}).`;
  }

  if (paymentStatus === 'Paid' && (!paymentMethod || paymentMethod === 'None')) {
    errors.paymentMethod = 'Please specify a valid payment method (Cash, UPI, Card, Online) when marking bill as Paid.';
  }

  if (!billDate) {
    errors.billDate = 'Bill date is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * ----------------------------------------------------------------------------
 * 11. DOCTOR PROFILE & SCHEDULE VALIDATION
 * ----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * - Name: Required with title.
 * - Specialization: Required non-empty string.
 * - Experience: Positive integer between 0 and 60.
 * - Available Days: Must have at least one day selected.
 * - Available Time: Must have valid start time and end time where start < end.
 * - Consultation Fee: Positive number > 0.
 */
export const validateDoctorProfile = ({
  name,
  specialization,
  experience,
  available_days,
  available_time,
  consultation_fee
}) => {
  const errors = {};

  const nameVal = validateName(name, 'Doctor Name');
  if (!nameVal.isValid) errors.name = nameVal.error;

  if (!specialization || !specialization.trim()) {
    errors.specialization = 'Specialization is required.';
  }

  const exp = parseInt(experience, 10);
  if (isNaN(exp) || exp < 0 || exp > 60) {
    errors.experience = 'Experience must be a number between 0 and 60 years.';
  }

  if (!available_days || !available_days.trim()) {
    errors.available_days = 'At least one practicing day must be selected.';
  }

  if (!available_time || !available_time.trim()) {
    errors.available_time = 'Visiting hours are required (e.g., 09:00 AM - 01:00 PM).';
  }

  const fee = parseFloat(consultation_fee);
  if (isNaN(fee) || fee <= 0) {
    errors.consultation_fee = 'Consultation fee must be greater than ₹0.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

