/**
 * ============================================================================
 * INTEGRATION TEST SUITE: AUTHENTICATION APIS (auth_api.test.js)
 * ============================================================================
 * Tests HTTP request-response flow for Patient Registration, Patient Login,
 * Doctor Login, Admin Login, JWT issuance, and invalid credentials rejection.
 */

const { describe, it, assert } = require('../helpers/test_runner');
const client = require('../helpers/api_client');
const db = require('../../config/db');

async function runAuthApiIntegrationTests() {
  const timestamp = Date.now();
  const testPatientEmail = `integ_patient_${timestamp}@caresync.org`;
  const testPatientPassword = 'PatientStrong@123';

  await describe('Integration Testing - Patient Registration API (POST /api/customer/register)', async () => {
    await it('should successfully register a new patient and return 201 with account details', async () => {
      const res = await client.post('/api/customer/register', {
        name: 'Integration Test Patient',
        email: testPatientEmail,
        phone: '9876543210',
        password: testPatientPassword
      });

      assert.strictEqual(res.status, 201);
      assert.match(res.data.message, /Registration successful/i);
      assert.ok(res.data.customerId, 'Expected customerId in response');
    });

    await it('should reject registration when email already exists with 400 Bad Request', async () => {
      const res = await client.post('/api/customer/register', {
        name: 'Duplicate Patient',
        email: testPatientEmail, // Duplicate
        phone: '9876543211',
        password: testPatientPassword
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /Email already exists/i);
    });

    await it('should reject registration with invalid payload format with 400 Bad Request', async () => {
      const res = await client.post('/api/customer/register', {
        name: 'A', // Too short (< 2)
        email: 'invalid-email',
        phone: '123',
        password: 'weak'
      });

      assert.strictEqual(res.status, 400);
    });
  });

  await describe('Integration Testing - Patient Login API (POST /api/customer/login)', async () => {
    await it('should authenticate valid patient and return 200 with JWT token and customer role', async () => {
      const res = await client.post('/api/customer/login', {
        email: testPatientEmail,
        password: testPatientPassword
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.token, 'Response missing JWT token');
      assert.strictEqual(res.data.user.role, 'customer');
      assert.strictEqual(res.data.user.email, testPatientEmail);
    });

    await it('should reject login with wrong password with 400 Bad Request', async () => {
      const res = await client.post('/api/customer/login', {
        email: testPatientEmail,
        password: 'WrongPassword@999'
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /Invalid (credentials|email or password)/i);
    });

    await it('should reject login for non-existent email with 400 Bad Request', async () => {
      const res = await client.post('/api/customer/login', {
        email: 'unregistered.ghost@hospital.com',
        password: 'AnyPassword@123'
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /Invalid (credentials|email or password)/i);
    });
  });

  await describe('Integration Testing - Doctor Login API (POST /api/doctor/login)', async () => {
    await it('should authenticate seeded doctor and return 200 with doctor role', async () => {
      // Fetch an active doctor email from DB
      const [doctors] = await db.query('SELECT email FROM doctors LIMIT 1');
      assert.ok(doctors.length > 0, 'No doctor available to test');
      const doctorEmail = doctors[0].email;

      const res = await client.post('/api/doctor/login', {
        email: doctorEmail,
        password: 'doctor123' // Seeded default password
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.token, 'Doctor login response missing token');
      assert.strictEqual(res.data.user.role, 'doctor');
    });

    await it('should reject doctor login with invalid credentials with 400 Bad Request', async () => {
      const res = await client.post('/api/doctor/login', {
        email: 'fake.doctor@hospital.com',
        password: 'randomPassword@123'
      });

      assert.strictEqual(res.status, 400);
    });
  });

  await describe('Integration Testing - Admin Login API (POST /api/admin/login)', async () => {
    await it('should authenticate system administrator (admin@hospital.com) and return 200 with admin role', async () => {
      const res = await client.post('/api/admin/login', {
        email: 'admin@hospital.com',
        password: 'admin123'
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.token, 'Admin login response missing token');
      assert.strictEqual(res.data.user.role, 'admin');
    });

    await it('should reject admin login with incorrect password with 401 Unauthorized', async () => {
      const res = await client.post('/api/admin/login', {
        email: 'admin@hospital.com',
        password: 'wrongAdminPassword'
      });

      assert.strictEqual(res.status, 401);
      assert.match(res.data.message, /Invalid admin(istrative)? credentials/i);
    });
  });

  // Cleanup test user
  await db.query('DELETE FROM customers WHERE email = ?', [testPatientEmail]);
}

module.exports = runAuthApiIntegrationTests;

if (require.main === module) {
  runAuthApiIntegrationTests().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
    client.stopTestServer();
    process.exit(0);
  });
}
