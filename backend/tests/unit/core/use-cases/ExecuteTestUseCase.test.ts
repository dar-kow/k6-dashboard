import { ExecuteTestUseCase } from '../../../../src/core/use-cases/test-execution/ExecuteTestUseCase';
import { ITestRepository } from '../../../../src/core/interfaces/repositories/ITestRepository';
import { ITestExecutionService } from '../../../../src/core/interfaces/services/ITestExecutionService';
import { ILogger } from '../../../../src/core/interfaces/common/ILogger';
import {
  TestConfig,
  TestExecution,
  TestProfile,
  Environment,
  ExecuteTestCommand,
} from '../../../../src/core/entities';
import { TestNotFoundError, TestAlreadyRunningError } from '../../../../src/core/errors';

describe('ExecuteTestUseCase', () => {
  let useCase: ExecuteTestUseCase;
  let mockTestRepository: jest.Mocked<ITestRepository>;
  let mockTestExecutionService: jest.Mocked<ITestExecutionService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockTestRepository = {
      findAll: jest.fn(),
      findByName: jest.fn(),
      exists: jest.fn(),
    };

    mockTestExecutionService = {
      executeTest: jest.fn(),
      executeAllTests: jest.fn(),
      stopTest: jest.fn(),
      getRunningTests: jest.fn(),
      isTestRunning: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    useCase = new ExecuteTestUseCase(mockTestRepository, mockTestExecutionService, mockLogger);
  });

  describe('execute', () => {
    const command = new ExecuteTestCommand('load-test', TestProfile.LIGHT, Environment.PROD);

    it('should execute test successfully', async () => {
      const testConfig = new TestConfig('load-test', 'Load Test', '/path/to/test.js');
      const execution = new TestExecution(
        'test-123',
        'load-test',
        TestProfile.LIGHT,
        Environment.PROD
      );

      mockTestRepository.findByName.mockResolvedValue(testConfig);
      mockTestExecutionService.isTestRunning.mockReturnValue(false);
      mockTestExecutionService.executeTest.mockResolvedValue(execution);

      const result = await useCase.execute(command);

      expect(mockTestRepository.findByName).toHaveBeenCalledWith('load-test');
      expect(mockTestExecutionService.isTestRunning).toHaveBeenCalled();
      expect(mockTestExecutionService.executeTest).toHaveBeenCalledWith(command);
      expect(result).toBe(execution);
      expect(mockLogger.info).toHaveBeenCalledWith('Starting test execution', expect.any(Object));
    });

    it('should throw TestNotFoundError when test does not exist', async () => {
      mockTestRepository.findByName.mockResolvedValue(null);

      await expect(useCase.execute(command)).rejects.toThrow(TestNotFoundError);
      expect(mockTestExecutionService.executeTest).not.toHaveBeenCalled();
    });

    it('should throw TestAlreadyRunningError when test is already running', async () => {
      const testConfig = new TestConfig('load-test', 'Load Test', '/path/to/test.js');

      mockTestRepository.findByName.mockResolvedValue(testConfig);
      mockTestExecutionService.isTestRunning.mockReturnValue(true);

      await expect(useCase.execute(command)).rejects.toThrow(TestAlreadyRunningError);
      expect(mockTestExecutionService.executeTest).not.toHaveBeenCalled();
    });
  });
});
