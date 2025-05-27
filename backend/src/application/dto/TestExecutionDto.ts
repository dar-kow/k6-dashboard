export interface TestExecutionRequestDto {
  test?: string;
  profile?: string;
  environment?: string;
  repository: string;
  customToken?: string;
  customEndpoint?: string; // NEW: Support for custom endpoints
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
    hasCustomEndpoint: boolean; // NEW: Indicate if custom endpoint is used
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
