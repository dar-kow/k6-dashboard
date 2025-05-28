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
    // WAŻNE: Rzutuj command na rozszerzoną wersję z repositoryId
    const extendedCommand = command as any;
    const repositoryId = extendedCommand.repositoryId;

    this.logger.info('Starting test execution', {
      testName: command.testName,
      profile: command.profile,
      environment: command.environment,
      repositoryId: repositoryId, // LOG repositoryId
    });

    // WAŻNE: Przekaż repositoryId do findByName!
    const test = await this.testRepository.findByName(command.testName, repositoryId);

    if (!test) {
      this.logger.error('Test not found', new Error('Test not found'), {
        testName: command.testName,
        repositoryId: repositoryId,
      });
      throw new TestNotFoundError(command.testName);
    }

    const testId = command.getTestId();

    if (this.testExecutionService.isTestRunning(testId)) {
      throw new TestAlreadyRunningError(testId);
    }

    try {
      // Przekaż cały extended command z repositoryId
      const execution = await this.testExecutionService.executeTest(extendedCommand);

      this.logger.info('Test execution started successfully', {
        testId: execution.testId,
        testName: execution.testName,
        repositoryId: repositoryId,
      });

      return execution;
    } catch (error) {
      this.logger.error('Failed to start test execution', error as Error, {
        testName: command.testName,
        repositoryId: repositoryId,
      });
      throw error;
    }
  }
}
