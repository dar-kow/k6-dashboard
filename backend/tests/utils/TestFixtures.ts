import {
  TestDirectory,
  TestFile,
  TestConfig,
  TestExecution,
  TestProfile,
  Environment,
} from '../../src/core/entities';

export class TestFixtures {
  static createTestDirectory(
    overrides: Partial<ConstructorParameters<typeof TestDirectory>[0]> = {}
  ): TestDirectory {
    return new TestDirectory(
      overrides.name || 'sequential_20230521_185106',
      overrides.path || '/path/to/results/sequential_20230521_185106',
      overrides.date || new Date('2023-05-21T18:51:06.000Z'),
      overrides.type || 'directory'
    );
  }

  static createTestFile(
    overrides: Partial<ConstructorParameters<typeof TestFile>[0]> = {}
  ): TestFile {
    return new TestFile(
      overrides.name || 'load-test.json',
      overrides.path || '/path/to/results/load-test.json'
    );
  }

  static createTestConfig(
    overrides: Partial<ConstructorParameters<typeof TestConfig>[0]> = {}
  ): TestConfig {
    return new TestConfig(
      overrides.name || 'load-test',
      overrides.description || 'Load Test',
      overrides.file || '/path/to/tests/load-test.js'
    );
  }

  static createTestExecution(
    overrides: Partial<ConstructorParameters<typeof TestExecution>[0]> = {}
  ): TestExecution {
    return new TestExecution(
      overrides.testId || 'test-123',
      overrides.testName || 'load-test',
      overrides.profile || TestProfile.LIGHT,
      overrides.environment || Environment.PROD,
      overrides.customToken
    );
  }

  static createMockTestResult(): any {
    return {
      metrics: {
        http_reqs: { count: 1000, rate: 16.67 },
        http_req_duration: { avg: 250, min: 100, max: 500, p95: 400 },
        http_req_failed: { value: 0.01 },
        data_received: { count: 1024000 },
        data_sent: { count: 512000 },
      },
      root_group: {
        name: 'root',
        checks: {
          status_check: {
            name: 'status is 200',
            passes: 995,
            fails: 5,
          },
        },
      },
    };
  }
}
