import { ITestExecutionService } from '../../interfaces/services/ITestExecutionService';
import { ILogger } from '../../interfaces/common/ILogger';

export class StopTestUseCase {
  constructor(
    private readonly testExecutionService: ITestExecutionService,
    private readonly logger: ILogger
  ) {}

  async execute(testId: string): Promise<boolean> {
    this.logger.info('Stopping test execution', { testId });

    if (!this.testExecutionService.isTestRunning(testId)) {
      this.logger.warn('Attempted to stop non-running test', { testId });
      return false;
    }

    try {
      const stopped = await this.testExecutionService.stopTest(testId);

      if (stopped) {
        this.logger.info('Test execution stopped successfully', { testId });
      } else {
        this.logger.warn('Failed to stop test execution', { testId });
      }

      return stopped;
    } catch (error) {
      this.logger.error('Error stopping test execution', error as Error, {
        testId,
      });
      throw error;
    }
  }
}
