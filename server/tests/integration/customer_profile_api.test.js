/**
 * ============================================================================
 * INTEGRATION TEST SUITE: PATIENT PROFILE APIS (customer_profile_api.test.js)
 * ============================================================================
 * Verifies profile retrieval, repeated edits ("again and again") with date sanitization,
 * password change workflow, and unauthorized token access guards.
 */

const { describe, it, assert } = require('../helpers/test_runner');
const client = require('../helpers/api_client');
const db = require('../../config/db');

async function runCustomerProfileApiTests() {
  const timestamp = Date.now();
  const testEmail = `profile_test_${timestamp}@caresync.org`;
  const testPassword = 'Password@123';
  let patientToken = null;
  let customerId = null;

  // Setup: Register and login test patient
  const regRes = await client.post('/api/customer/register', {
    name: 'Clinical Patient Initial',
    email: testEmail,
    phone: '9876543210',
    password: testPassword
  });
  customerId = regRes.data.customerId;

  const loginRes = await client.post('/api/customer/login', {
    email: testEmail,
    password: testPassword
  });
  patientToken = loginRes.data.token;

  await describe('Integration Testing - Patient Profile Read (GET /api/customer/profile)', async () => {
    await it('should reject profile read when token is missing with 401 Unauthorized', async () => {
      const res = await client.get('/api/customer/profile');
      assert.strictEqual(res.status, 401);
    });

    await it('should return 200 with patient clinical record when authorized', async () => {
      const res = await client.get('/api/customer/profile', patientToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.email, testEmail);
      assert.strictEqual(res.data.name, 'Clinical Patient Initial');
    });
  });

  await describe('Integration Testing - Continuous Profile Edits ("Again and Again")', async () => {
    await it('1st Edit: should update phone, blood group to B+, and ISO formatted DOB', async () => {
      const res = await client.put('/api/customer/profile', {
        name: 'Clinical Patient V1',
        phone: '9876543211',
        gender: 'Male',
        blood_group: 'B+',
        dob: '1990-06-15T00:00:00.000Z', // ISO string
        address: '100ft Road, Indiranagar, Bangalore',
        emergency_contact: '9988776655'
      }, patientToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.blood_group, 'B+');
      assert.strictEqual(res.data.user.dob, '1990-06-15'); // Cleaned to YYYY-MM-DD
    });

    await it('2nd Edit: should immediately allow re-editing blood group to O+ and new address', async () => {
      const res = await client.put('/api/customer/profile', {
        name: 'Clinical Patient V2',
        phone: '9876543212',
        gender: 'Male',
        blood_group: 'O+',
        dob: '1990-06-15',
        address: 'MG Road, Bangalore',
        emergency_contact: '9876543299'
      }, patientToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.name, 'Clinical Patient V2');
      assert.strictEqual(res.data.user.blood_group, 'O+');
      assert.strictEqual(res.data.user.address, 'MG Road, Bangalore');
    });

    await it('3rd Edit: should allow updating phone and clearing emergency contact without errors', async () => {
      const res = await client.put('/api/customer/profile', {
        name: 'Clinical Patient Final',
        phone: '9876543210',
        gender: 'Male',
        blood_group: 'O+',
        dob: '1990-06-15',
        address: 'MG Road, Bangalore',
        emergency_contact: '' // Cleared
      }, patientToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.emergency_contact, null);
    });

    await it('Verification: DB fetch should reflect the final updated record', async () => {
      const res = await client.get('/api/customer/profile', patientToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.name, 'Clinical Patient Final');
      assert.strictEqual(res.data.blood_group, 'O+');
      assert.strictEqual(res.data.phone, '9876543210');
    });
  });

  await describe('Integration Testing - Password Change API (PUT /api/customer/change-password)', async () => {
    await it('should reject password change when current password is wrong with 400 Bad Request', async () => {
      const res = await client.put('/api/customer/change-password', {
        currentPassword: 'IncorrectOldPassword',
        newPassword: 'BrandNewPassword@456'
      }, patientToken);

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /Current password does not match/i);
    });

    await it('should update password when current password matches and new password meets policy', async () => {
      const res = await client.put('/api/customer/change-password', {
        currentPassword: testPassword,
        newPassword: 'BrandNewPassword@456'
      }, patientToken);

      assert.strictEqual(res.status, 200);
      assert.match(res.data.message, /Password updated successfully/i);

      // Verify login with new password
      const newLogin = await client.post('/api/customer/login', {
        email: testEmail,
        password: 'BrandNewPassword@456'
      });
      assert.strictEqual(newLogin.status, 200);
    });
  });

  // Cleanup
  await db.query('DELETE FROM customers WHERE customer_id = ?', [customerId]);
}

module.exports = runCustomerProfileApiTests;

if (require.main === module) {
  runCustomerProfileApiTests().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
    client.stopTestServer();
    process.exit(0);
  });
}
