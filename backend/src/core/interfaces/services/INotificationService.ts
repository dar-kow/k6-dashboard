import { TestOutput, TestExecutionResult, ResultsUpdatedEvent } from '../../value-objects';

export interface INotificationService {
  notifyTestOutput(testId: string, output: TestOutput): Promise<void>;
  notifyTestComplete(testId: string, result: TestExecutionResult): Promise<void>;
  notifyTestStopped(testId: string): Promise<void>;
  notifyResultsUpdated(event: ResultsUpdatedEvent): Promise<void>;
}
