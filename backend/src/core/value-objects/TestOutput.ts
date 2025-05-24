import { TestOutputType } from '../entities/enums';

export class TestOutput {
  constructor(
    public readonly type: TestOutputType,
    public readonly data: string,
    public readonly timestamp: Date = new Date()
  ) {}

  static log(data: string): TestOutput {
    return new TestOutput(TestOutputType.LOG, data);
  }

  static error(data: string): TestOutput {
    return new TestOutput(TestOutputType.ERROR, data);
  }

  static complete(data: string): TestOutput {
    return new TestOutput(TestOutputType.COMPLETE, data);
  }

  static stopped(data: string): TestOutput {
    return new TestOutput(TestOutputType.STOPPED, data);
  }
}
