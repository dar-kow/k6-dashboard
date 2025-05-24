import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugPaths() {
  console.log('=== DEBUG PATHS ===');
  console.log('Current working directory:', process.cwd());
  console.log('Script location (__dirname):', __dirname);
  console.log('Node environment:', process.env.NODE_ENV);
  
  // Paths to check
  const pathsToCheck = [
    // Current working directory variants
    './k6-tests',
    './k6-tests/tests',
    './k6-tests/results',
    
    // Relative to backend folder
    '../k6-tests',
    '../k6-tests/tests', 
    '../k6-tests/results',
    
    // Script directory variants (jak w starym kodzie)
    path.join(__dirname, '../k6-tests'),
    path.join(__dirname, '../k6-tests/tests'),
    path.join(__dirname, '../k6-tests/results'),
    
    // Project root variants
    path.join(__dirname, '../../k6-tests'),
    path.join(__dirname, '../../k6-tests/tests'),
    path.join(__dirname, '../../k6-tests/results'),
    
    // Docker paths
    '/k6-tests',
    '/k6-tests/tests',
    '/results'
  ];

  console.log('\nChecking paths:');
  for (const checkPath of pathsToCheck) {
    try {
      const resolvedPath = path.resolve(checkPath);
      const exists = await fs.access(checkPath).then(() => true).catch(() => false);
      const stats = exists ? await fs.stat(checkPath) : null;
      
      console.log(`${exists ? '✅' : '❌'} ${checkPath}`);
      console.log(`   Resolved: ${resolvedPath}`);
      if (exists && stats) {
        console.log(`   Type: ${stats.isDirectory() ? 'directory' : 'file'}`);
        if (stats.isDirectory()) {
          try {
            const contents = await fs.readdir(checkPath);
            console.log(`   Contents (${contents.length}): ${contents.slice(0, 5).join(', ')}${contents.length > 5 ? '...' : ''}`);
          } catch (e) {
            console.log(`   Contents: Error reading directory`);
          }
        }
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${checkPath} - Error: ${error.message}`);
    }
  }

  // Try to find any k6-tests folder
  console.log('\nSearching for k6-tests folders:');
  const searchRoots = [
    process.cwd(),
    path.dirname(process.cwd()),
    path.join(__dirname, '..'),
    path.join(__dirname, '../..')
  ];

  for (const root of searchRoots) {
    try {
      const entries = await fs.readdir(root);
      const k6Folders = entries.filter(entry => entry.includes('k6'));
      if (k6Folders.length > 0) {
        console.log(`Found in ${root}:`, k6Folders);
      }
    } catch (e) {
      console.log(`Cannot read ${root}`);
    }
  }
}

debugPaths().catch(console.error);