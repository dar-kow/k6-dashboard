import {
  TestExecution,
  TestProfile,
  Environment,
  TestExecutionStatus,
  TestExecutionResult,
} from '../../../../src/core/entities';

describe('TestExecution', () => {
  let execution: TestExecution;
  const testId = 'test-123';
  const testName = 'load-test';
  const profile = TestProfile.LIGHT;
  const environment = Environment.PROD;

  beforeEach(() => {
    execution = new TestExecution(testId, testName, profile, environment);
  });

  describe('constructor', () => {
    it('should create a TestExecution with correct initial state', () => {
      expect(execution.testId).toBe(testId);
      expect(execution.testName).toBe(testName);
      expect(execution.profile).toBe(profile);
      expect(execution.environment).toBe(environment);
      expect(execution.status).toBe(TestExecutionStatus.RUNNING);
      expect(execution.startTime).toBeInstanceOf(Date);
    });

    it('should accept custom token', () => {
      const customToken = 'bearer-token-123';
      const execWithToken = new TestExecution(testId, testName, profile, environment, customToken);

      expect(execWithToken.customToken).toBe(customToken);
    });
  });

  describe('complete', () => {
    it('should mark execution as completed on success', () => {
      const result = TestExecutionResult.success();
      execution.complete(result);

      expect(execution.status).toBe(TestExecutionStatus.COMPLETED);
    });

    it('should mark execution as failed on failure', () => {
      const result = TestExecutionResult.failure(1);
      execution.complete(result);

      expect(execution.status).toBe(TestExecutionStatus.FAILED);
    });
  });

  describe('stop', () => {
    it('should mark execution as stopped', () => {
      execution.stop();
      expect(execution.status).toBe(TestExecutionStatus.STOPPED);
    });
  });

  describe('isRunning', () => {
    it('should return true when status is RUNNING', () => {
      expect(execution.isRunning()).toBe(true);
    });

    it('should return false when status is not RUNNING', () => {
      execution.stop();
      expect(execution.isRunning()).toBe(false);
    });
  });
});
