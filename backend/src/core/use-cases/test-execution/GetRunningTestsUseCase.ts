import { ITestExecutionService } from '../../interfaces/services/ITestExecutionService';
import { ILogger } from '../../interfaces/common/ILogger';

export class GetRunningTestsUseCase {
  constructor(
    private readonly testExecutionService: ITestExecutionService,
    private readonly logger: ILogger
  ) {}

  execute(): string[] {
    this.logger.debug('Fetching running tests');

    const runningTests = this.testExecutionService.getRunningTests();

    this.logger.info('Successfully fetched running tests', {
      count: runningTests.length,
    });

    return runningTests;
  }
}
