import { Request, Response, NextFunction } from 'express';
import {
  GetTestDirectoriesUseCase,
  GetTestFilesUseCase,
  GetTestResultUseCase,
} from '../../core/use-cases';
import { TestResultMapper } from '../../application/mappers/TestResultMapper';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class TestResultController {
  constructor(
    private readonly getTestDirectoriesUseCase: GetTestDirectoriesUseCase,
    private readonly getTestFilesUseCase: GetTestFilesUseCase,
    private readonly getTestResultUseCase: GetTestResultUseCase,
    private readonly logger: ILogger
  ) {}

  getDirectories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repositoryId = req.query.repositoryId as string | undefined;

      this.logger.debug('Getting test directories', { repositoryId });

      const directories = await this.getTestDirectoriesUseCase.execute(repositoryId);
      const dto = TestResultMapper.toDirectoriesDto(directories);

      this.logger.info('Returned directories', {
        count: dto.length,
        repositoryId: repositoryId || 'all',
        directories: dto.map((d) => d.name),
      });

      res.json(dto);
    } catch (error) {
      next(error);
    }
  };

  getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { directory } = req.params;

      this.logger.debug('Getting test files', { directory });

      const files = await this.getTestFilesUseCase.execute(directory);
      const dto = TestResultMapper.toFilesDto(files);

      this.logger.info('Returned files', {
        directory,
        count: dto.length,
        files: dto.map((f) => f.name),
      });

      res.json(dto);
    } catch (error) {
      next(error);
    }
  };

  getResult = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { directory, file } = req.params;

      this.logger.debug('Getting test result', { directory, file });

      const result = await this.getTestResultUseCase.execute(directory, file);

      this.logger.info('Returned test result', {
        directory,
        file,
        hasMetrics: !!result.metrics,
        hasRootGroup: !!result.root_group,
        checksCount: result.root_group?.checks ? Object.keys(result.root_group.checks).length : 0,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
