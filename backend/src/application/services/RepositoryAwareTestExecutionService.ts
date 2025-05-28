import { ITestExecutionService } from '../../core/interfaces/services/ITestExecutionService';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { IProcessExecutor } from '../../core/interfaces/external/IProcessExecutor';
import { IRepositoryRepository } from '../../core/interfaces/repositories/IRepositoryRepository';
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

export interface RepositoryTestCommand extends ExecuteTestCommand {
  repositoryId?: string;
  customHost?: string;
  customToken?: string;
}

export interface RepositoryAllTestsCommand extends ExecuteAllTestsCommand {
  repositoryId?: string;
  customHost?: string;
  customToken?: string;
}

export class RepositoryAwareTestExecutionService implements ITestExecutionService {
  private readonly runningProcesses = new Map<string, any>();
  private readonly k6TestsDir: string;

  constructor(
    private readonly processExecutor: IProcessExecutor,
    private readonly notificationService: INotificationService,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.k6TestsDir = this.config.getK6TestsDir();
  }

  async executeTest(command: ExecuteTestCommand | RepositoryTestCommand): Promise<TestExecution> {
    const repoCommand = command as RepositoryTestCommand;
    const testId = command.getTestId();
    const execution = new TestExecution(
      testId,
      command.testName,
      command.profile,
      command.environment,
      command.customToken
    );

    try {
      const timestamp = this.generateTimestamp();
      let testFile: string;
      let resultFile: string;
      let workingDir: string;
      let envConfig: any = {};

      if (repoCommand.repositoryId) {
        const repoPath = `${this.k6TestsDir}/repositories/${repoCommand.repositoryId}`;
        workingDir = `${repoPath}/tests`;
        testFile = `${command.testName}.js`;
        resultFile = `${repoPath}/results/${timestamp}_${command.testName}.json`;

        await this.ensureResultsDirectory(`${repoPath}/results`);

        envConfig = await this.getEnvironmentConfig(
          repoCommand.repositoryId,
          command.environment,
          command.profile,
          repoCommand.customHost,
          repoCommand.customToken
        );
      } else {
        workingDir = `${this.k6TestsDir}/tests`;
        testFile = `${command.testName}.js`;
        resultFile = `${this.k6TestsDir}/results/${timestamp}_${command.testName}.json`;
      }

      // Log environment config for debugging
      this.logger.info('Environment config for test execution', {
        testId,
        repositoryId: repoCommand.repositoryId,
        environment: command.environment,
        customHost: repoCommand.customHost,
        customToken: repoCommand.customToken ? '[REDACTED]' : undefined,
        envConfig: {
          CURRENT_HOST: envConfig.CURRENT_HOST,
          hasToken: !!envConfig.CURRENT_TOKEN,
          VUS: envConfig.VUS,
          DURATION: envConfig.DURATION,
        },
      });

      await this.notifyStart(execution, resultFile);

      const args = [
        'run',
        testFile,
        '-e',
        `PROFILE=${command.profile}`,
        '-e',
        `ENVIRONMENT=${command.environment}`,
        '-e',
        `LOG_LEVEL=error`,
        '--summary-export',
        resultFile,
      ];

      // Przekaż zmienne środowiskowe jako argumenty K6
      if (envConfig.CURRENT_HOST) {
        args.push('-e', `CURRENT_HOST=${envConfig.CURRENT_HOST}`);
      }
      if (envConfig.CURRENT_TOKEN) {
        args.push('-e', `CURRENT_TOKEN=${envConfig.CURRENT_TOKEN}`);
      }
      if (envConfig.VUS) {
        args.push('-e', `VUS=${envConfig.VUS}`);
      }
      if (envConfig.DURATION) {
        args.push('-e', `DURATION=${envConfig.DURATION}`);
      }

      // Dodaj także custom token jeśli jest podany
      if (command.customToken) {
        args.push('-e', `CUSTOM_TOKEN=${command.customToken}`);
      }

      const processEnv = {
        ...process.env,
        TERM: 'xterm-256color',
        NO_COLOR: 'false',
        // Dodatkowo ustaw w środowisku procesu
        CURRENT_HOST: envConfig.CURRENT_HOST,
        CURRENT_TOKEN: envConfig.CURRENT_TOKEN || '',
        PROFILE: command.profile,
        ENVIRONMENT: command.environment,
        LOG_LEVEL: 'error',
      };

      this.logger.info('Starting K6 process', {
        testId,
        command: 'k6',
        args,
        workingDir,
        envVars: {
          CURRENT_HOST: processEnv.CURRENT_HOST,
          ENVIRONMENT: processEnv.ENVIRONMENT,
          PROFILE: processEnv.PROFILE,
          hasToken: !!processEnv.CURRENT_TOKEN,
        },
      });

      const child = this.processExecutor.spawn('k6', args, {
        cwd: workingDir,
        env: processEnv,
      });

      this.runningProcesses.set(testId, child);
      this.logger.info('Test process started', {
        testId,
        pid: child.pid,
        repositoryId: repoCommand.repositoryId,
      });

      this.setupProcessHandlers(child, execution, resultFile, repoCommand.repositoryId);

      return execution;
    } catch (error) {
      this.logger.error('Failed to start test execution', error as Error, {
        testId,
      });
      throw new TestExecutionError('Failed to start test process', error as Error);
    }
  }

