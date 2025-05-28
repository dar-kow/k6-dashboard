import { Request, Response, NextFunction } from 'express';
import { GetAvailableTestsUseCase } from '../../core/use-cases';
import { TestResultMapper } from '../../application/mappers/TestResultMapper';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class TestController {
  constructor(
    private readonly getAvailableTestsUseCase: GetAvailableTestsUseCase,
    private readonly logger: ILogger
  ) {}

  getAvailableTests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting available tests');

      const repositoryId = req.query.repositoryId as string | undefined;
      const tests = await this.getAvailableTestsUseCase.execute(repositoryId);
      const dto = TestResultMapper.toConfigsDto(tests);

      res.json(dto);
    } catch (error) {
      next(error);
    }
  };
}
