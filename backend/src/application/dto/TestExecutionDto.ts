export interface TestExecutionRequestDto {
  test?: string;
  profile?: string;
  environment?: string;
  repository: string;
  customToken?: string;
  testId?: string;
}

export interface TestExecutionResponseDto {
  message: string;
  testId: string;
  config: {
    test?: string;
    profile: string;
    environment: string;
    repository: string;
    hasCustomToken: boolean;
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

export interface RepositoryDto {
  name: string;
  url?: string;
  config?: any;
  tests?: string[];
}

export interface CloneRepositoryDto {
  name: string;
  url: string;
}