  async executeAllTests(
    command: ExecuteAllTestsCommand | RepositoryAllTestsCommand
  ): Promise<TestExecution> {
    const repoCommand = command as RepositoryAllTestsCommand;
    const testId = command.getTestId();
    const execution = new TestExecution(
      testId,
      'all-tests',
      command.profile,
      command.environment,
      command.customToken
    );

    try {
      await this.notifySequentialStart(execution);

      let scriptPath: string;
      let workingDir: string;
      let envConfig: any = {};

      if (repoCommand.repositoryId) {
        workingDir = `${this.k6TestsDir}/repositories/${repoCommand.repositoryId}`;
        scriptPath = `${workingDir}/run.sh`;

        envConfig = await this.getEnvironmentConfig(
          repoCommand.repositoryId,
          command.environment,
          command.profile,
          repoCommand.customHost,
          repoCommand.customToken
        );
      } else {
        workingDir = this.k6TestsDir;
        scriptPath = `${workingDir}/sequential-tests.sh`;
      }

      const processEnv = {
        ...process.env,
        TERM: 'xterm-256color',
        NO_COLOR: 'false',
        CURRENT_HOST: envConfig.CURRENT_HOST || '',
        CURRENT_TOKEN: envConfig.CURRENT_TOKEN || '',
        PROFILE: command.profile,
        ENVIRONMENT: command.environment,
        LOG_LEVEL: 'error',
      };

      const child = this.processExecutor.spawn('bash', [scriptPath, 'all', command.profile], {
        cwd: workingDir,
        env: processEnv,
      });

      this.runningProcesses.set(testId, child);
      this.logger.info('Sequential tests process started', {
        testId,
        pid: child.pid,
        repositoryId: repoCommand.repositoryId,
      });

      this.setupSequentialProcessHandlers(child, execution, repoCommand.repositoryId);

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

      const killed = this.processExecutor.kill(process, 'SIGTERM');

      if (killed) {
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

  private async getEnvironmentConfig(
    repositoryId: string,
    environment: string,
    profile: string,
    customHost?: string,
    customToken?: string
  ): Promise<any> {
    console.log('🔧 Getting environment config:', {
      repositoryId,
      environment,
      profile,
      hasCustomHost: !!customHost,
      hasCustomToken: !!customToken,
      customHost: customHost || '[not provided]',
      customTokenPreview: customToken ? `${customToken.substring(0, 20)}...` : '[not provided]',
    });

    try {
      const config = await this.repositoryRepository.getConfig(repositoryId);

      console.log('📋 Repository config loaded:', {
        hasConfig: !!config,
        configType: config ? 'found' : 'missing',
      });

      let host = customHost;
      let token = customToken;

      if (config) {
        // Jeśli nie ma custom host, użyj z konfiguracji repo
        if (!host) {
          host = config.getHost(environment as 'PROD' | 'DEV');
          console.log(`🌐 Using repository host for ${environment}:`, host);
        } else {
          console.log('🌐 Using custom host:', host);
        }

        // Jeśli nie ma custom token, użyj z konfiguracji repo
        if (!token) {
          token = config.getToken(environment as 'PROD' | 'DEV', 'USER');
          console.log(
            `🔑 Using repository token for ${environment}:`,
            token ? `${token.substring(0, 20)}...` : '[MISSING TOKEN]'
          );
        } else {
          console.log('🔑 Using custom token:', `${token.substring(0, 20)}...`);
        }

        const loadProfile = config.getLoadProfile(profile);

        console.log('⚙️ Load profile resolved:', {
          profile,
          resolved: loadProfile
            ? `${loadProfile.vus} VUs, ${loadProfile.duration}`
            : 'using defaults',
        });

        const finalConfig = {
          CURRENT_HOST: host || 'http://localhost:5000/api',
          CURRENT_TOKEN: token || '',
          VUS: loadProfile?.vus || 10,
          DURATION: loadProfile?.duration || '60s',
        };

        console.log('✅ Final environment config:', {
          CURRENT_HOST: finalConfig.CURRENT_HOST,
          hasToken: !!finalConfig.CURRENT_TOKEN,
          tokenPreview: finalConfig.CURRENT_TOKEN
            ? `${finalConfig.CURRENT_TOKEN.substring(0, 20)}...`
            : '[EMPTY]',
          VUS: finalConfig.VUS,
          DURATION: finalConfig.DURATION,
        });

        return finalConfig;
      } else {
        console.log('❌ No repository config found, using custom/default values');

        const fallbackConfig = {
          CURRENT_HOST: customHost || 'http://localhost:5000/api',
          CURRENT_TOKEN: customToken || '',
          VUS: 10,
          DURATION: '60s',
        };

        console.log('🔄 Fallback config:', {
          CURRENT_HOST: fallbackConfig.CURRENT_HOST,
          hasToken: !!fallbackConfig.CURRENT_TOKEN,
          tokenPreview: fallbackConfig.CURRENT_TOKEN
            ? `${fallbackConfig.CURRENT_TOKEN.substring(0, 20)}...`
            : '[EMPTY]',
        });

        return fallbackConfig;
      }
    } catch (error) {
      console.error('💥 Error loading repository config:', error);

      const errorConfig = {
        CURRENT_HOST: customHost || 'http://localhost:5000/api',
        CURRENT_TOKEN: customToken || '',
        VUS: 10,
        DURATION: '60s',
      };

      console.log('🆘 Error fallback config:', {
        CURRENT_HOST: errorConfig.CURRENT_HOST,
        hasToken: !!errorConfig.CURRENT_TOKEN,
      });

      return errorConfig;
    }
  }

  private async ensureResultsDirectory(path: string): Promise<void> {
    if (!(await this.fileSystem.exists(path))) {
      await this.fileSystem.mkdir(path, true);
    }
  }

  private setupProcessHandlers(
    process: any,
    execution: TestExecution,
    resultFile: string,
    repositoryId?: string
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
              'New test results available',
              execution.testName,
              resultFile,
              this.generateTimestamp(),
              repositoryId
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

  private setupSequentialProcessHandlers(
    process: any,
    execution: TestExecution,
    repositoryId?: string
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
              this.generateTimestamp(),
              repositoryId
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
