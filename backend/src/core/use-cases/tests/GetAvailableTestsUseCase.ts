import { ITestRepository } from '../../interfaces/repositories/ITestRepository';
import { ILogger } from '../../interfaces/common/ILogger';
import { TestConfig } from '../../entities/TestConfig';

export class GetAvailableTestsUseCase {
  constructor(
    private readonly testRepository: ITestRepository,
    private readonly logger: ILogger
  ) {}

  async execute(): Promise<TestConfig[]> {
    this.logger.debug('Fetching available tests');

    try {
      const tests = await this.testRepository.findAll();

      this.logger.info('Successfully fetched available tests', {
        count: tests.length,
      });

      return tests;
    } catch (error) {
      this.logger.error('Failed to fetch available tests', error as Error);
      throw error;
    }
  }
}
