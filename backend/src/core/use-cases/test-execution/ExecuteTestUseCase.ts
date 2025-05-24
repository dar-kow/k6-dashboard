import { ITestRepository } from '../../interfaces/repositories/ITestRepository';
import { ITestExecutionService } from '../../interfaces/services/ITestExecutionService';
import { ILogger } from '../../interfaces/common/ILogger';
import { ExecuteTestCommand } from '../../value-objects/Commands';
import { TestExecution } from '../../entities/TestExecution';
import { TestNotFoundError, TestAlreadyRunningError } from '../../errors/DomainErrors';

export class ExecuteTestUseCase {
  constructor(
    private readonly testRepository: ITestRepository,
    private readonly testExecutionService: ITestExecutionService,
    private readonly logger: ILogger
  ) {}

  async execute(command: ExecuteTestCommand): Promise<TestExecution> {
    this.logger.info('Starting test execution', {
      testName: command.testName,
      profile: command.profile,
      environment: command.environment,
    });

    // Validate test exists
    const test = await this.testRepository.findByName(command.testName);
    if (!test) {
      throw new TestNotFoundError(command.testName);
    }

    const testId = command.getTestId();

    // Check if test is already running
    if (this.testExecutionService.isTestRunning(testId)) {
      throw new TestAlreadyRunningError(testId);
    }

    try {
      const execution = await this.testExecutionService.executeTest(command);

      this.logger.info('Test execution started successfully', {
        testId: execution.testId,
        testName: execution.testName,
      });

      return execution;
    } catch (error) {
      this.logger.error('Failed to start test execution', error as Error, {
        testName: command.testName,
      });
      throw error;
    }
  }
}
