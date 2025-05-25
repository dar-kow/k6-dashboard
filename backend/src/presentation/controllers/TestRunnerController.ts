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

      // Log incoming request data
      this.logger.info('Executing test - incoming request:', {
        body: dto,
        test: dto.test,
        profile: dto.profile,
        environment: dto.environment,
        customToken: dto.customToken ? '***SET***' : 'NOT_SET',
        testId: dto.testId,
      });

      // Validate and map parameters
      const mappedProfile = TestExecutionMapper.validateAndMapProfile(dto.profile);
      const mappedEnvironment = TestExecutionMapper.validateAndMapEnvironment(dto.environment);

      this.logger.info('Mapped parameters:', {
        originalProfile: dto.profile,
        mappedProfile,
        originalEnvironment: dto.environment,
        mappedEnvironment,
      });

      const command = new ExecuteTestCommand(
        dto.test!,
        mappedProfile,
        mappedEnvironment,
        dto.customToken,
        dto.testId
      );

      this.logger.info('Created ExecuteTestCommand:', {
        testName: command.testName,
        profile: command.profile,
        environment: command.environment,
        hasCustomToken: !!command.customToken,
        testId: command.getTestId(),
      });

      const execution = await this.executeTestUseCase.execute(command);
      const response = TestExecutionMapper.toResponseDto(execution, 'Test started successfully');

      this.logger.info('Test execution started successfully:', {
        testId: execution.testId,
        response,
      });

      res.json(response);
    } catch (error) {
      this.logger.error('Error in executeTest controller:', error as Error);
      next(error);
    }
  };

  executeAllTests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: TestExecutionRequestDto = req.body;

      // Log incoming request data
      this.logger.info('Executing all tests - incoming request:', {
        body: dto,
        profile: dto.profile,
        environment: dto.environment,
        customToken: dto.customToken ? '***SET***' : 'NOT_SET',
        testId: dto.testId,
      });

      // Validate and map parameters
      const mappedProfile = TestExecutionMapper.validateAndMapProfile(dto.profile);
      const mappedEnvironment = TestExecutionMapper.validateAndMapEnvironment(dto.environment);

      this.logger.info('Mapped parameters for all tests:', {
        originalProfile: dto.profile,
        mappedProfile,
        originalEnvironment: dto.environment,
        mappedEnvironment,
      });

      const command = new ExecuteAllTestsCommand(
        mappedProfile,
        mappedEnvironment,
        dto.customToken,
        dto.testId
      );

      this.logger.info('Created ExecuteAllTestsCommand:', {
        profile: command.profile,
        environment: command.environment,
        hasCustomToken: !!command.customToken,
        testId: command.getTestId(),
      });

      const execution = await this.executeAllTestsUseCase.execute(command);
      const response = TestExecutionMapper.toResponseDto(
        execution,
        'All tests started successfully'
      );

      this.logger.info('All tests execution started successfully:', {
        testId: execution.testId,
        response,
      });

      res.json(response);
    } catch (error) {
      this.logger.error('Error in executeAllTests controller:', error as Error);
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
