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

  getDirectories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting test directories');

      const directories = await this.getTestDirectoriesUseCase.execute();
      const dto = TestResultMapper.toDirectoriesDto(directories);

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

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
