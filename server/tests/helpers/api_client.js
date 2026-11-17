/**
 * ============================================================================
 * TEST HTTP CLIENT HELPER (api_client.js)
 * ============================================================================
 * Spins up Express application on an ephemeral port (0) and provides
 * clean methods (get, post, put, delete) for integration & E2E tests.
 */

const http = require('http');
const app = require('../../server');

let serverInstance = null;
let baseUrl = '';
let startingPromise = null;

/**
 * Start the test server instance
 */
async function startTestServer() {
  if (serverInstance && baseUrl) return baseUrl;
  if (startingPromise) return startingPromise;

  startingPromise = new Promise((resolve) => {
    serverInstance = http.createServer(app);
    serverInstance.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      startingPromise = null;
      resolve(baseUrl);
    });
  });

  return startingPromise;
}

/**
 * Stop the test server instance
 */
async function stopTestServer() {
  if (!serverInstance) return;
  return new Promise((resolve) => {
    serverInstance.close(() => {
      serverInstance = null;
      baseUrl = '';
      resolve();
    });
  });
}

/**
 * Make an HTTP request against the test server
 */
async function request(method, path, body = null, token = null) {
  if (!baseUrl) {
    await startTestServer();
  }

  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method: method.toUpperCase(),
    headers
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    data
  };
}

module.exports = {
  startTestServer,
  stopTestServer,
  get: (path, token) => request('GET', path, null, token),
  post: (path, body, token) => request('POST', path, body, token),
  put: (path, body, token) => request('PUT', path, body, token),
  delete: (path, token) => request('DELETE', path, null, token)
};
