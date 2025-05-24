import { ITestResultRepository } from '../../interfaces/repositories/ITestResultRepository';
import { ILogger } from '../../interfaces/common/ILogger';
import { TestFile } from '../../entities/TestFile';
import { DirectoryNotFoundError } from '../../errors/DomainErrors';

export class GetTestFilesUseCase {
  constructor(
    private readonly testResultRepository: ITestResultRepository,
    private readonly logger: ILogger
  ) {}

  async execute(directory: string): Promise<TestFile[]> {
    this.logger.debug('Fetching test files', { directory });

    // Validate directory exists
    const exists = await this.testResultRepository.exists(directory);
    if (!exists) {
      throw new DirectoryNotFoundError(directory);
    }

    try {
      const files = await this.testResultRepository.findByDirectory(directory);

      this.logger.info('Successfully fetched test files', {
        directory,
        count: files.length,
      });

      return files;
    } catch (error) {
      this.logger.error('Failed to fetch test files', error as Error, {
        directory,
      });
      throw error;
    }
  }
}
