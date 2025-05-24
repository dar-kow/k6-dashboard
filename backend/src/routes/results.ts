import express from 'express';
import { getResultDirectories, getResultFiles, getTestResult } from '../services/resultsService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const directories = await getResultDirectories();
    res.json(directories);
  } catch (error) {
    console.error('Error getting result directories:', error);
    res.status(500).json({ error: 'Failed to get result directories' });
  }
});

router.get('/:directory', async (req, res) => {
  try {
    const { directory } = req.params;
    const files = await getResultFiles(directory);
    res.json(files);
  } catch (error) {
    console.error(`Error getting result files for directory ${req.params.directory}:`, error);
    res.status(500).json({
      error: `Failed to get result files for directory ${req.params.directory}`,
    });
  }
});

router.get('/:directory/:file', async (req, res) => {
  try {
    const { directory, file } = req.params;
    const result = await getTestResult(directory, file);
    res.json(result);
  } catch (error) {
    console.error(`Error getting test result for ${req.params.file}:`, error);
    res.status(500).json({ error: `Failed to get test result for ${req.params.file}` });
  }
});

export default router;
