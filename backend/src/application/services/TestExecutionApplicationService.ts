import { ITestExecutionService } from '../../core/interfaces/services/ITestExecutionService';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { IProcessExecutor } from '../../core/interfaces/external/IProcessExecutor';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import {
  TestExecution,
  TestOutput,
  TestExecutionResult,
  ExecuteTestCommand,
  ExecuteAllTestsCommand,
  ResultsUpdatedEvent,
} from '../../core';
import { TestExecutionError } from '../../core';

export class K6TestExecutionService implements ITestExecutionService {
  private readonly runningProcesses = new Map<string, any>();
  private readonly k6TestsDir: string;
  private readonly resultsDir: string;

  constructor(
    private readonly processExecutor: IProcessExecutor,
    private readonly notificationService: INotificationService,
    private readonly config: IConfig,
    private readonly logger: ILogger,
    private readonly fileSystem: IFileSystem
  ) {
    this.k6TestsDir = this.config.getK6TestsDir();
    this.resultsDir = this.config.getResultsDir();
  }

  async executeTest(command: ExecuteTestCommand): Promise<TestExecution> {
    const testId = command.getTestId();
    const execution = new TestExecution(
      testId,
      command.testName,
      command.profile,
      command.environment,
      command.customToken
    );

    try {
      // Ensure results directory exists
      await this.ensureResultsDirectoryExists();

      // Generate timestamp and file paths
      const timestamp = this.generateTimestamp();
      const testFile = `tests/${command.testName}.js`;
      const resultFile = `results/${timestamp}_${command.testName}.json`;

      // Log the parameters being used
      this.logger.info('Executing test with parameters', {
        testId,
        testName: command.testName,
        profile: command.profile,
        environment: command.environment,
        hasCustomToken: !!command.customToken,
        testFile,
        resultFile,
      });

      // Send initial notifications
      await this.notifyStart(execution, resultFile);

      // Build k6 command with proper environment variables
      const k6Args = [
        'run',
        testFile,
        '-e',
        `PROFILE=${command.profile}`,
        '-e',
        `ENVIRONMENT=${command.environment}`,
        '-e',
        `CUSTOM_TOKEN=${command.customToken || ''}`,
        '-e',
        'LOG_LEVEL=error',
        '--summary-export',
        resultFile,
      ];

      this.logger.info('K6 command arguments', { args: k6Args });

      // Spawn K6 process
      const child = this.processExecutor.spawn('k6', k6Args, {
        cwd: this.k6TestsDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          NO_COLOR: 'false',
          K6_ENVIRONMENT: command.environment,
          K6_CUSTOM_TOKEN: command.customToken || '',
          PROFILE: command.profile,
          ENVIRONMENT: command.environment,
        },
      });

      // Store process
      this.runningProcesses.set(testId, child);
      this.logger.info('Test process started', { testId, pid: child.pid });

      // Setup process handlers
      this.setupProcessHandlers(child, execution, resultFile);

      return execution;
    } catch (error) {
      this.logger.error('Failed to start test execution', error as Error, {
        testId,
      });
      throw new TestExecutionError('Failed to start test process', error as Error);
    }
  }

  async executeAllTests(command: ExecuteAllTestsCommand): Promise<TestExecution> {
    const testId = command.getTestId();
    const execution = new TestExecution(
      testId,
      'all-tests',
      command.profile,
      command.environment,
      command.customToken
    );

    try {
      // Ensure results directory exists
      await this.ensureResultsDirectoryExists();

      // Send initial notifications
      await this.notifySequentialStart(execution);

      // Log the parameters being used
      this.logger.info('Executing all tests with parameters', {
        testId,
        profile: command.profile,
        environment: command.environment,
        hasCustomToken: !!command.customToken,
      });

      // Check if sequential-tests.sh exists, if not create a simple version
      const scriptPath = `${this.k6TestsDir}/sequential-tests.sh`;
      const scriptExists = await this.fileSystem.exists(scriptPath);

      if (!scriptExists) {
        await this.createSequentialTestsScript(scriptPath);
      }

      // Spawn sequential tests script
      const child = this.processExecutor.spawn('bash', [scriptPath, command.profile], {
        cwd: this.k6TestsDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          NO_COLOR: 'false',
          K6_ENVIRONMENT: command.environment,
          K6_CUSTOM_TOKEN: command.customToken || '',
          PROFILE: command.profile,
          ENVIRONMENT: command.environment,
        },
      });

      // Store process
      this.runningProcesses.set(testId, child);
      this.logger.info('Sequential tests process started', {
        testId,
        pid: child.pid,
      });

      // Setup process handlers
      this.setupSequentialProcessHandlers(child, execution);

      return execution;
    } catch (error) {
      this.logger.error('Failed to start sequential test execution', error as Error, { testId });
      throw new TestExecutionError('Failed to start sequential test process', error as Error);
    }
  }

  async stopTest(testId: string): Promise<boolean> {
    const process = this.runningProcesses.get(testId);
    if (!process) {
      this.logger.warn('Process not found for test', { testId });
      return false;
    }

    try {
      this.logger.info('Stopping test process', { testId, pid: process.pid });

      // Graceful termination
      const killed = this.processExecutor.kill(process, 'SIGTERM');

      if (killed) {
        // Force kill after timeout
        setTimeout(() => {
          if (!process.killed) {
            this.logger.warn('Force killing process', { testId });
            this.processExecutor.kill(process, 'SIGKILL');
          }
        }, 5000);

        this.runningProcesses.delete(testId);
        await this.notificationService.notifyTestStopped(testId);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error stopping test', error as Error, { testId });
      return false;
    }
  }

  getRunningTests(): string[] {
    return Array.from(this.runningProcesses.keys());
  }

  isTestRunning(testId: string): boolean {
    return this.runningProcesses.has(testId);
  }

  private async ensureResultsDirectoryExists(): Promise<void> {
    try {
      // Ensure both k6-tests/results and configured results directory exist
      const k6ResultsDir = `${this.k6TestsDir}/results`;
      const configuredResultsDir = this.resultsDir;

      // Create k6-tests/results directory
      const k6ResultsExists = await this.fileSystem.exists(k6ResultsDir);
      if (!k6ResultsExists) {
        await this.fileSystem.mkdir(k6ResultsDir, true);
        this.logger.info('Created k6 results directory', { path: k6ResultsDir });
      }

      // Create configured results directory if different
      if (configuredResultsDir !== k6ResultsDir) {
        const configuredResultsExists = await this.fileSystem.exists(configuredResultsDir);
        if (!configuredResultsExists) {
          await this.fileSystem.mkdir(configuredResultsDir, true);
          this.logger.info('Created configured results directory', { path: configuredResultsDir });
        }
      }
    } catch (error) {
      this.logger.error('Failed to create results directories', error as Error);
      throw new TestExecutionError('Failed to create results directories', error as Error);
    }
  }

  private async createSequentialTestsScript(scriptPath: string): Promise<void> {
    const scriptContent = `#!/bin/bash

# Sequential K6 Tests Runner
# Usage: ./sequential-tests.sh [PROFILE]

PROFILE=\${1:-LIGHT}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="results"

echo "🚀 Starting sequential tests with profile: \$PROFILE"
echo "📁 Results will be saved to: \$RESULTS_DIR"

# Ensure results directory exists
mkdir -p "\$RESULTS_DIR"

# Find all test files
TEST_FILES=(\$(find tests/ -name "*.js" -type f | sort))

if [ \${#TEST_FILES[@]} -eq 0 ]; then
    echo "❌ No test files found in tests/ directory"
    exit 1
fi

echo "📋 Found \${#TEST_FILES[@]} test files to execute"

# Execute each test
for TEST_FILE in "\${TEST_FILES[@]}"; do
    TEST_NAME=\$(basename "\$TEST_FILE" .js)
    RESULT_FILE="\$RESULTS_DIR/\${TIMESTAMP}_sequential_\${TEST_NAME}.json"
    
    echo ""
    echo "▶️  Running: \$TEST_NAME"
    
    k6 run "\$TEST_FILE" \\
        -e "PROFILE=\$PROFILE" \\
        -e "ENVIRONMENT=\$ENVIRONMENT" \\
        -e "CUSTOM_TOKEN=\$K6_CUSTOM_TOKEN" \\
        -e "LOG_LEVEL=error" \\
        --summary-export "\$RESULT_FILE"
    
    if [ \$? -eq 0 ]; then
        echo "✅ \$TEST_NAME completed successfully"
    else
        echo "❌ \$TEST_NAME failed"
    fi
done

echo ""
echo "🏁 Sequential tests completed"
`;

    try {
      await this.fileSystem.writeFile(scriptPath, scriptContent);
      this.logger.info('Created sequential tests script', { path: scriptPath });
    } catch (error) {
      this.logger.error('Failed to create sequential tests script', error as Error);
      throw new TestExecutionError('Failed to create sequential tests script', error as Error);
    }
  }

  private setupProcessHandlers(process: any, execution: TestExecution, resultFile: string): void {
    process.stdout?.on('data', (data: Buffer) => {
      const lines = this.processK6Output(data.toString());
      lines.forEach(async (line) => {
        if (line) {
          await this.notificationService.notifyTestOutput(execution.testId, TestOutput.log(line));
        }
      });
    });

    process.stderr?.on('data', (data: Buffer) => {
      const lines = this.processK6Output(data.toString());
      lines.forEach(async (line) => {
        if (line) {
          await this.notificationService.notifyTestOutput(execution.testId, TestOutput.error(line));
        }
      });
    });

    process.on('close', async (code: number, signal: string) => {
      this.runningProcesses.delete(execution.testId);

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        execution.stop();
        await this.notificationService.notifyTestStopped(execution.testId);
      } else if (code === 0) {
        const result = TestExecutionResult.success();
        execution.complete(result);
        await this.notificationService.notifyTestComplete(execution.testId, result);

        // Notify results updated
        setTimeout(async () => {
          await this.notificationService.notifyResultsUpdated(
            new ResultsUpdatedEvent(
              'New test results available',
              execution.testName,
              resultFile,
              this.generateTimestamp()
            )
          );
        }, 2000);
      } else {
        const result = TestExecutionResult.failure(code);
        execution.complete(result);
        await this.notificationService.notifyTestComplete(execution.testId, result);
      }
    });

    process.on('error', async (error: Error) => {
      this.logger.error('Test process error', error, {
        testId: execution.testId,
      });
      this.runningProcesses.delete(execution.testId);

      const result = TestExecutionResult.failure(-1, error);
      execution.complete(result);
      await this.notificationService.notifyTestComplete(execution.testId, result);
    });
  }

  private setupSequentialProcessHandlers(process: any, execution: TestExecution): void {
    // Similar to setupProcessHandlers but for sequential tests
    process.stdout?.on('data', (data: Buffer) => {
      const lines = this.processK6Output(data.toString());
      lines.forEach(async (line) => {
        if (line) {
          await this.notificationService.notifyTestOutput(execution.testId, TestOutput.log(line));
        }
      });
    });

    process.stderr?.on('data', (data: Buffer) => {
      const lines = this.processK6Output(data.toString());
      lines.forEach(async (line) => {
        if (line) {
          await this.notificationService.notifyTestOutput(execution.testId, TestOutput.error(line));
        }
      });
    });

    process.on('close', async (code: number, signal: string) => {
      this.runningProcesses.delete(execution.testId);

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        execution.stop();
        await this.notificationService.notifyTestStopped(execution.testId);
      } else if (code === 0) {
        const result = TestExecutionResult.success();
        execution.complete(result);
        await this.notificationService.notifyTestComplete(execution.testId, result);

        setTimeout(async () => {
          await this.notificationService.notifyResultsUpdated(
            new ResultsUpdatedEvent(
              'New test results available from sequential run',
              'all',
              undefined,
              this.generateTimestamp()
            )
          );
        }, 3000);
      } else {
        const result = TestExecutionResult.failure(code);
        execution.complete(result);
        await this.notificationService.notifyTestComplete(execution.testId, result);
      }
    });
  }

  private async notifyStart(execution: TestExecution, resultFile: string): Promise<void> {
    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🚀 Starting test: ${execution.testName} with profile: ${execution.profile} (ID: ${execution.testId})`
      )
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🌐 Environment: ${execution.environment}${
          execution.customToken ? ' (Custom Token)' : ' (Default Token)'
        }`
      )
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(`⏰ Started at: ${this.generateReadableTimestamp()} (Poland time)`)
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(`📁 Results will be saved to: ${resultFile}`)
    );
  }

  private async notifySequentialStart(execution: TestExecution): Promise<void> {
    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🚀 Starting all tests sequentially with profile: ${execution.profile} (ID: ${execution.testId})`
      )
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🌐 Environment: ${execution.environment}${
          execution.customToken ? ' (Custom Token)' : ' (Default Token)'
        }`
      )
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(`⏰ Started at: ${this.generateReadableTimestamp()} (Poland time)`)
    );
  }

  private processK6Output(data: string): string[] {
    const lines = data.toString().split('\n');
    const processedLines: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Clean ANSI escape codes but preserve content
      const cleanLine = line.replace(/\x1b\[[0-9;]*[mGKH]/g, '');

      if (cleanLine.includes('default [') && cleanLine.includes('%') && cleanLine.includes('VUs')) {
        processedLines.push(cleanLine.trim());
      } else if (cleanLine.trim()) {
        processedLines.push(cleanLine.trim());
      }
    }

    return processedLines;
  }

  private generateTimestamp(): string {
    const now = new Date();

    const polandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));

    const year = polandTime.getFullYear();
    const month = String(polandTime.getMonth() + 1).padStart(2, '0');
    const day = String(polandTime.getDate()).padStart(2, '0');
    const hours = String(polandTime.getHours()).padStart(2, '0');
    const minutes = String(polandTime.getMinutes()).padStart(2, '0');
    const seconds = String(polandTime.getSeconds()).padStart(2, '0');

    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
    console.log(
      `Generated timestamp: ${timestamp} (Poland time: ${polandTime.toLocaleString('pl-PL')})`
    );

    return timestamp;
  }

  private generateReadableTimestamp(): string {
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
}
