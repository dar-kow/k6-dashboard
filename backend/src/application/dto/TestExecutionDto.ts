export interface TestExecutionRequestDto {
  test?: string;
  profile?: string;
  environment?: string;
  customToken?: string;
  testId?: string;
  repositoryId?: string;
  customHost?: string;
}

export interface TestExecutionResponseDto {
  message: string;
  testId: string;
  config: {
    test?: string;
    profile: string;
    environment: string;
    hasCustomToken: boolean;
    repositoryId?: string;
    customHost?: string;
  };
}

export interface StopTestRequestDto {
  testId: string;
}

export interface StopTestResponseDto {
  message: string;
  testId: string;
}

export interface RunningTestsResponseDto {
  runningTests: string[];
  count: number;
}
