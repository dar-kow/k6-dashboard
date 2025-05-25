import { TestExecution, TestProfile, Environment } from '../../core';
import { TestExecutionResponseDto } from '../dto';

export class TestExecutionMapper {
  static toResponseDto(execution: TestExecution, message: string): TestExecutionResponseDto {
    const config: TestExecutionResponseDto['config'] = {
      profile: execution.profile as string,
      environment: execution.environment as string,
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
    console.log('🔍 Mapping profile:', { input: profile, type: typeof profile });

    if (!profile || !Object.values(TestProfile).includes(profile as TestProfile)) {
      console.log('⚠️ Invalid profile, using default LIGHT:', {
        input: profile,
        availableProfiles: Object.values(TestProfile),
      });
      return TestProfile.LIGHT;
    }

    const mappedProfile = profile as TestProfile;
    console.log('✅ Profile mapped successfully:', { input: profile, output: mappedProfile });
    return mappedProfile;
  }

  static validateAndMapEnvironment(environment?: string): Environment {
    console.log('🔍 Mapping environment:', { input: environment, type: typeof environment });

    if (!environment || !Object.values(Environment).includes(environment as Environment)) {
      console.log('⚠️ Invalid environment, using default PROD:', {
        input: environment,
        availableEnvironments: Object.values(Environment),
      });
      return Environment.PROD;
    }

    const mappedEnvironment = environment as Environment;
    console.log('✅ Environment mapped successfully:', {
      input: environment,
      output: mappedEnvironment,
    });
    return mappedEnvironment;
  }
}
