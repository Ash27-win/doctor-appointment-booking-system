/**
 * ============================================================================
 * DATABASE MIGRATION SCRIPT - SCHEMA EXTENSIONS & ADMIN INITIALIZATION
 * ============================================================================
 * 
 * VALIDATION & INTEGRITY INSTRUCTIONS:
 * 1. admins table:
 *    - Required for central clinic administration.
 *    - email: Unique constraint ensures no duplicate admin accounts.
 *    - password: Must store bcrypt hashed password (salt rounds >= 10).
 * 2. appointments.cancellation_reason:
 *    - Records reason when a patient or doctor cancels/rejects an appointment.
 * 3. doctors.consultation_fee & bio:
 *    - consultation_fee: Must be a positive decimal (>= 0), defaults to 500.00.
 *    - bio: Professional summary displayed on doctor profile & card.
 * 4. customers.gender, blood_group, dob, address, emergency_contact:
 *    - Enables full patient profile management with medical profile validation.
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'doctor_appointment'
  });

  try {
    console.log('Connected to MySQL. Applying schema extensions...');

    // 1. Create Admins table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`admins\` (
        \`admin_id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Seed Default Admin: admin@hospital.com / admin123
    const adminHashedPw = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT INTO \`admins\` (\`admin_id\`, \`name\`, \`email\`, \`password\`) 
      VALUES (1, 'Clinic Administrator', 'admin@hospital.com', ?) 
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`password\` = VALUES(\`password\`);
    `, [adminHashedPw]);
    console.log('Admin account ready: admin@hospital.com / admin123');

    // Helper to safely add column if not exists
    const addColumnIfNotExists = async (table, column, definition) => {
      const [rows] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
      if (rows.length === 0) {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`Added column ${column} to table ${table}`);
      }
    };

    // 3. Appointments table additions
    await addColumnIfNotExists('appointments', 'cancellation_reason', 'TEXT DEFAULT NULL');

    // Modify appointment status enum to include 'Cancelled'
    await connection.query("ALTER TABLE `appointments` MODIFY COLUMN `status` ENUM('Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending'");
    console.log("Updated appointments status enum to include 'Cancelled'");

    // 4. Doctors table additions
    await addColumnIfNotExists('doctors', 'consultation_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 500.00');
    await addColumnIfNotExists('doctors', 'bio', 'TEXT DEFAULT NULL');

    // 5. Customers table additions
    await addColumnIfNotExists('customers', 'gender', 'VARCHAR(20) DEFAULT NULL');
    await addColumnIfNotExists('customers', 'blood_group', 'VARCHAR(10) DEFAULT NULL');
    await addColumnIfNotExists('customers', 'dob', 'DATE DEFAULT NULL');
    await addColumnIfNotExists('customers', 'address', 'TEXT DEFAULT NULL');
    await addColumnIfNotExists('customers', 'emergency_contact', 'VARCHAR(100) DEFAULT NULL');
    await addColumnIfNotExists('customers', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    console.log('All migrations executed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();

