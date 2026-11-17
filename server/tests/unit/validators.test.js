/**
 * ============================================================================
 * UNIT TEST SUITE: BACKEND REQUEST VALIDATORS (validators.test.js)
 * ============================================================================
 * Tests pure validator middleware functions against edge cases, boundary values,
 * format sanitization, and security regex patterns without database dependency.
 */

const { describe, it, assert } = require('../helpers/test_runner');
const validators = require('../../middleware/validators');

function createMockReqRes(body = {}) {
  const req = { body };
  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData, isNextCalled: () => nextCalled };
}

async function runValidatorsUnitTest() {
  await describe('Unit Testing - Customer Registration Validator', async () => {
    await it('should pass when all patient registration fields are valid and strong', () => {
      const mock = createMockReqRes({
        name: 'Ashwin Kumar',
        email: 'ashwin.kumar@example.com',
        phone: '9876543210',
        password: 'Password@123'
      });

      validators.validateCustomerRegister(mock.req, mock.res, () => mock.isNextCalled());
      assert.strictEqual(mock.getStatus(), 200);
    });

    await it('should reject registration when name is missing or empty', () => {
      const mock = createMockReqRes({
        name: '   ',
        email: 'test@example.com',
        phone: '9876543210',
        password: 'Password@123'
      });

      validators.validateCustomerRegister(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /Full name is required/i);
    });

    await it('should reject registration when name contains numeric digits or symbols', () => {
      const mock = createMockReqRes({
        name: 'User123',
        email: 'test@example.com',
        phone: '9876543210',
        password: 'Password@123'
      });

      validators.validateCustomerRegister(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /letters and standard punctuation/i);
    });

    await it('should reject registration when email format is invalid', () => {
      const mock = createMockReqRes({
        name: 'Ashwin Kumar',
        email: 'invalid-email-format',
        phone: '9876543210',
        password: 'Password@123'
      });

      validators.validateCustomerRegister(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /valid email address/i);
    });

    await it('should reject registration when mobile number is not 10 digits', () => {
      const mock = createMockReqRes({
        name: 'Ashwin Kumar',
        email: 'ashwin@example.com',
        phone: '12345',
        password: 'Password@123'
      });

      validators.validateCustomerRegister(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /10-digit mobile phone number/i);
    });

    await it('should reject registration when password lacks special characters or numbers', () => {
      const mock = createMockReqRes({
        name: 'Ashwin Kumar',
        email: 'ashwin@example.com',
        phone: '9876543210',
        password: 'onlylettersnopunct'
      });

      validators.validateCustomerRegister(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /uppercase, lowercase, numeric digit/i);
    });
  });

  await describe('Unit Testing - Appointment Booking Validator', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const validFutureDateStr = futureDate.toISOString().split('T')[0];

    await it('should pass with fully qualified valid booking payload', () => {
      const mock = createMockReqRes({
        doctor_id: 1,
        patient_name: 'John Doe',
        patient_age: 34,
        patient_gender: 'Male',
        patient_phone: '9876543210',
        patient_email: 'john@example.com',
        appointment_date: validFutureDateStr,
        appointment_time: '10:00 AM',
        symptoms: 'Experiencing recurrent migraine and visual aura for 3 days'
      });

      let nextCalled = false;
      validators.validateBooking(mock.req, mock.res, () => { nextCalled = true; });
      assert.strictEqual(mock.getStatus(), 200);
      assert.strictEqual(nextCalled, true);
    });

    await it('should reject booking when doctor_id is missing', () => {
      const mock = createMockReqRes({
        patient_name: 'John Doe',
        patient_age: 34,
        patient_gender: 'Male',
        patient_phone: '9876543210',
        patient_email: 'john@example.com',
        appointment_date: validFutureDateStr,
        appointment_time: '10:00 AM',
        symptoms: 'Mild fever and body pain'
      });

      validators.validateBooking(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /Doctor ID is required/i);
    });

    await it('should reject booking when patient age is invalid or outside 1-120 range', () => {
      const mock = createMockReqRes({
        doctor_id: 1,
        patient_name: 'John Doe',
        patient_age: 150, // Outside human clinical boundary
        patient_gender: 'Male',
        patient_phone: '9876543210',
        patient_email: 'john@example.com',
        appointment_date: validFutureDateStr,
        appointment_time: '10:00 AM',
        symptoms: 'Mild fever and body pain'
      });

      validators.validateBooking(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /between 1 and 120/i);
    });

    await it('should reject booking when appointment date is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const mock = createMockReqRes({
        doctor_id: 1,
        patient_name: 'John Doe',
        patient_age: 30,
        patient_gender: 'Male',
        patient_phone: '9876543210',
        patient_email: 'john@example.com',
        appointment_date: pastDateStr,
        appointment_time: '10:00 AM',
        symptoms: 'Routine checkup consultation'
      });

      validators.validateBooking(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /cannot be in the past/i);
    });

    await it('should reject booking when symptoms description is less than 10 characters', () => {
      const mock = createMockReqRes({
        doctor_id: 1,
        patient_name: 'John Doe',
        patient_age: 30,
        patient_gender: 'Male',
        patient_phone: '9876543210',
        patient_email: 'john@example.com',
        appointment_date: validFutureDateStr,
        appointment_time: '10:00 AM',
        symptoms: 'fever' // only 5 characters
      });

      validators.validateBooking(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /at least 10 characters/i);
    });
  });

  await describe('Unit Testing - Medical Billing Validator', async () => {
    await it('should pass with balanced invoice calculations', () => {
      const mock = createMockReqRes({
        appointment_id: 10,
        consultation_fee: 600,
        medicine_charges: 250,
        lab_charges: 150,
        scan_charges: 0,
        other_charges: 0,
        discount: 50,
        tax: 45,
        payment_status: 'Paid',
        payment_method: 'Credit Card',
        bill_date: '2026-11-16'
      });

      let nextCalled = false;
      validators.validateBill(mock.req, mock.res, () => { nextCalled = true; });
      assert.strictEqual(mock.getStatus(), 200);
      assert.strictEqual(nextCalled, true);
    });

    await it('should reject billing when consultation fee is <= 0 or missing', () => {
      const mock = createMockReqRes({
        appointment_id: 10,
        consultation_fee: 0,
        bill_date: '2026-11-16'
      });

      validators.validateBill(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /fee must be greater than 0/i);
    });

    await it('should reject billing when discount exceeds total subtotal charges', () => {
      const mock = createMockReqRes({
        appointment_id: 10,
        consultation_fee: 500,
        medicine_charges: 100,
        discount: 900, // Exceeds 600 subtotal
        bill_date: '2026-11-16'
      });

      validators.validateBill(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /Discount cannot exceed the subtotal/i);
    });

    await it('should reject billing when payment_status is Paid but payment_method is None or empty', () => {
      const mock = createMockReqRes({
        appointment_id: 10,
        consultation_fee: 500,
        payment_status: 'Paid',
        payment_method: 'None',
        bill_date: '2026-11-16'
      });

      validators.validateBill(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 400);
      assert.match(mock.getData().message, /Payment method is required/i);
    });
  });
}

module.exports = runValidatorsUnitTest;

if (require.main === module) {
  runValidatorsUnitTest().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
  });
}
