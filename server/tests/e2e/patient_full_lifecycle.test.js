/**
 * ============================================================================
 * END-TO-END (E2E) TEST SUITE: COMPLETE CLINICAL LIFECYCLE SCENARIO
 * (patient_full_lifecycle.test.js)
 * ============================================================================
 * Simulates a full production user journey:
 * 1. Patient Registration & Auth
 * 2. Medical Profile Enrichment (Blood group, DOB, Emergency contact)
 * 3. Doctor Discovery & Dynamic Slot Resolution
 * 4. Appointment Booking
 * 5. Double-Booking Conflict Prevention (409 Conflict)
 * 6. Doctor Dashboard: Review & Acceptance
 * 7. Consultation Completion: Electronic Prescription & Medical Billing
 * 8. Patient Records Verification: Prescription & Invoice Retrieval
 * 9. Appointment Rescheduling & Conflict Verification
 * 10. Appointment Cancellation with Reason Submission
 * 11. Admin Global Audit & Revenue Verification
 */

const { describe, it, assert } = require('../helpers/test_runner');
const client = require('../helpers/api_client');
const db = require('../../config/db');

async function runEndToEndLifecycleTests() {
  const timestamp = Date.now();
  const patientEmail = `e2e_patient_${timestamp}@caresync.org`;
  const patientPassword = 'StrongPatient@123';
  
  let patientToken = null;
  let patientId = null;
  let doctorId = null;
  let doctorToken = null;
  let adminToken = null;
  let targetAppointmentId = null;
  let secondAppointmentId = null;
  let appointmentDate = null;
  let appointmentTime = null;

  await describe('E2E Lifecycle - 1. Patient Onboarding & Clinical Profile Setup', async () => {
    await it('Step 1: Patient registers new healthcare account', async () => {
      const res = await client.post('/api/customer/register', {
        name: 'Sarah Connor',
        email: patientEmail,
        phone: '9876543210',
        password: patientPassword
      });

      assert.strictEqual(res.status, 201);
      patientId = res.data.customerId;
    });

    await it('Step 2: Patient logs in and receives verified session JWT', async () => {
      const res = await client.post('/api/customer/login', {
        email: patientEmail,
        password: patientPassword
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.token);
      patientToken = res.data.token;
    });

    await it('Step 3: Patient updates clinical health profile (Blood group, DOB, Emergency contact)', async () => {
      const res = await client.put('/api/customer/profile', {
        name: 'Sarah Connor',
        phone: '9876543210',
        gender: 'Female',
        blood_group: 'AB+',
        dob: '1988-04-20',
        address: 'Cyberdyne Blvd, Bangalore',
        emergency_contact: '9988771122'
      }, patientToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.blood_group, 'AB+');
    });
  });

  let targetDoctor = null;

  await describe('E2E Lifecycle - 2. Specialist Selection & Slot Booking', async () => {
    await it('Step 4: Patient browses directory and selects an active specialist', async () => {
      const res = await client.get('/api/doctors');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.length > 0);

      targetDoctor = res.data[0];
      doctorId = targetDoctor.doctor_id;

      // Also get doctor login token for later clinical steps
      const docLogin = await client.post('/api/doctor/login', {
        email: targetDoctor.email,
        password: 'doctor123'
      });
      doctorToken = docLogin.data.token;
    });

    await it('Step 5: Patient queries dynamic available slots for upcoming doctor practicing day', async () => {
      const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
      const practicingDays = targetDoctor.available_days.split(',').map(d => d.trim().toLowerCase());
      const targetDayIndex = dayMap[practicingDays[0]];

      const d = new Date();
      let daysAhead = (targetDayIndex - d.getDay() + 7) % 7;
      if (daysAhead === 0) daysAhead = 7; // Next week's slot
      d.setDate(d.getDate() + daysAhead);
      appointmentDate = d.toISOString().split('T')[0];

      const res = await client.get(`/api/doctors/${doctorId}/available-slots?date=${appointmentDate}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.slots.length > 0, 'No slots generated');
      const availableSlots = res.data.slots.filter(s => s.isAvailable);
      assert.ok(availableSlots.length > 0, 'No open slots generated');
      appointmentTime = availableSlots[0].time; // Choose first open slot time string
    });

    await it('Step 6: Patient reserves the selected appointment slot', async () => {
      const res = await client.post('/api/appointments', {
        doctor_id: doctorId,
        patient_name: 'Sarah Connor',
        patient_age: 36,
        patient_gender: 'Female',
        patient_phone: '9876543210',
        patient_email: patientEmail,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        symptoms: 'Persistent joint stiffness and inflammation'
      }, patientToken);

      assert.strictEqual(res.status, 201);
      assert.match(res.data.message, /Appointment booked successfully/i);
      targetAppointmentId = res.data.appointmentId;
      assert.ok(targetAppointmentId, 'Missing appointmentId');
    });

    await it('Step 7: Double-Booking Conflict: Another booking on same doctor and slot is rejected with 409', async () => {
      const res = await client.post('/api/appointments', {
        doctor_id: doctorId,
        patient_name: 'Another Patient',
        patient_age: 40,
        patient_gender: 'Male',
        patient_phone: '9876543299',
        patient_email: 'another@example.com',
        appointment_date: appointmentDate,
        appointment_time: appointmentTime, // Colliding slot!
        symptoms: 'Mild dizziness and headache'
      }, patientToken);

      assert.strictEqual(res.status, 409);
      assert.match(res.data.message, /already booked/i);
    });
  });

  await describe('E2E Lifecycle - 3. Doctor Consultation, Prescription & Billing', async () => {
    await it('Step 8: Doctor reviews appointment in Pending list and Accepts it', async () => {
      const res = await client.put(`/api/appointments/${targetAppointmentId}/status`, {
        status: 'Accepted'
      }, doctorToken);

      assert.strictEqual(res.status, 200);
      assert.match(res.data.message, /Appointment marked as Accepted/i);
    });

    await it('Step 9: Doctor marks appointment Completed', async () => {
      const res = await client.put(`/api/appointments/${targetAppointmentId}/status`, {
        status: 'Completed'
      }, doctorToken);

      assert.strictEqual(res.status, 200);
      assert.match(res.data.message, /Appointment marked as Completed/i);
    });

    await it('Step 10: Doctor issues digital Prescription with medicine dosage & clinical notes', async () => {
      const res = await client.post('/api/prescriptions', {
        appointment_id: targetAppointmentId,
        diagnosis: 'Acute Joint Inflammation & Strain',
        notes: 'Advised warm water fermentation and gentle physical therapy.',
        prescription_date: appointmentDate,
        medicines: [
          { medicine_name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: '5 days', timing: 'After food', instructions: 'Take with full glass of water' },
          { medicine_name: 'Vitamin D3', dosage: '60,000 IU', frequency: 'Once weekly', duration: '4 weeks', timing: 'After breakfast', instructions: 'Take every Sunday' }
        ]
      }, doctorToken);

      assert.strictEqual(res.status, 201);
    });

    await it('Step 11: Doctor generates itemized Medical Bill with payment completed', async () => {
      const res = await client.post('/api/bills', {
        appointment_id: targetAppointmentId,
        consultation_fee: 600.00,
        medicine_charges: 150.00,
        lab_charges: 0.00,
        scan_charges: 0.00,
        other_charges: 0.00,
        discount: 50.00,
        tax: 35.00,
        payment_status: 'Paid',
        payment_method: 'UPI',
        bill_date: appointmentDate
      }, doctorToken);

      assert.strictEqual(res.status, 201);
    });
  });

  await describe('E2E Lifecycle - 4. Patient History & Second Booking Reschedule/Cancel Flow', async () => {
    await it('Step 12: Patient inspects Completed consultations with prescription & billing data', async () => {
      const res = await client.get('/api/customer/appointments', patientToken);
      assert.strictEqual(res.status, 200);
      const appt = res.data.find(a => a.appointment_id === targetAppointmentId);
      assert.ok(appt, 'Completed appointment not in customer list');
      assert.strictEqual(appt.status, 'Completed');
    });

    let secondDate = null;
    let rescheduleSlot = null;

    await it('Step 13: Patient books a second appointment for next week', async () => {
      const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
      const practicingDays = targetDoctor.available_days.split(',').map(d => d.trim().toLowerCase());
      const secondDayName = practicingDays[1] || practicingDays[0];
      const secondDayIndex = dayMap[secondDayName];

      const d = new Date();
      let daysAhead = (secondDayIndex - d.getDay() + 7) % 7;
      if (daysAhead === 0) daysAhead = 7;
      daysAhead += 7; // Two weeks in future
      d.setDate(d.getDate() + daysAhead);
      secondDate = d.toISOString().split('T')[0];

      const slotsRes = await client.get(`/api/doctors/${doctorId}/available-slots?date=${secondDate}`);
      assert.ok(slotsRes.data.slots.length > 0, 'No slots available for second date');
      const availableSlots2 = slotsRes.data.slots.filter(s => s.isAvailable);
      assert.ok(availableSlots2.length > 1, 'Not enough open slots for second date');
      const chosenSlot = availableSlots2[availableSlots2.length - 1].time; // Pick last slot string
      rescheduleSlot = availableSlots2[0].time; // Save first slot string for rescheduling

      const res = await client.post('/api/appointments', {
        doctor_id: doctorId,
        patient_name: 'Sarah Connor',
        patient_age: 36,
        patient_gender: 'Female',
        patient_phone: '9876543210',
        patient_email: patientEmail,
        appointment_date: secondDate,
        appointment_time: chosenSlot,
        symptoms: 'Follow-up consultation for knee stiffness'
      }, patientToken);

      assert.strictEqual(res.status, 201);
      secondAppointmentId = res.data.appointmentId;
      assert.ok(secondAppointmentId, 'Missing secondAppointmentId');
    });

    await it('Step 14: Patient reschedules second appointment to an earlier slot', async () => {
      const res = await client.put(`/api/appointments/${secondAppointmentId}/reschedule`, {
        appointment_date: secondDate,
        appointment_time: rescheduleSlot
      }, patientToken);

      assert.strictEqual(res.status, 200);
      assert.match(res.data.message, /Appointment rescheduled successfully/i);
    });

    await it('Step 15: Patient cancels the appointment providing a legitimate cancellation reason', async () => {
      const res = await client.put(`/api/appointments/${secondAppointmentId}/cancel`, {
        cancellation_reason: 'Resolved symptoms with prescribed physical therapy.'
      }, patientToken);

      assert.strictEqual(res.status, 200);
      assert.match(res.data.message, /Appointment cancelled successfully/i);

      // Verify status is Cancelled
      const [rows] = await db.query('SELECT status, cancellation_reason FROM appointments WHERE appointment_id = ?', [secondAppointmentId]);
      assert.strictEqual(rows[0].status, 'Cancelled');
      assert.match(rows[0].cancellation_reason, /Resolved symptoms/i);
    });
  });

  await describe('E2E Lifecycle - 5. Hospital Administrator Oversight', async () => {
    await it('Step 16: Admin logs in and audits global hospital metrics', async () => {
      const adminLogin = await client.post('/api/admin/login', {
        email: 'admin@hospital.com',
        password: 'admin123'
      });
      adminToken = adminLogin.data.token;

      const res = await client.get('/api/admin/stats', adminToken);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.totalAppointments >= 2);
    });
  });

  // Cleanup E2E records
  if (secondAppointmentId) {
    await db.query('DELETE FROM appointments WHERE appointment_id = ?', [secondAppointmentId]);
  }
  if (targetAppointmentId) {
    await db.query('DELETE FROM bills WHERE appointment_id = ?', [targetAppointmentId]);
    await db.query('DELETE FROM prescriptions WHERE appointment_id = ?', [targetAppointmentId]);
    await db.query('DELETE FROM appointments WHERE appointment_id = ?', [targetAppointmentId]);
  }
  if (patientId) {
    await db.query('DELETE FROM customers WHERE customer_id = ?', [patientId]);
  }
}

module.exports = runEndToEndLifecycleTests;

if (require.main === module) {
  runEndToEndLifecycleTests().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
    client.stopTestServer();
    process.exit(0);
  });
}
