export const APP_CONSTANTS = {
  APP_NAME: "K6 Dashboard",
  VERSION: "2.0.0",

  // API
  DEFAULT_API_URL: "http://localhost:4000/api",
  REQUEST_TIMEOUT: 30000,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Chart colors
  CHART_COLORS: {
    PRIMARY: "#3b82f6",
    SUCCESS: "#10b981",
    WARNING: "#f59e0b",
    ERROR: "#ef4444",
    INFO: "#06b6d4",
    SECONDARY: "#64748b",
  },

  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    RESPONSE_TIME: {
      EXCELLENT: 100,
      GOOD: 500,
      ACCEPTABLE: 1000,
    },
    ERROR_RATE: {
      EXCELLENT: 0,
      GOOD: 1,
      ACCEPTABLE: 5,
    },
    THROUGHPUT: {
      HIGH: 50,
      MEDIUM: 10,
      LOW: 1,
    },
  },

  // Test types
  TEST_TYPES: {
    INDIVIDUAL: "individual",
    SEQUENTIAL: "sequential",
    PARALLEL: "parallel",
  },

  // Storage keys
  STORAGE_KEYS: {
    SELECTED_REPOSITORY: "selectedRepositoryId",
    DASHBOARD_CONFIG: "k6-dashboard-config",
    USER_PREFERENCES: "userPreferences",
  },
} as const;

export const ROUTES = {
  DASHBOARD: "/",
  RESULTS: "/results",
  TEST_RUNNER: "/test-runner",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
