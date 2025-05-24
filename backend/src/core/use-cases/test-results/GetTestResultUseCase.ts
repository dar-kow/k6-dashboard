import { ITestResultRepository } from '../../interfaces/repositories/ITestResultRepository';
import { ILogger } from '../../interfaces/common/ILogger';

export class GetTestResultUseCase {
  constructor(
    private readonly testResultRepository: ITestResultRepository,
    private readonly logger: ILogger
  ) {}

  async execute(directory: string, file: string): Promise<any> {
    this.logger.debug('Fetching test result', { directory, file });

    try {
      const result = await this.testResultRepository.findResult(directory, file);

      this.logger.info('Successfully fetched test result', {
        directory,
        file,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch test result', error as Error, {
        directory,
        file,
      });
      throw error;
    }
  }
}
