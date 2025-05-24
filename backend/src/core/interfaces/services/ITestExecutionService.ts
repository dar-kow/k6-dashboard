import { ExecuteAllTestsCommand, ExecuteTestCommand } from '@core/value-objects';
import { TestExecution } from '../../entities';

export interface ITestExecutionService {
  executeTest(command: ExecuteTestCommand): Promise<TestExecution>;
  executeAllTests(command: ExecuteAllTestsCommand): Promise<TestExecution>;
  stopTest(testId: string): Promise<boolean>;
  getRunningTests(): string[];
  isTestRunning(testId: string): boolean;
}
