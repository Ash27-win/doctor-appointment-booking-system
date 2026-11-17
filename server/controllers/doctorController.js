/**
 * ============================================================================
 * DOCTOR CONTROLLER (doctorController.js)
 * ============================================================================
 * 
 * VALIDATION & LOGIC INSTRUCTIONS:
 * 1. getAllDoctors & getDoctorById:
 *    - Never expose password hashes.
 *    - Include clinical metadata: consultation_fee, bio, experience, visiting schedule.
 * 2. getAvailableSlots:
 *    - Validates date parameter (cannot be past date).
 *    - Validates whether date falls on doctor's practicing days (available_days).
 *    - Dynamically generates 30-minute interval slots from doctor's visiting hours.
 *    - Queries database for active appointments on that date to mark slots as booked.
 *    - If date is today, marks slots before the current time as past.
 * 3. updateDoctorProfile:
 *    - Doctor can only update their own profile.
 *    - Enforces positive experience and consultation fee > 0.
 * 4. changeDoctorPassword:
 *    - Validates old password using bcrypt.compare.
 *    - Enforces strong password policy on the new password.
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Get all doctors (excluding passwords)
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
        photo, 
        email 
      FROM doctors 
      ORDER BY name ASC`
    );
    return res.status(200).json(doctors);
  } catch (error) {
    console.error('Fetch Doctors Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching doctors list.' });
  }
};

// 2. Get a single doctor by ID
exports.getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
        doctor_id, 
        name, 
        specialization, 
        experience, 
        available_days, 
        available_time, 
        consultation_fee, 
        bio, 
        photo, 
        email 
      FROM doctors 
      WHERE doctor_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Fetch Doctor Details Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching doctor profile.' });
  }
};

/**
 * Helper: Convert 12h time string ("09:00 AM") to minutes from midnight
 */
const parseTimeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.trim().split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

/**
 * Helper: Format minutes from midnight to 12h string ("09:00 AM")
 */
const formatMinutesTo12h = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  return `${formattedHours}:${formattedMinutes} ${modifier}`;
};

// 3. Get Real-Time Dynamic Available Slots for a Doctor on a Date
exports.getAvailableSlots = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  // Validate date format YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'A valid date in YYYY-MM-DD format is required.' });
  }

  try {
    // 1. Fetch Doctor details
    const [doctorRows] = await db.query('SELECT * FROM doctors WHERE doctor_id = ?', [id]);
    if (doctorRows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    const doctor = doctorRows[0];

    // 2. Validate against doctor's available days
    const appointmentDate = new Date(`${date}T00:00:00`);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[appointmentDate.getDay()];
    const allowedDays = doctor.available_days.split(',').map(d => d.trim().toLowerCase());

    const isWorkingDay = allowedDays.includes(dayName.toLowerCase());
    if (!isWorkingDay) {
      return res.status(200).json({
        date,
        dayName,
        isWorkingDay: false,
        message: `${doctor.name} is not available on ${dayName}s. Practicing days: ${doctor.available_days}`,
        slots: []
      });
    }

    // 3. Generate dynamic slots from available_time (e.g. "09:00 AM - 01:00 PM")
    const timeParts = doctor.available_time.split('-').map(t => t.trim());
    let generatedSlots = [];

    if (timeParts.length === 2) {
      const startMinutes = parseTimeToMinutes(timeParts[0]);
      const endMinutes = parseTimeToMinutes(timeParts[1]);
      const slotDuration = 30; // 30-minute consultation slots

      for (let m = startMinutes; m < endMinutes; m += slotDuration) {
        generatedSlots.push(formatMinutesTo12h(m));
      }
    } else {
      // Fallback default slots if custom string parsing fails
      generatedSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
    }

    // 4. Query booked appointments for this doctor on this date
    const [bookedRows] = await db.query(
      `SELECT appointment_time 
       FROM appointments 
       WHERE doctor_id = ? 
         AND appointment_date = ? 
         AND status NOT IN ('Cancelled', 'Rejected')`,
      [id, date]
    );

    const bookedTimesSet = new Set(bookedRows.map(r => r.appointment_time));

    // 5. Check if date is today to mark past time slots
    const today = new Date();
    const isToday = today.toISOString().split('T')[0] === date;
    const currentMinutesNow = today.getHours() * 60 + today.getMinutes();

    const slotsResult = generatedSlots.map(slotTime => {
      const isBooked = bookedTimesSet.has(slotTime);
      let isPast = false;

      if (isToday) {
        const slotMin = parseTimeToMinutes(slotTime);
        if (slotMin <= currentMinutesNow) {
          isPast = true;
        }
      }

      return {
        time: slotTime,
        isAvailable: !isBooked && !isPast,
        reason: isBooked ? 'Booked' : isPast ? 'Past' : null
      };
    });

    return res.status(200).json({
      date,
      dayName,
      isWorkingDay: true,
      availableTime: doctor.available_time,
      slots: slotsResult
    });
  } catch (error) {
    console.error('Fetch Available Slots Error:', error);
    return res.status(500).json({ message: 'Internal server error while calculating appointment slots.' });
  }
};

// 4. Get Logged-In Doctor Profile
exports.getDoctorProfile = async (req, res) => {
  const doctorId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        doctor_id, 
        name, 
        specialization, 
        experience, 
        available_days, 
        available_time, 
        consultation_fee, 
        bio, 
        photo, 
        email 
      FROM doctors 
      WHERE doctor_id = ?`,
      [doctorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Get Doctor Profile Error:', error);
    return res.status(500).json({ message: 'Error retrieving doctor profile.' });
  }
};

// 5. Update Logged-In Doctor Profile
exports.updateDoctorProfile = async (req, res) => {
  const doctorId = req.user.id;
  const {
    name,
    specialization,
    experience,
    available_days,
    available_time,
    consultation_fee,
    bio
  } = req.body;

  // Validation
  if (!name || !specialization || !available_days || !available_time) {
    return res.status(400).json({ message: 'Name, specialization, practicing days, and visiting hours are required.' });
  }

  const exp = parseInt(experience, 10);
  if (isNaN(exp) || exp < 0 || exp > 60) {
    return res.status(400).json({ message: 'Experience must be a positive integer between 0 and 60.' });
  }

  const fee = parseFloat(consultation_fee);
  if (isNaN(fee) || fee <= 0) {
    return res.status(400).json({ message: 'Consultation fee must be greater than ₹0.' });
  }

  try {
    await db.query(
      `UPDATE doctors SET 
        name = ?, 
        specialization = ?, 
        experience = ?, 
        available_days = ?, 
        available_time = ?, 
        consultation_fee = ?, 
        bio = ? 
      WHERE doctor_id = ?`,
      [name, specialization, exp, available_days, available_time, fee, bio || null, doctorId]
    );

    return res.status(200).json({
      message: 'Profile updated successfully!',
      doctor: {
        id: doctorId,
        name,
        specialization,
        experience: exp,
        available_days,
        available_time,
        consultation_fee: fee,
        bio
      }
    });
  } catch (error) {
    console.error('Update Doctor Profile Error:', error);
    return res.status(500).json({ message: 'Failed to update doctor profile.' });
  }
};

// 6. Change Doctor Password
exports.changeDoctorPassword = async (req, res) => {
  const doctorId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new passwords are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }

  try {
    const [rows] = await db.query('SELECT password FROM doctors WHERE doctor_id = ?', [doctorId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match our records.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE doctors SET password = ? WHERE doctor_id = ?', [hashedPassword, doctorId]);

    return res.status(200).json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change Doctor Password Error:', error);
    return res.status(500).json({ message: 'Failed to change password.' });
  }
};
