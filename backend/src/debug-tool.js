// Usage: node debug-tool.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multiple potential paths for results
const RESULT_PATHS = [
  path.join(__dirname, '../../results'), // Project root /results
  path.join(__dirname, '../../k6-tests/results'), // /k6-tests/results
  '/results' // Docker volume mount point
];

async function debugDirectory(dirPath) {
  console.log(`\nChecking directory: ${dirPath}`);
  try {
    const stats = await fs.stat(dirPath);
    console.log(`✅ Directory exists: ${dirPath}`);
    console.log(`   Is directory: ${stats.isDirectory()}`);
    console.log(`   Permissions: ${stats.mode.toString(8)}`);

    // Check files in the directory
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    console.log(`   Contains ${files.length} items:`);
    
    for (const item of files) {
      console.log(`     - ${item.name} (${item.isDirectory() ? 'directory' : 'file'})`);
      
      // If it's a directory and starts with 'sequential_' or 'parallel_', list its contents too
      if (item.isDirectory() && (item.name.startsWith('sequential_') || item.name.startsWith('parallel_'))) {
        const subDirPath = path.join(dirPath, item.name);
        const subFiles = await fs.readdir(subDirPath);
        console.log(`       Contains ${subFiles.length} items:`);
        for (const subFile of subFiles.slice(0, 5)) { // Show only first 5 for brevity
          console.log(`         - ${subFile}`);
        }
        if (subFiles.length > 5) {
          console.log(`         ... and ${subFiles.length - 5} more items`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error accessing directory: ${error.message}`);
  }
}

async function main() {
  console.log('======= K6 DASHBOARD DEBUG TOOL =======');
  console.log('Current directory:', process.cwd());
  console.log('Script directory:', __dirname);
  
  console.log('\nChecking all possible result paths:');
  for (const dirPath of RESULT_PATHS) {
    await debugDirectory(dirPath);
  }
  
  console.log('\nChecking permissions:');
  try {
    const tempFile = path.join(RESULT_PATHS[0], 'test_write_access.txt');
    await fs.writeFile(tempFile, 'Testing write access');
    console.log(`✅ Successfully wrote to ${tempFile}`);
    await fs.unlink(tempFile);
    console.log(`✅ Successfully deleted ${tempFile}`);
  } catch (error) {
    console.log(`❌ Write test failed: ${error.message}`);
  }
  
  console.log('\nEnvironment variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  
  console.log('\n======= DEBUG COMPLETE =======');
}

main().catch(error => console.error('Debug tool failed:', error));