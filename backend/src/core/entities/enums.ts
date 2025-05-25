export enum TestProfile {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
}

export enum Environment {
  PROD = 'PROD',
  DEV = 'DEV',
  STAGING = 'STAGING',
}

export enum TestExecutionStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED',
}

export enum TestOutputType {
  LOG = 'log',
  ERROR = 'error',
  COMPLETE = 'complete',
  STOPPED = 'stopped',
}
