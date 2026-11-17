/**
 * ============================================================================
 * INTEGRATION TEST SUITE: DOCTOR & ADMIN APIS (doctor_admin_api.test.js)
 * ============================================================================
 * Tests doctor directory querying, dynamic slot calculation API, clinician
 * schedule updates, admin hospital statistics, and doctor onboarding CRUD.
 */

const { describe, it, assert } = require('../helpers/test_runner');
const client = require('../helpers/api_client');
const db = require('../../config/db');

async function runDoctorAdminApiTests() {
  let adminToken = null;
  let doctorToken = null;
  let sampleDoctor = null;

  // 1. Get Admin Token
  const adminLogin = await client.post('/api/admin/login', {
    email: 'admin@hospital.com',
    password: 'admin123'
  });
  adminToken = adminLogin.data.token;

  // 2. Get Doctor Token
  const [docRows] = await db.query('SELECT * FROM doctors LIMIT 1');
  assert.ok(docRows.length > 0, 'No active doctors found');
  sampleDoctor = docRows[0];

  const docLogin = await client.post('/api/doctor/login', {
    email: sampleDoctor.email,
    password: 'doctor123'
  });
  doctorToken = docLogin.data.token;

  await describe('Integration Testing - Doctor Public Directory & Slots', async () => {
    await it('GET /api/doctors: should return all active doctors with fee, bio, and specialization', async () => {
      const res = await client.get('/api/doctors');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data), 'Expected array of doctors');
      assert.ok(res.data.length > 0);
      assert.ok(res.data[0].consultation_fee !== undefined);
    });

    await it('GET /api/doctors/:id: should return single doctor clinical profile', async () => {
      const res = await client.get(`/api/doctors/${sampleDoctor.doctor_id}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.name, sampleDoctor.name);
    });

    await it('GET /api/doctors/:id/available-slots: should return dynamic 30-min slots for valid date', async () => {
      // Find a Monday date in the future
      const d = new Date();
      d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // Next Monday
      const mondayStr = d.toISOString().split('T')[0];

      const res = await client.get(`/api/doctors/${sampleDoctor.doctor_id}/available-slots?date=${mondayStr}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.slots !== undefined);
      assert.strictEqual(res.data.date, mondayStr);
    });

    await it('GET /api/doctors/:id/available-slots: should reject invalid date format with 400', async () => {
      const res = await client.get(`/api/doctors/${sampleDoctor.doctor_id}/available-slots?date=invalid-date`);
      assert.strictEqual(res.status, 400);
    });
  });

  await describe('Integration Testing - Doctor Profile & Schedule Settings', async () => {
    await it('PUT /api/doctor/profile: should update doctor fee and schedule when authorized', async () => {
      const res = await client.put('/api/doctor/profile', {
        name: sampleDoctor.name,
        specialization: sampleDoctor.specialization,
        experience: sampleDoctor.experience,
        available_days: 'Monday, Wednesday, Friday',
        available_time: '10:00 AM - 02:00 PM',
        consultation_fee: 750.00,
        bio: 'Updated board certified specialist clinical profile.'
      }, doctorToken);

      assert.strictEqual(res.status, 200);
      assert.match(res.data.message, /Profile updated successfully/i);
    });
  });

  await describe('Integration Testing - Hospital Admin Operations', async () => {
    await it('GET /api/admin/stats: should return hospital oversight metrics', async () => {
      const res = await client.get('/api/admin/stats', adminToken);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.totalDoctors !== undefined);
      assert.ok(res.data.totalPatients !== undefined);
      assert.ok(res.data.totalAppointments !== undefined);
      assert.ok(res.data.totalRevenue !== undefined);
    });

    const timestamp = Date.now();
    const newDocEmail = `newdoc_${timestamp}@hospital.com`;
    let createdDocId = null;

    await it('POST /api/admin/doctors: should onboard new specialist into hospital directory', async () => {
      const res = await client.post('/api/admin/doctors', {
        name: 'Dr. Test Specialist',
        specialization: 'Neurology',
        experience: 12,
        available_days: 'Monday, Tuesday, Thursday',
        available_time: '09:00 AM - 01:00 PM',
        consultation_fee: 800.00,
        bio: 'Specialist in clinical neurophysiology and sleep medicine.',
        email: newDocEmail,
        password: 'DoctorPassword@123'
      }, adminToken);

      assert.strictEqual(res.status, 201);
      assert.match(res.data.message, /clinician added successfully/i);
      createdDocId = res.data.doctorId;
    });

    await it('DELETE /api/admin/doctors/:id: should safely remove onboarded doctor', async () => {
      assert.ok(createdDocId, 'Doctor was not created');
      const res = await client.delete(`/api/admin/doctors/${createdDocId}`, adminToken);
      assert.strictEqual(res.status, 200);
      assert.match(res.data.message, /Doctor (deleted|record removed) successfully/i);
    });
  });
}

module.exports = runDoctorAdminApiTests;

if (require.main === module) {
  runDoctorAdminApiTests().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
    client.stopTestServer();
    process.exit(0);
  });
}
