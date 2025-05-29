export interface TestDirectory {
  name: string;
  path: string;
  date: Date;
  // 🔧 DODANE: Repository info dla lepszego UX
  repositoryId?: string;
  repositoryName?: string;
  testName?: string;
}

export interface TestFile {
  name: string;
  path: string;
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

  // 🔧 DODANE: Helper methods dla lepszego UX
  getDisplayName?: () => string;
  getTestType?: () => string;
}
