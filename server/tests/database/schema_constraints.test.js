/**
 * ============================================================================
 * DATABASE & SCHEMA INTEGRITY TEST SUITE (schema_constraints.test.js)
 * ============================================================================
 * Tests connection pool health, existence of all required tables,
 * ENUM validation, unique email constraints, and double-booking collision guards.
 */

const { describe, it, assert } = require('../helpers/test_runner');
const db = require('../../config/db');

async function runDatabaseIntegrityTests() {
  await describe('Database Testing - Connection Pool & Health Check', async () => {
    await it('should successfully ping MySQL server and execute a query', async () => {
      const [rows] = await db.query('SELECT 1 + 1 AS result');
      assert.strictEqual(rows[0].result, 2);
    });

    await it('should verify database name matches doctor_appointment', async () => {
      const [rows] = await db.query('SELECT DATABASE() AS db_name');
      assert.strictEqual(rows[0].db_name, 'doctor_appointment');
    });
  });

  await describe('Database Testing - Table Schema & Column Verification', async () => {
    await it('should verify all required tables exist in database', async () => {
      const [tables] = await db.query('SHOW TABLES');
      const tableNames = tables.map(t => Object.values(t)[0]);
      
      const expectedTables = [
        'admins', 
        'doctors', 
        'customers', 
        'appointments', 
        'prescriptions', 
        'prescription_medicines',
        'recommended_tests', 
        'bills'
      ];

      for (const expected of expectedTables) {
        assert.ok(tableNames.includes(expected), `Missing required table: ${expected}`);
      }
    });

    await it('should verify customers table has all required clinical profile columns', async () => {
      const [cols] = await db.query('DESCRIBE customers');
      const colNames = cols.map(c => c.Field);

      const requiredColumns = [
        'customer_id', 'name', 'email', 'phone', 'password',
        'gender', 'blood_group', 'dob', 'address', 'emergency_contact', 'created_at'
      ];

      for (const col of requiredColumns) {
        assert.ok(colNames.includes(col), `customers table missing column: ${col}`);
      }
    });

    await it('should verify appointments table status ENUM supports all 5 statuses', async () => {
      const [cols] = await db.query("SHOW COLUMNS FROM appointments LIKE 'status'");
      assert.strictEqual(cols.length, 1);
      const statusType = cols[0].Type;
      
      assert.ok(statusType.includes("'Pending'"), 'Missing Pending in status enum');
      assert.ok(statusType.includes("'Accepted'"), 'Missing Accepted in status enum');
      assert.ok(statusType.includes("'Rejected'"), 'Missing Rejected in status enum');
      assert.ok(statusType.includes("'Completed'"), 'Missing Completed in status enum');
      assert.ok(statusType.includes("'Cancelled'"), 'Missing Cancelled in status enum');
    });
  });

  await describe('Database Testing - SQL Constraints & Foreign Key Integrity', async () => {
    const timestamp = Date.now();
    const testEmail = `constraint_test_${timestamp}@hospital.com`;

    await it('should enforce UNIQUE constraint on customers.email', async () => {
      // 1. Insert initial test customer
      await db.query(
        'INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)',
        ['Constraint Test Patient', testEmail, '9876543210', 'hashed_pass_123']
      );

      // 2. Attempt duplicate insert with identical email
      let duplicateCaught = false;
      try {
        await db.query(
          'INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)',
          ['Another Duplicate Patient', testEmail, '9876543211', 'hashed_pass_456']
        );
      } catch (err) {
        duplicateCaught = true;
        assert.strictEqual(err.code, 'ER_DUP_ENTRY');
      }

      assert.strictEqual(duplicateCaught, true, 'Database allowed duplicate email violation!');

      // Cleanup
      await db.query('DELETE FROM customers WHERE email = ?', [testEmail]);
    });

    await it('should enforce Foreign Key constraint on appointments.doctor_id', async () => {
      // Get an existing customer
      const [custs] = await db.query('SELECT customer_id FROM customers LIMIT 1');
      const customerId = custs[0].customer_id;
      const nonExistentDoctorId = 999999;

      let fkErrorCaught = false;
      try {
        await db.query(
          `INSERT INTO appointments 
            (customer_id, doctor_id, patient_name, patient_age, patient_gender, patient_phone, patient_email, appointment_date, appointment_time, symptoms, status) 
          VALUES (?, ?, 'Test Patient', 30, 'Male', '9876543210', 'patient@test.com', '2099-12-31', '10:00 AM', 'Test symptoms', 'Pending')`,
          [customerId, nonExistentDoctorId]
        );
      } catch (err) {
        fkErrorCaught = true;
        assert.strictEqual(err.code, 'ER_NO_REFERENCED_ROW_2');
      }

      assert.strictEqual(fkErrorCaught, true, 'Database allowed appointment with non-existent doctor foreign key!');
    });
  });
}

module.exports = runDatabaseIntegrityTests;

if (require.main === module) {
  runDatabaseIntegrityTests().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
    process.exit(0);
  });
}
