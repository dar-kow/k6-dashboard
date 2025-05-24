import { beforeAll, afterAll } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Setup before all tests
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.PORT = '0'; // Use random port for tests
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.K6_TESTS_DIR = './test-data/k6-tests';
  process.env.RESULTS_DIR = './test-data/results';
});

afterAll(async () => {
  // Cleanup after all tests
  // Close any open handles, clean up resources, etc.
});
