import { Request, Response, NextFunction } from 'express';
import {
  ExecuteTestUseCase,
  ExecuteAllTestsUseCase,
  StopTestUseCase,
  GetRunningTestsUseCase,
} from '../../core/use-cases';
import { ExecuteTestCommand, ExecuteAllTestsCommand } from '../../core';
import { TestExecutionMapper } from '../../application/mappers/TestExecutionMapper';
import { TestExecutionRequestDto, StopTestRequestDto } from '../../application';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class TestRunnerController {
  constructor(
    private readonly executeTestUseCase: ExecuteTestUseCase,
    private readonly executeAllTestsUseCase: ExecuteAllTestsUseCase,
    private readonly stopTestUseCase: StopTestUseCase,
    private readonly getRunningTestsUseCase: GetRunningTestsUseCase,
    private readonly logger: ILogger
  ) {}

  executeTest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: TestExecutionRequestDto = req.body;

      this.logger.info('Executing test', {
        test: dto.test,
        profile: dto.profile,
        repositoryId: dto.repositoryId, // LOG to
      });

      // Stwórz podstawowy command
      const command = new ExecuteTestCommand(
        dto.test!,
        TestExecutionMapper.validateAndMapProfile(dto.profile),
        TestExecutionMapper.validateAndMapEnvironment(dto.environment),
        dto.customToken,
        dto.testId
      );

      // Rozszerz command o dodatkowe pola
      const extendedCommand = Object.assign(command, {
        repositoryId: dto.repositoryId,
        customHost: dto.customHost,
      });

      // Przekaż rozszerzony command
      const execution = await this.executeTestUseCase.execute(extendedCommand);
      const response = TestExecutionMapper.toResponseDto(execution, 'Test started successfully');

      if (dto.repositoryId) {
        response.config.repositoryId = dto.repositoryId;
      }
      if (dto.customHost) {
        response.config.customHost = dto.customHost;
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  executeAllTests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: TestExecutionRequestDto = req.body;
      this.logger.info('Executing all tests', {
        profile: dto.profile,
        repositoryId: dto.repositoryId,
      });

      const command: any = new ExecuteAllTestsCommand(
        TestExecutionMapper.validateAndMapProfile(dto.profile),
        TestExecutionMapper.validateAndMapEnvironment(dto.environment),
        dto.customToken,
        dto.testId
      );

      command.repositoryId = dto.repositoryId;
      command.customHost = dto.customHost;

      const execution = await this.executeAllTestsUseCase.execute(command);
      const response = TestExecutionMapper.toResponseDto(
        execution,
        'All tests started successfully'
      );

      if (dto.repositoryId) {
        response.config.repositoryId = dto.repositoryId;
      }
      if (dto.customHost) {
        response.config.customHost = dto.customHost;
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  stopTest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: StopTestRequestDto = req.body;
      this.logger.info('Stopping test', { testId: dto.testId });

      const stopped = await this.stopTestUseCase.execute(dto.testId);

      if (stopped) {
        res.json({
          message: 'Test stopped successfully',
          testId: dto.testId,
        });
      } else {
        res.status(404).json({
          error: 'Test not found or already completed',
          testId: dto.testId,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  getRunningTests = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting running tests');

      const runningTests = this.getRunningTestsUseCase.execute();

      res.json({
        runningTests,
        count: runningTests.length,
      });
    } catch (error) {
      next(error);
    }
  };
}
