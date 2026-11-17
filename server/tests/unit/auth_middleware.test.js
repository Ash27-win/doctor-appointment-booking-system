/**
 * ============================================================================
 * UNIT TEST SUITE: JWT & RBAC ACCESS CONTROL (auth_middleware.test.js)
 * ============================================================================
 * Verifies JWT signing, token extraction, invalid/expired signatures,
 * and Role-Based Access Control (Customer, Doctor, Admin) guards.
 */

const jwt = require('jsonwebtoken');
const { describe, it, assert } = require('../helpers/test_runner');
const { verifyToken, isCustomer, isDoctor, isAdmin } = require('../../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#';

function createAuthReqRes(authHeader = null, user = null) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
    user
  };

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

async function runAuthMiddlewareUnitTest() {
  await describe('Unit Testing - JWT Token Verification', async () => {
    await it('should reject request when Authorization header is completely missing', () => {
      const mock = createAuthReqRes(null);
      verifyToken(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 401);
      assert.match(mock.getData().message, /No Authorization header provided/i);
    });

    await it('should reject request when Bearer token is missing after keyword', () => {
      const mock = createAuthReqRes('Bearer ');
      verifyToken(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 401);
      assert.match(mock.getData().message, /Bearer token is missing/i);
    });

    await it('should reject request when token signature is tempered or signed by another secret', () => {
      const fakeToken = jwt.sign({ id: 1, role: 'customer' }, 'wrong-secret-key');
      const mock = createAuthReqRes(`Bearer ${fakeToken}`);
      verifyToken(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 403);
      assert.match(mock.getData().message, /Invalid or expired session token/i);
    });

    await it('should successfully decode valid JWT and attach payload to req.user', () => {
      const payload = { id: 42, email: 'patient@hospital.com', role: 'customer' };
      const validToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      const mock = createAuthReqRes(`Bearer ${validToken}`);
      let nextCalled = false;
      verifyToken(mock.req, mock.res, () => { nextCalled = true; });

      assert.strictEqual(mock.getStatus(), 200);
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(mock.req.user.id, 42);
      assert.strictEqual(mock.req.user.email, 'patient@hospital.com');
      assert.strictEqual(mock.req.user.role, 'customer');
    });
  });

  await describe('Unit Testing - Role-Based Access Control (RBAC)', async () => {
    await it('isCustomer: should allow user with role "customer"', () => {
      const mock = createAuthReqRes(null, { id: 1, role: 'customer' });
      let nextCalled = false;
      isCustomer(mock.req, mock.res, () => { nextCalled = true; });
      assert.strictEqual(mock.getStatus(), 200);
      assert.strictEqual(nextCalled, true);
    });

    await it('isCustomer: should block doctor or admin from accessing patient-only route', () => {
      const mock = createAuthReqRes(null, { id: 5, role: 'doctor' });
      isCustomer(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 403);
      assert.match(mock.getData().message, /Patient\/Customer access required/i);
    });

    await it('isDoctor: should allow user with role "doctor"', () => {
      const mock = createAuthReqRes(null, { id: 2, role: 'doctor' });
      let nextCalled = false;
      isDoctor(mock.req, mock.res, () => { nextCalled = true; });
      assert.strictEqual(mock.getStatus(), 200);
      assert.strictEqual(nextCalled, true);
    });

    await it('isDoctor: should block customer from accessing clinician workspace', () => {
      const mock = createAuthReqRes(null, { id: 1, role: 'customer' });
      isDoctor(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 403);
      assert.match(mock.getData().message, /Clinician\/Doctor access required/i);
    });

    await it('isAdmin: should allow user with role "admin"', () => {
      const mock = createAuthReqRes(null, { id: 1, role: 'admin' });
      let nextCalled = false;
      isAdmin(mock.req, mock.res, () => { nextCalled = true; });
      assert.strictEqual(mock.getStatus(), 200);
      assert.strictEqual(nextCalled, true);
    });

    await it('isAdmin: should block customer or doctor from accessing administrative operations', () => {
      const mock = createAuthReqRes(null, { id: 2, role: 'customer' });
      isAdmin(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 403);
      assert.match(mock.getData().message, /Hospital Administrator access required/i);
    });
  });
}

module.exports = runAuthMiddlewareUnitTest;

if (require.main === module) {
  runAuthMiddlewareUnitTest().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
  });
}
