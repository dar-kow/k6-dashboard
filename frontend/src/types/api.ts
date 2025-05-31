// 🔗 API Types for K6 Dashboard

import { HealthStatus } from "./index";

// Base API interfaces
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
  timestamp?: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string | number;
    details?: any;
  };
  status: number;
  success: false;
  timestamp?: string;
}

// Test Results API Types
export interface TestDirectory {
  name: string;
  path: string;
  date: Date;
  repositoryId?: string;
  repositoryName?: string;
  testName?: string;
}

export interface TestFile {
  name: string;
  path: string;
  size?: number;
  lastModified?: Date;
}

export interface TestMetric {
  avg: number;
  min: number;
  med: number;
  max: number;
  p90: number;
  p95: number;
}

export interface TestCheck {
  name: string;
  path: string;
  id: string;
  passes: number;
  fails: number;
}

export interface TestGroupStructure {
  name: string;
  path: string;
  id: string;
  groups: Record<string, any>;
  checks: Record<string, TestCheck>;
}

export interface TestResult {
  metrics: {
    iterations: {
      count: number;
      rate: number;
    };
    http_req_duration: TestMetric & {
      thresholds: Record<string, boolean>;
    };
    http_req_waiting: TestMetric;
    http_req_connecting: TestMetric;
    http_req_tls_handshaking: TestMetric;
    http_req_sending: TestMetric;
    http_req_receiving: TestMetric;
    http_req_blocked: TestMetric;
    http_reqs: {
      count: number;
      rate: number;
    };
    data_received: {
      count: number;
      rate: number;
    };
    data_sent: {
      count: number;
      rate: number;
    };
    iteration_duration: TestMetric;
    vus: {
      min: number;
      max: number;
      value: number;
    };
    vus_max: {
      min: number;
      max: number;
      value: number;
    };
    http_req_failed: {
      passes: number;
      fails: number;
      value: number;
      thresholds?: Record<string, boolean>;
    };
    checks: {
      passes: number;
      fails: number;
      value: number;
    };
    [key: string]: any;
  };
  root_group: TestGroupStructure;
}

// Repository API Types
export interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
  createdAt: string;
  lastSync?: string;
  needsSync: boolean;
}

export interface CreateRepositoryRequest {
  name: string;
  url: string;
  branch?: string;
}

export interface RepositoryConfig {
  hosts: {
    PROD: string;
    DEV: string;
  };
  tokens: {
    PROD: {
      USER?: string;
      ADMIN?: string;
    };
    DEV: {
      USER?: string;
      ADMIN?: string;
    };
  };
  loadProfiles: {
    [key: string]: {
      vus: number;
      duration: string;
    };
  };
  availableProfiles: string[];
}

// Test Runner API Types
export interface TestConfig {
  name: string;
  description: string;
  file: string;
}

export interface TestRunRequest {
  testId: string;
  test: string;
  profile: string;
  environment: "PROD" | "DEV";
  customToken?: string;
  customHost?: string;
  repositoryId?: string;
}

export interface TestOutput {
  type: "log" | "error" | "complete" | "stopped";
  data: string;
  timestamp?: string;
}

// Health Check API Types
export interface HealthCheckResponse {
  status: "ok" | "error";
  uptime: number;
  timestamp: string;
  version?: string;
  environment?: string;
}

// Search/Filter API Types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
