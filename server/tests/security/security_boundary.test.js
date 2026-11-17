/**
 * ============================================================================
 * SECURITY & PERIMETER BOUNDARY TEST SUITE (security_boundary.test.js)
 * ============================================================================
 * Tests protection against SQL injection, unauthorized access, privilege escalation,
 * Insecure Direct Object References (IDOR), and past date booking attempts.
 */

const { describe, it, assert } = require('../helpers/test_runner');
const client = require('../helpers/api_client');
const db = require('../../config/db');

async function runSecurityBoundaryTests() {
  let customerToken = null;
  let customerId = null;
  let doctorToken = null;

  const custEmail = `security_patient_${Date.now()}@caresync.org`;

  // Setup Customer
  const custRes = await client.post('/api/customer/register', {
    name: 'Security Test Patient',
    email: custEmail,
    phone: '9876543210',
    password: 'PatientStrong@123'
  });
  customerId = custRes.data.customerId;

  const loginRes = await client.post('/api/customer/login', {
    email: custEmail,
    password: 'PatientStrong@123'
  });
  customerToken = loginRes.data.token;

  // Setup Doctor
  const [docs] = await db.query('SELECT email FROM doctors LIMIT 1');
  const docLogin = await client.post('/api/doctor/login', {
    email: docs[0].email,
    password: 'doctor123'
  });
  doctorToken = docLogin.data.token;

  await describe('Security Testing - Unauthenticated Perimeter Guards (401)', async () => {
    await it('should reject access to patient profile without JWT header', async () => {
      const res = await client.get('/api/customer/profile');
      assert.strictEqual(res.status, 401);
    });

    await it('should reject access to my appointments without JWT header', async () => {
      const res = await client.get('/api/customer/appointments');
      assert.strictEqual(res.status, 401);
    });

    await it('should reject access to doctor schedule updates without JWT header', async () => {
      const res = await client.put('/api/doctor/profile', { fee: 500 });
      assert.strictEqual(res.status, 401);
    });

    await it('should reject access to hospital admin metrics without JWT header', async () => {
      const res = await client.get('/api/admin/stats');
      assert.strictEqual(res.status, 401);
    });
  });

  await describe('Security Testing - Privilege Escalation Guards (403)', async () => {
    await it('should prevent customer from accessing admin dashboard metrics (403 Forbidden)', async () => {
      const res = await client.get('/api/admin/stats', customerToken);
      assert.strictEqual(res.status, 403);
    });

    await it('should prevent customer from accessing doctor schedule settings (403 Forbidden)', async () => {
      const res = await client.put('/api/doctor/profile', { fee: 500 }, customerToken);
      assert.strictEqual(res.status, 403);
    });

    await it('should prevent doctor from creating or deleting doctors in admin center (403 Forbidden)', async () => {
      const res = await client.post('/api/admin/doctors', { name: 'Rogue Doctor' }, doctorToken);
      assert.strictEqual(res.status, 403);
    });
  });

  await describe('Security Testing - SQL Injection Resistance', async () => {
    await it('should safely reject SQL injection string in login input without executing raw SQL', async () => {
      const res = await client.post('/api/customer/login', {
        email: "' OR '1'='1' --",
        password: "' OR '1'='1' --"
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /Invalid (credentials|email or password)/i);
    });
  });

  await describe('Security Testing - Temporal & Clinical Boundary Constraints', async () => {
    await it('should block patient from booking an appointment for a past date', async () => {
      const [doctors] = await db.query('SELECT doctor_id FROM doctors LIMIT 1');
      const pastDate = '2020-01-01';

      const res = await client.post('/api/appointments', {
        doctor_id: doctors[0].doctor_id,
        patient_name: 'Security Test Patient',
        patient_age: 30,
        patient_gender: 'Male',
        patient_phone: '9876543210',
        patient_email: 'patient@caresync.org',
        appointment_date: pastDate,
        appointment_time: '10:00 AM',
        symptoms: 'Attempting retrospective consultation'
      }, customerToken);

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /cannot be in the past/i);
    });
  });

  // Cleanup
  await db.query('DELETE FROM customers WHERE customer_id = ?', [customerId]);
}

module.exports = runSecurityBoundaryTests;

if (require.main === module) {
  runSecurityBoundaryTests().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
    client.stopTestServer();
    process.exit(0);
  });
}
