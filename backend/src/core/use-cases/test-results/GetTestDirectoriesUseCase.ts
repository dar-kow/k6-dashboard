import { ITestResultRepository } from '../../interfaces/repositories/ITestResultRepository';
import { ILogger } from '../../interfaces/common/ILogger';
import { TestDirectory } from '../../entities/TestDirectory';

export class GetTestDirectoriesUseCase {
  constructor(
    private readonly testResultRepository: ITestResultRepository,
    private readonly logger: ILogger
  ) {}

  async execute(): Promise<TestDirectory[]> {
    this.logger.debug('Fetching test directories');

    try {
      const directories = await this.testResultRepository.findAll();

      this.logger.info('Successfully fetched test directories', {
        count: directories.length,
      });

      return directories;
    } catch (error) {
      this.logger.error('Failed to fetch test directories', error as Error);
      throw error;
    }
  }
}
