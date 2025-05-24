import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIO } from '../../old-implementation/websocket/socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const K6_TESTS_DIR = path.join(__dirname, '../../../k6-tests');

const runningProcesses = new Map<string, ChildProcess>();

function generateTimestamp(): string {
  const now = new Date();
  const polandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
  const year = polandTime.getFullYear();
  const month = String(polandTime.getMonth() + 1).padStart(2, '0');
  const day = String(polandTime.getDate()).padStart(2, '0');
  const hours = String(polandTime.getHours()).padStart(2, '0');
  const minutes = String(polandTime.getMinutes()).padStart(2, '0');
  const seconds = String(polandTime.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function generateReadableTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function processK6Output(data: string): string[] {
  const lines = data.toString().split('\n');
  const processedLines: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cleanLine = line.replace(/\x1b\[[0-9;]*[mGKH]/g, '');
    if (cleanLine.includes('default [') && cleanLine.includes('%') && cleanLine.includes('VUs')) {
      processedLines.push(cleanLine.trim());
    } else if (cleanLine.trim()) {
      processedLines.push(cleanLine.trim());
    }
  }
  return processedLines;
}

export const stopTest = async (testId: string): Promise<boolean> => {
  try {
    const process = runningProcesses.get(testId);
    if (!process) {
      console.log(`No running process found for testId: ${testId}`);
      return false;
    }
    const io = getIO();
    console.log(`Stopping test process for testId: ${testId}, PID: ${process.pid}`);
    process.kill('SIGTERM');
    setTimeout(() => {
      if (!process.killed) {
        console.log(`Force killing process for testId: ${testId}`);
        process.kill('SIGKILL');
      }
    }, 5000);
    runningProcesses.delete(testId);
    io.emit('testOutput', {
      type: 'stopped',
      data: `Test ${testId} has been stopped`,
    });
    return true;
  } catch (error) {
    console.error(`Error stopping test ${testId}:`, error);
    return false;
  }
};

export const getRunningTests = (): string[] => {
  return Array.from(runningProcesses.keys());
};

export const runTest = async (
  test: string,
  profile: string = 'LIGHT',
  environment: string = 'PROD',
  customToken: string = '',
  testId?: string
): Promise<void> => {
  try {
    const io = getIO();
    const actualTestId = testId || `${test}-${Date.now()}`;
    const timestamp = generateTimestamp();
    const testFile = `tests/${test}.js`;
    const resultFile = `results/${timestamp}_${test}.json`;

    io.emit('testOutput', {
      type: 'log',
      data: `🚀 Starting test: ${test} with profile: ${profile} (ID: ${actualTestId})`,
    });
    io.emit('testOutput', {
      type: 'log',
      data: `🌐 Environment: ${environment}${customToken ? ' (Custom Token)' : ' (Default Token)'}`,
    });
    io.emit('testOutput', {
      type: 'log',
      data: `⏰ Started at: ${generateReadableTimestamp()} (Poland time)`,
    });
    io.emit('testOutput', {
      type: 'log',
      data: `📁 Results will be saved to: ${resultFile}`,
    });

    const child = spawn(
      'k6',
      [
        'run',
        testFile,
        '-e',
        `PROFILE=${profile}`,
        '-e',
        `ENVIRONMENT=${environment}`,
        '-e',
        `CUSTOM_TOKEN=${customToken}`,
        '-e',
        'LOG_LEVEL=error',
        '--summary-export',
        resultFile,
      ],
      {
        cwd: K6_TESTS_DIR,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          NO_COLOR: 'false',
          K6_ENVIRONMENT: environment,
          K6_CUSTOM_TOKEN: customToken,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    runningProcesses.set(actualTestId, child);
    console.log(`Started test ${actualTestId} with PID: ${child.pid}`);

    child.stdout.on('data', (data) => {
      const processedLines = processK6Output(data);
      for (const line of processedLines) {
        if (line) {
          io.emit('testOutput', { type: 'log', data: line });
        }
      }
    });

    child.stderr.on('data', (data) => {
      const processedLines = processK6Output(data);
      for (const line of processedLines) {
        if (line) {
          io.emit('testOutput', { type: 'error', data: line });
        }
      }
    });

    child.on('close', (code, signal) => {
      runningProcesses.delete(actualTestId);
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        io.emit('testOutput', {
          type: 'stopped',
          data: `🛑 Test ${test} was stopped by user`,
        });
      } else if (code === 0) {
        io.emit('testOutput', {
          type: 'complete',
          data: `✅ Test ${test} completed successfully!`,
        });
        io.emit('testOutput', {
          type: 'log',
          data: `📊 Results saved to: ${resultFile}`,
        });
        setTimeout(() => {
          io.emit('testOutput', {
            type: 'log',
            data: '🔄 Refreshing test results dashboard...',
          });
          io.emit('resultsUpdated', {
            message: 'New test results available',
            testName: test,
            resultFile: resultFile,
            timestamp: timestamp,
          });
        }, 2000);
      } else {
        io.emit('testOutput', {
          type: 'error',
          data: `❌ Test ${test} failed with exit code ${code}`,
        });
      }
    });

    child.on('error', (error) => {
      console.error(`Error running test ${test}:`, error);
      runningProcesses.delete(actualTestId);
      io.emit('testOutput', {
        type: 'error',
        data: `❌ Error running test: ${error.message}`,
      });
    });

    child.on('spawn', () => {
      console.log(`Test ${actualTestId} spawned successfully`);
    });
  } catch (error) {
    console.error(`Error running test ${test}:`, error);
    throw error;
  }
};

export const runAllTests = async (
  profile: string = 'LIGHT',
  environment: string = 'PROD',
  customToken: string = '',
  testId?: string
): Promise<void> => {
  try {
    const io = getIO();
    const actualTestId = testId || `all-tests-${Date.now()}`;
    const script = path.join(K6_TESTS_DIR, 'sequential-tests.sh');
    const args = [profile];

    io.emit('testOutput', {
      type: 'log',
      data: `🚀 Starting all tests sequentially with profile: ${profile} (ID: ${actualTestId})`,
    });
    io.emit('testOutput', {
      type: 'log',
      data: `🌐 Environment: ${environment}${customToken ? ' (Custom Token)' : ' (Default Token)'}`,
    });
    io.emit('testOutput', {
      type: 'log',
      data: `⏰ Started at: ${generateReadableTimestamp()} (Poland time)`,
    });

    const child = spawn('bash', [script, ...args], {
      cwd: K6_TESTS_DIR,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        NO_COLOR: 'false',
        K6_ENVIRONMENT: environment,
        K6_CUSTOM_TOKEN: customToken,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    runningProcesses.set(actualTestId, child);
    console.log(`Started all tests ${actualTestId} with PID: ${child.pid}`);

    child.stdout.on('data', (data) => {
      const processedLines = processK6Output(data);
      for (const line of processedLines) {
        if (line) {
          io.emit('testOutput', { type: 'log', data: line });
        }
      }
    });

    child.stderr.on('data', (data) => {
      const processedLines = processK6Output(data);
      for (const line of processedLines) {
        if (line) {
          io.emit('testOutput', { type: 'error', data: line });
        }
      }
    });

    child.on('close', (code, signal) => {
      runningProcesses.delete(actualTestId);
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        io.emit('testOutput', {
          type: 'stopped',
          data: `🛑 All tests were stopped by user`,
        });
      } else if (code === 0) {
        io.emit('testOutput', {
          type: 'complete',
          data: '✅ All tests completed successfully!',
        });
        setTimeout(() => {
          io.emit('testOutput', {
            type: 'log',
            data: '🔄 Refreshing test results dashboard...',
          });
          io.emit('resultsUpdated', {
            message: 'New test results available from sequential run',
            testName: 'all',
            timestamp: generateTimestamp(),
          });
        }, 3000);
      } else {
        io.emit('testOutput', {
          type: 'error',
          data: `❌ Tests failed with exit code ${code}`,
        });
      }
    });

    child.on('error', (error) => {
      console.error('Error running all tests:', error);
      runningProcesses.delete(actualTestId);
      io.emit('testOutput', {
        type: 'error',
        data: `❌ Error running tests: ${error.message}`,
      });
    });
  } catch (error) {
    console.error('Error running all tests:', error);
    throw error;
  }
};
