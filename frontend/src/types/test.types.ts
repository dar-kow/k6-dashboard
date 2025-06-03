
export interface TestMetric {
  avg: number;
  min: number;
  med: number;
  max: number;
  p90?: number;
  p95?: number;
  "p(90)"?: number;
  "p(95)"?: number;
}

export interface TestCheck {
  name: string;
  path: string;
  id: string;
  passes: number;
  fails: number;
}

export interface TestResult {
  metrics: {
    iterations: {
      count: number;
      rate: number;
    };
    http_req_duration: TestMetric & {
      thresholds?: Record<string, boolean>;
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

export interface TestGroupStructure {
  name: string;
  path: string;
  id: string;
  groups: Record<string, any>;
  checks: Record<string, TestCheck>;
}

export interface TestDirectory {
  name: string;
  path: string;
  date: string;
  type?: 'directory' | 'virtual';
  repositoryId?: string;
  repositoryName?: string;
  testName?: string;
}

export interface TestFile {
  name: string;
  path: string;
}

export interface TestConfig {
  name: string;
  description: string;
  file: string;
}

export interface TestExecution {
  testId: string;
  testName: string;
  profile: string;
  environment: string;
  customToken?: string;
  startTime: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
  status: 'active' | 'inactive';
  lastSync: Date;
}
