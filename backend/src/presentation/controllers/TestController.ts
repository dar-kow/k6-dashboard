import { Request, Response, NextFunction } from 'express';
import { GetAvailableTestsUseCase } from '../../core/use-cases';
import { TestResultMapper } from '../../application/mappers/TestResultMapper';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class TestController {
  constructor(
    private readonly getAvailableTestsUseCase: GetAvailableTestsUseCase,
    private readonly logger: ILogger
  ) {}

  getAvailableTests = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting available tests');

      const tests = await this.getAvailableTestsUseCase.execute();
      const dto = TestResultMapper.toConfigsDto(tests);

      res.json(dto);
    } catch (error) {
      next(error);
    }
  };
}
