import { ITestResultRepository } from '../../interfaces/repositories/ITestResultRepository';
import { ILogger } from '../../interfaces/common/ILogger';
import { TestDirectory } from '../../entities/TestDirectory';

export class GetTestDirectoriesUseCase {
  constructor(
    private readonly testResultRepository: ITestResultRepository,
    private readonly logger: ILogger
  ) {}

  async execute(repositoryId?: string): Promise<TestDirectory[]> {
    this.logger.debug('Fetching test directories', { repositoryId });

    try {
      const directories = await this.testResultRepository.findAll(repositoryId);

      this.logger.info('Successfully fetched test directories', {
        count: directories.length,
        repositoryId: repositoryId || 'all',
        directories: directories.slice(0, 5).map((d) => ({
          name: d.name,
          type: d.type,
          date: d.date.toISOString(),
        })),
      });

      return directories;
    } catch (error) {
      this.logger.error('Failed to fetch test directories', error as Error, { repositoryId });
      throw error;
    }
  }
}
