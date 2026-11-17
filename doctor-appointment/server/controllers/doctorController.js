const db = require('../config/db');

// Get all doctors (excluding passwords)
exports.getAllDoctors = async (req, res) => {
  try {
    const [doctors] = await db.query(
      'SELECT doctor_id, name, specialization, experience, available_days, available_time, photo, email FROM doctors'
    );
    return res.status(200).json(doctors);
  } catch (error) {
    console.error('Fetch Doctors Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching doctors' });
  }
};

// Get a single doctor by ID
exports.getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT doctor_id, name, specialization, experience, available_days, available_time, photo, email FROM doctors WHERE doctor_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Fetch Doctor Details Error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching doctor details' });
  }
};
