import { TestExecution, TestProfile, Environment } from '../../core';
import { TestExecutionResponseDto } from '../dto';

export class TestExecutionMapper {
  static toResponseDto(execution: TestExecution, message: string): TestExecutionResponseDto {
    const config: TestExecutionResponseDto['config'] = {
      profile: execution.profile as string,
      environment: execution.environment as string,
      repository: execution.repository || 'default',
      hasCustomToken: !!execution.customToken?.trim(),
    };

    if (execution.testName !== 'all-tests') {
      config.test = execution.testName;
    }

    return {
      message,
      testId: execution.testId,
      config,
    };
  }

  static validateAndMapProfile(profile?: string): TestProfile {
    if (!profile || !Object.values(TestProfile).includes(profile as TestProfile)) {
      return TestProfile.LIGHT;
    }
    return profile as TestProfile;
  }

  static validateAndMapEnvironment(environment?: string): Environment {
    if (!environment || !Object.values(Environment).includes(environment as Environment)) {
      return Environment.PROD;
    }
    return environment as Environment;
  }
}
