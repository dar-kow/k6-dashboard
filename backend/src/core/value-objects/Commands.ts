import { TestProfile, Environment } from '../entities/enums';

export class ExecuteTestCommand {
  constructor(
    public readonly testName: string,
    public readonly profile: TestProfile,
    public readonly environment: Environment,
    public readonly customToken?: string,
    public readonly testId?: string
  ) {}

  getTestId(): string {
    return this.testId || `${this.testName}-${Date.now()}`;
  }
}

export class ExecuteAllTestsCommand {
  constructor(
    public readonly profile: TestProfile,
    public readonly environment: Environment,
    public readonly customToken?: string,
    public readonly testId?: string
  ) {}

  getTestId(): string {
    return this.testId || `all-tests-${Date.now()}`;
  }
}
