export class ResultsUpdatedEvent {
  constructor(
    public readonly message: string,
    public readonly testName?: string,
    public readonly resultFile?: string,
    public readonly timestamp: string = new Date().toISOString(),
    public readonly repositoryId?: string
  ) {}
}

export class TestExecutionResult {
  constructor(
    public readonly success: boolean,
    public readonly exitCode: number,
    public readonly signal?: string,
    public readonly error?: Error
  ) {}

  static success(): TestExecutionResult {
    return new TestExecutionResult(true, 0);
  }

  static failure(exitCode: number, error?: Error): TestExecutionResult {
    return new TestExecutionResult(false, exitCode, undefined, error);
  }

  static stopped(signal: string): TestExecutionResult {
    return new TestExecutionResult(false, -1, signal);
  }
}
