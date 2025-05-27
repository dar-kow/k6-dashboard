import { ITestExecutionService } from '../../core/interfaces/services/ITestExecutionService';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { IRepositoryService } from '../../core/interfaces/services/IRepositoryService';
import { IProcessExecutor } from '../../core/interfaces/external/IProcessExecutor';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
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
  private readonly errorThrottleMap = new Map<string, { count: number; lastSent: number }>();
  private readonly ERROR_THROTTLE_MS = 1000; // Send max 1 error per second per test
  private readonly MAX_ERROR_COUNT = 50; // Max 50 errors total per test

  constructor(
    private readonly processExecutor: IProcessExecutor,
    private readonly notificationService: INotificationService,
    private readonly repositoryService: IRepositoryService,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.k6TestsDir = this.config.getK6TestsDir();
  }

  async executeTest(command: ExecuteTestCommand): Promise<TestExecution> {
    const testId = command.getTestId();
    const execution = new TestExecution(
      testId,
      command.testName,
      command.profile,
      command.environment,
      command.repository,
      command.customToken,
      command.customEndpoint
    );

    try {
      const timestamp = this.generateTimestamp();
      const repoPath = `${this.k6TestsDir}/repos/${command.repository}`;
      const testFile = `tests/${command.testName}.js`;
      const resultFile = `results/${timestamp}_${command.testName}.json`;

      await this.repositoryService.ensureResultsDirectory(command.repository);
      await this.notifyStart(execution, resultFile, command.repository);

      const repoConfig = await this.repositoryService.getRepositoryConfig(command.repository);
      const envVars = this.buildEnvironmentVariables(command, repoConfig);

      const child = this.processExecutor.spawn(
        'k6',
        [
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
        ],
        {
          cwd: repoPath,
          env: envVars,
        }
      );

      this.runningProcesses.set(testId, child);
      this.logger.info('Test process started', {
        testId,
        pid: child.pid,
        repository: command.repository,
      });

      this.setupProcessHandlers(child, execution, resultFile, command.repository);

      return execution;
    } catch (error) {
      this.logger.error('Failed to start test execution', error as Error, {
        testId,
        repository: command.repository,
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
      command.repository,
      command.customToken,
      command.customEndpoint
    );

    try {
      await this.notifySequentialStart(execution, command.repository);

      const repoPath = `${this.k6TestsDir}/repos/${command.repository}`;
      const repoConfig = await this.repositoryService.getRepositoryConfig(command.repository);
      const envVars = this.buildEnvironmentVariables(command, repoConfig);

      const child = this.processExecutor.spawn('bash', ['run-all.sh', command.profile], {
        cwd: repoPath,
        env: envVars,
      });

      this.runningProcesses.set(testId, child);
      this.logger.info('Sequential tests process started', {
        testId,
        pid: child.pid,
        repository: command.repository,
      });

      this.setupSequentialProcessHandlers(child, execution, command.repository);

      return execution;
    } catch (error) {
      this.logger.error('Failed to start sequential test execution', error as Error, {
        testId,
        repository: command.repository,
      });
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

      const killed = this.processExecutor.kill(process, 'SIGTERM');

      if (killed) {
        setTimeout(() => {
          if (!process.killed) {
            this.logger.warn('Force killing process', { testId });
            this.processExecutor.kill(process, 'SIGKILL');
          }
        }, 5000);

        this.runningProcesses.delete(testId);
        this.errorThrottleMap.delete(testId); // Clean up throttle data
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

  private buildEnvironmentVariables(command: any, repoConfig: any): Record<string, string> {
    const baseEnv: Record<string, string> = {
      ...process.env,
      TERM: 'xterm-256color',
      NO_COLOR: 'false',
      K6_ENVIRONMENT: command.environment,
      K6_CUSTOM_TOKEN: command.customToken || '',
    };

    // Add repository config to environment
    if (repoConfig) {
      // Use custom endpoint if provided, otherwise use repository config
      if (command.customEndpoint) {
        baseEnv.K6_HOST = command.customEndpoint;
        baseEnv.K6_CUSTOM_HOST = 'true'; // Flag to indicate custom endpoint is used
      } else if (repoConfig.HOSTS && repoConfig.HOSTS[command.environment]) {
        baseEnv.K6_HOST = repoConfig.HOSTS[command.environment];
      }

      // Add tokens
      if (repoConfig.TOKENS && repoConfig.TOKENS[command.environment]) {
        if (!command.customToken) {
          baseEnv.K6_TOKEN = repoConfig.TOKENS[command.environment].USER || '';
        }
      }

      // Add load profiles
      if (repoConfig.LOAD_PROFILES && repoConfig.LOAD_PROFILES[command.profile]) {
        const profile = repoConfig.LOAD_PROFILES[command.profile];
        baseEnv.K6_VUS = profile.vus?.toString() || '10';
        baseEnv.K6_DURATION = profile.duration || '60s';
        baseEnv.K6_RAMP_UP = profile.rampUp || '10s';
      }
    } else if (command.customEndpoint) {
      // Even without repo config, we can still use custom endpoint
      baseEnv.K6_HOST = command.customEndpoint;
      baseEnv.K6_CUSTOM_HOST = 'true';
    }

    return baseEnv;
  }

  private shouldSendError(testId: string): boolean {
    const now = Date.now();
    const throttleData = this.errorThrottleMap.get(testId);

    if (!throttleData) {
      this.errorThrottleMap.set(testId, { count: 1, lastSent: now });
      return true;
    }

    // Don't send if we've hit the max error count
    if (throttleData.count >= this.MAX_ERROR_COUNT) {
      return false;
    }

    // Don't send if we're still in throttle period
    if (now - throttleData.lastSent < this.ERROR_THROTTLE_MS) {
      throttleData.count++;
      return false;
    }

    // Update throttle data and allow sending
    throttleData.count++;
    throttleData.lastSent = now;
    return true;
  }

  private setupProcessHandlers(
    process: any,
    execution: TestExecution,
    resultFile: string,
    repository: string
  ): void {
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

      // Only send error notifications if throttling allows
      if (this.shouldSendError(execution.testId)) {
        lines.forEach(async (line) => {
          if (line) {
            await this.notificationService.notifyTestOutput(
              execution.testId,
              TestOutput.error(line)
            );
          }
        });
      } else {
        // Still log errors but don't spam WebSocket
        this.logger.debug('Throttled error output', {
          testId: execution.testId,
          errorCount: this.errorThrottleMap.get(execution.testId)?.count,
        });
      }
    });

    process.on('close', async (code: number, signal: string) => {
      this.runningProcesses.delete(execution.testId);
      this.errorThrottleMap.delete(execution.testId); // Clean up throttle data

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
              'New test results available',
              execution.testName,
              resultFile,
              this.generateTimestamp(),
              repository
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
        repository,
      });
      this.runningProcesses.delete(execution.testId);
      this.errorThrottleMap.delete(execution.testId);

      const result = TestExecutionResult.failure(-1, error);
      execution.complete(result);
      await this.notificationService.notifyTestComplete(execution.testId, result);
    });
  }

  private setupSequentialProcessHandlers(
    process: any,
    execution: TestExecution,
    repository: string
  ): void {
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

      // Apply throttling for sequential tests too
      if (this.shouldSendError(execution.testId)) {
        lines.forEach(async (line) => {
          if (line) {
            await this.notificationService.notifyTestOutput(
              execution.testId,
              TestOutput.error(line)
            );
          }
        });
      }
    });

    process.on('close', async (code: number, signal: string) => {
      this.runningProcesses.delete(execution.testId);
      this.errorThrottleMap.delete(execution.testId);

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
              this.generateTimestamp(),
              repository
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

  private async notifyStart(
    execution: TestExecution,
    resultFile: string,
    repository: string
  ): Promise<void> {
    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🚀 Starting test: ${execution.testName} with profile: ${execution.profile} (ID: ${execution.testId})`
      )
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(`📦 Repository: ${repository}`)
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🌐 Environment: ${execution.environment}${
          execution.customToken ? ' (Custom Token)' : ' (Default Token)'
        }`
      )
    );

    // NEW: Show custom endpoint info
    if (execution.customEndpoint) {
      await this.notificationService.notifyTestOutput(
        execution.testId,
        TestOutput.log(`🔗 Custom Endpoint: ${execution.customEndpoint}`)
      );
    }

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(`⏰ Started at: ${this.generateReadableTimestamp()} (Poland time)`)
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(`📁 Results will be saved to: ${resultFile}`)
    );
  }

  private async notifySequentialStart(execution: TestExecution, repository: string): Promise<void> {
    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🚀 Starting all tests sequentially with profile: ${execution.profile} (ID: ${execution.testId})`
      )
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(`📦 Repository: ${repository}`)
    );

    await this.notificationService.notifyTestOutput(
      execution.testId,
      TestOutput.log(
        `🌐 Environment: ${execution.environment}${
          execution.customToken ? ' (Custom Token)' : ' (Default Token)'
        }`
      )
    );

    // NEW: Show custom endpoint info
    if (execution.customEndpoint) {
      await this.notificationService.notifyTestOutput(
        execution.testId,
        TestOutput.log(`🔗 Custom Endpoint: ${execution.customEndpoint}`)
      );
    }

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

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
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
