import { TestProfile, Environment, TestExecutionStatus } from './enums';
import { TestExecutionResult } from '../value-objects/Events';

export class TestExecution {
  constructor(
    public readonly testId: string,
    public readonly testName: string,
    public readonly profile: TestProfile,
    public readonly environment: Environment,
    public readonly repository?: string,
    public readonly customToken?: string,
    public readonly startTime: Date = new Date(),
    public status: TestExecutionStatus = TestExecutionStatus.RUNNING
  ) {}

  complete(result: TestExecutionResult): void {
    this.status = result.success ? TestExecutionStatus.COMPLETED : TestExecutionStatus.FAILED;
  }

  stop(): void {
    this.status = TestExecutionStatus.STOPPED;
  }

  isRunning(): boolean {
    return this.status === TestExecutionStatus.RUNNING;
  }
}
