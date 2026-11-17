/**
 * ============================================================================
 * TEST RUNNER & SUITE REPORTER (test_runner.js)
 * ============================================================================
 * Provides describe(), it(), assertions, and colorful reporting
 * for Unit, Integration, Database, E2E, and Security test suites.
 */

const assert = require('node:assert');

const suiteResults = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: []
};

let currentSuite = null;

async function describe(suiteName, fn) {
  const suite = {
    name: suiteName,
    tests: [],
    passed: 0,
    failed: 0,
    durationMs: 0
  };
  currentSuite = suite;
  suiteResults.suites.push(suite);

  console.log(`\n\x1b[1m\x1b[36m▶ SUITE: ${suiteName}\x1b[0m`);
  const start = Date.now();
  try {
    await fn();
  } catch (err) {
    console.error(`  \x1b[31mSuite Execution Error: ${err.message}\x1b[0m`);
  }
  suite.durationMs = Date.now() - start;
}

async function it(testName, testFn) {
  suiteResults.total++;
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    suiteResults.passed++;
    if (currentSuite) currentSuite.passed++;
    console.log(`  \x1b[32m✔\x1b[0m ${testName} \x1b[90m(${duration}ms)\x1b[0m`);
  } catch (err) {
    const duration = Date.now() - start;
    suiteResults.failed++;
    if (currentSuite) currentSuite.failed++;
    console.log(`  \x1b[31m✖\x1b[0m ${testName} \x1b[90m(${duration}ms)\x1b[0m`);
    console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
    if (err.stack) {
      const relevantStack = err.stack.split('\n').slice(1, 3).join('\n');
      console.log(`    \x1b[90m${relevantStack}\x1b[0m`);
    }
  }
}

function printSummary() {
  console.log('\n============================================================');
  console.log('\x1b[1mTEST EXECUTION SUMMARY\x1b[0m');
  console.log('============================================================');
  console.log(`Total Test Cases : ${suiteResults.total}`);
  console.log(`\x1b[32mPassed           : ${suiteResults.passed}\x1b[0m`);
  if (suiteResults.failed > 0) {
    console.log(`\x1b[31mFailed           : ${suiteResults.failed}\x1b[0m`);
  } else {
    console.log(`\x1b[32mFailed           : 0\x1b[0m`);
  }
  console.log('============================================================');

  if (suiteResults.failed > 0) {
    console.log('\x1b[1m\x1b[31m❌ TEST RUN FAILED\x1b[0m\n');
    return false;
  } else {
    console.log('\x1b[1m\x1b[32m✅ ALL TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
    return true;
  }
}

function getResults() {
  return suiteResults;
}

function resetResults() {
  suiteResults.total = 0;
  suiteResults.passed = 0;
  suiteResults.failed = 0;
  suiteResults.suites = [];
}

module.exports = {
  describe,
  it,
  assert,
  printSummary,
  getResults,
  resetResults
};
