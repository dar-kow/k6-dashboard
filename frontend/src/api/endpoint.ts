// 🔗 API Endpoints for K6 Dashboard

// Base URL configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// API Endpoints organized by feature
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: "/health",

  // Test Results
  RESULTS: {
    LIST_DIRECTORIES: "/results",
    GET_DIRECTORY: (directory: string) =>
      `/results/${encodeURIComponent(directory)}`,
    GET_TEST_RESULT: (directory: string, file: string) =>
      `/results/${encodeURIComponent(directory)}/${encodeURIComponent(file)}`,
  },

  // Repositories
  REPOSITORIES: {
    LIST: "/repositories",
    CREATE: "/repositories",
    GET: (id: string) => `/repositories/${id}`,
    UPDATE: (id: string) => `/repositories/${id}`,
    DELETE: (id: string) => `/repositories/${id}`,
    SYNC: (id: string) => `/repositories/${id}/sync`,
    CONFIG: (id: string) => `/repositories/${id}/config`,
  },

  // Test Runner
  TEST_RUNNER: {
    LIST_TESTS: "/tests",
    RUN_TEST: "/run/test",
    RUN_ALL: "/run/all",
    STOP_TEST: "/run/stop",
  },

  // WebSocket endpoints (for Socket.IO)
  WEBSOCKET: {
    MAIN: "/socket.io",
  },
} as const;

// API Query Parameters
export const API_PARAMS = {
  // Common query parameters
  REPOSITORY_ID: "repositoryId",
  PAGE: "page",
  LIMIT: "limit",
  SEARCH: "search",
  SORT_BY: "sortBy",
  SORT_ORDER: "sortOrder",

  // Test results specific
  INCLUDE_METRICS: "includeMetrics",
  DATE_FROM: "dateFrom",
  DATE_TO: "dateTo",

  // Repository specific
  BRANCH: "branch",
  INCLUDE_CONFIG: "includeConfig",
} as const;

// API Response Status Codes
export const API_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Error
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: "application/json",
  FORM_DATA: "multipart/form-data",
  URL_ENCODED: "application/x-www-form-urlencoded",
  TEXT: "text/plain",
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
} as const;

// API Error Codes
export const API_ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  CONNECTION_ERROR: "CONNECTION_ERROR",

  // Authentication errors
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Business logic errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Test specific errors
  TEST_EXECUTION_FAILED: "TEST_EXECUTION_FAILED",
  INVALID_TEST_CONFIG: "INVALID_TEST_CONFIG",
  REPOSITORY_SYNC_FAILED: "REPOSITORY_SYNC_FAILED",
} as const;

// WebSocket Events
export const WEBSOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECTION_ESTABLISHED: "connection_established",

  // Test execution events
  TEST_OUTPUT: "testOutput",
  TEST_STARTED: "testStarted",
  TEST_COMPLETED: "testCompleted",
  TEST_FAILED: "testFailed",
  TEST_STOPPED: "testStopped",

  // Client to server events
  TEST_REQUEST: "test_request",
  STOP_TEST: "stop_test",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",

  // Data refresh events
  REFRESH_RESULTS: "refreshResults",
  REFRESH_REPOSITORIES: "refreshRepositories",
} as const;

// Helper functions for building URLs
export const buildUrl = (
  endpoint: string,
  params?: Record<string, any>
): string => {
  if (!params) return endpoint;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

export const buildRepositoryUrl = (
  repositoryId: string,
  action?: string
): string => {
  const baseUrl = API_ENDPOINTS.REPOSITORIES.GET(repositoryId);
  return action ? `${baseUrl}/${action}` : baseUrl;
};

export const buildResultsUrl = (directory?: string, file?: string): string => {
  if (!directory) return API_ENDPOINTS.RESULTS.LIST_DIRECTORIES;
  if (!file) return API_ENDPOINTS.RESULTS.GET_DIRECTORY(directory);
  return API_ENDPOINTS.RESULTS.GET_TEST_RESULT(directory, file);
};
