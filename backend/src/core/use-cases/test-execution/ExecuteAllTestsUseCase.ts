import { ITestExecutionService } from '../../interfaces/services/ITestExecutionService';
import { ILogger } from '../../interfaces/common/ILogger';
import { ExecuteAllTestsCommand } from '../../value-objects/Commands';
import { TestExecution } from '../../entities/TestExecution';
import { TestAlreadyRunningError } from '../../errors/DomainErrors';

export class ExecuteAllTestsUseCase {
  constructor(
    private readonly testExecutionService: ITestExecutionService,
    private readonly logger: ILogger
  ) {}

  async execute(command: ExecuteAllTestsCommand): Promise<TestExecution> {
    this.logger.info('Starting sequential test execution', {
      profile: command.profile,
      environment: command.environment,
    });

    const testId = command.getTestId();

    // Check if test is already running
    if (this.testExecutionService.isTestRunning(testId)) {
      throw new TestAlreadyRunningError(testId);
    }

    try {
      const execution = await this.testExecutionService.executeAllTests(command);

      this.logger.info('Sequential test execution started successfully', {
        testId: execution.testId,
      });

      return execution;
    } catch (error) {
      this.logger.error('Failed to start sequential test execution', error as Error);
      throw error;
    }
  }
}
