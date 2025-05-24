import express from 'express';
import { getAvailableTests } from '../services/testsService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tests = await getAvailableTests();
    res.json(tests);
  } catch (error) {
    console.error('Error getting available tests:', error);
    res.status(500).json({ error: 'Failed to get available tests' });
  }
});

export default router;
