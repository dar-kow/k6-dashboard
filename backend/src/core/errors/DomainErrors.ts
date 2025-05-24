import { BaseError } from './BaseError';

export class TestNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(testName: string) {
    super(`Test '${testName}' not found`);
  }
}

export class TestAlreadyRunningError extends BaseError {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(testId: string) {
    super(`Test '${testId}' is already running`);
  }
}

export class TestExecutionError extends BaseError {
  readonly statusCode = 500;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(`Test execution failed: ${message}`, cause);
  }
}

export class DirectoryNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(directory: string) {
    super(`Directory '${directory}' not found`);
  }
}

export class FileNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(filePath: string) {
    super(`File '${filePath}' not found`);
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(field: string, message: string) {
    super(`Validation error for '${field}': ${message}`);
  }
}

export class ConfigurationError extends BaseError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message: string) {
    super(`Configuration error: ${message}`);
  }
}
