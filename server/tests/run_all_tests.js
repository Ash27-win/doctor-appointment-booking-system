/**
 * ============================================================================
 * UNIFIED MASTER TEST RUNNER (run_all_tests.js)
 * ============================================================================
 * Orchestrates Unit Tests, Database Integrity Tests, Integration API Tests,
 * Security Tests, and End-to-End System Scenarios with full reporting.
 */

process.env.NODE_ENV = 'test';

const { printSummary, resetResults } = require('./helpers/test_runner');
const client = require('./helpers/api_client');
const db = require('../config/db');

// Import all test suites
const runValidatorsUnitTest = require('./unit/validators.test');
const runAuthMiddlewareUnitTest = require('./unit/auth_middleware.test');
const runSlotGeneratorUnitTest = require('./unit/slot_generator.test');
const runDatabaseIntegrityTests = require('./database/schema_constraints.test');
const runAuthApiIntegrationTests = require('./integration/auth_api.test');
const runCustomerProfileApiTests = require('./integration/customer_profile_api.test');
const runDoctorAdminApiTests = require('./integration/doctor_admin_api.test');
const runSecurityBoundaryTests = require('./security/security_boundary.test');
const runEndToEndLifecycleTests = require('./e2e/patient_full_lifecycle.test');

async function runMasterTestSuite() {
  console.log('\x1b[1m\x1b[35m============================================================\x1b[0m');
  console.log('\x1b[1m\x1b[35m   CARESYNC HEALTHCARE APPOINTMENT SUITE - TEST HARNESS    \x1b[0m');
  console.log('\x1b[1m\x1b[35m============================================================\x1b[0m');
  console.log(`Starting test execution at: ${new Date().toISOString()}`);

  resetResults();
  const startTime = Date.now();

  try {
    // 1. UNIT TESTING (Validators, Middlewares, Slot Math)
    console.log('\n\x1b[1m\x1b[33m>>> SECTION 1: UNIT TESTING\x1b[0m');
    await runValidatorsUnitTest();
    await runAuthMiddlewareUnitTest();
    await runSlotGeneratorUnitTest();

    // 2. DATABASE INTEGRITY TESTING (Pool, Constraints, Conflict Prevention)
    console.log('\n\x1b[1m\x1b[33m>>> SECTION 2: DATABASE & SCHEMA INTEGRITY TESTING\x1b[0m');
    await runDatabaseIntegrityTests();

    // 3. INTEGRATION API TESTING (Auth, Profiles, Repeated Edits, Admin)
    console.log('\n\x1b[1m\x1b[33m>>> SECTION 3: INTEGRATION API TESTING\x1b[0m');
    await runAuthApiIntegrationTests();
    await runCustomerProfileApiTests();
    await runDoctorAdminApiTests();

    // 4. SECURITY & BOUNDARY TESTING (Perimeter, IDOR, SQL Injection)
    console.log('\n\x1b[1m\x1b[33m>>> SECTION 4: SECURITY & PERIMETER BOUNDARY TESTING\x1b[0m');
    await runSecurityBoundaryTests();

    // 5. END-TO-END (E2E) SYSTEM LIFECYCLE (Complete Patient-Doctor-Admin Flow)
    console.log('\n\x1b[1m\x1b[33m>>> SECTION 5: END-TO-END (E2E) SYSTEM SCENARIO TESTING\x1b[0m');
    await runEndToEndLifecycleTests();

  } catch (err) {
    console.error('\x1b[31mCritical Test Harness Error:\x1b[0m', err);
  } finally {
    // Clean shutdown of test server and database connection pool
    await client.stopTestServer();
    try {
      await db.end();
    } catch (e) {
      // Ignore if pool already closed
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nAll suites completed in ${totalDuration}s`);

  const passed = printSummary();
  process.exit(passed ? 0 : 1);
}

runMasterTestSuite();

