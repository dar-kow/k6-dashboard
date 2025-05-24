import express from 'express';
import { runTest, runAllTests, stopTest, getRunningTests } from '../services/runnerService.js';

const router = express.Router();

router.post('/test', async (req, res) => {
  try {
    const { test, profile, environment, customToken, testId } = req.body;

    if (!test) {
      return res.status(400).json({ error: 'Test name is required' });
    }

    await runTest(test, profile || 'LIGHT', environment || 'PROD', customToken || '', testId);

    res.json({
      message: 'Test started successfully',
      testId: testId || `${test}-${Date.now()}`,
      config: {
        test,
        profile: profile || 'LIGHT',
        environment: environment || 'PROD',
        hasCustomToken: !!(customToken && customToken.trim()),
      },
    });
  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({ error: 'Failed to start test' });
  }
});

router.post('/all', async (req, res) => {
  try {
    const { profile, environment, customToken, testId } = req.body;

    await runAllTests(profile || 'LIGHT', environment || 'PROD', customToken || '', testId);

    res.json({
      message: 'All tests started successfully',
      testId: testId || `all-tests-${Date.now()}`,
      config: {
        profile: profile || 'LIGHT',
        environment: environment || 'PROD',
        hasCustomToken: !!(customToken && customToken.trim()),
      },
    });
  } catch (error) {
    console.error('Error starting all tests:', error);
    res.status(500).json({ error: 'Failed to start all tests' });
  }
});

router.post('/stop', async (req, res) => {
  try {
    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({ error: 'Test ID is required' });
    }

    const stopped = await stopTest(testId);

    if (stopped) {
      res.json({
        message: 'Test stopped successfully',
        testId: testId,
      });
    } else {
      res.status(404).json({
        error: 'Test not found or already completed',
        testId: testId,
      });
    }
  } catch (error) {
    console.error('Error stopping test:', error);
    res.status(500).json({ error: 'Failed to stop test' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const runningTests = getRunningTests();

    res.json({
      runningTests: runningTests,
      count: runningTests.length,
    });
  } catch (error) {
    console.error('Error getting test status:', error);
    res.status(500).json({ error: 'Failed to get test status' });
  }
});

export default router;
