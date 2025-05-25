import { ConfigurationError } from '../core/errors';
import { IConfig } from '../core/interfaces/common/IConfig';

export interface BasicSystemConfig {
  name: string;
  version: string;
  description: string;
  testConfig: {
    defaultProfile: string;
    maxConcurrentTests: number;
    timeout: number;
  };
}

export class Environment implements IConfig {
  private readonly config: Record<string, any>;
  private readonly systemConfig: BasicSystemConfig;

  constructor() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isDev = nodeEnv === 'development';

    console.log('Environment initialization:', {
      nodeEnv,
      cwd: process.cwd(),
      isDev,
    });

    this.config = {
      NODE_ENV: nodeEnv,
      PORT: parseInt(process.env.PORT || '4000'),
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost',
      BASE_K6_TESTS_DIR: process.env.BASE_K6_TESTS_DIR || this.getDefaultBaseK6TestsDir(),
      BASE_RESULTS_DIR: process.env.BASE_RESULTS_DIR || this.getDefaultBaseResultsDir(),
      LOG_LEVEL: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    };

    // Build basic system configuration
    this.systemConfig = {
      name: process.env.SYSTEM_NAME || 'K6 Performance Tests',
      version: process.env.SYSTEM_VERSION || 'v1.0.0',
      description: process.env.SYSTEM_DESCRIPTION || 'Performance testing suite',
      testConfig: {
        defaultProfile: process.env.DEFAULT_TEST_PROFILE || 'LIGHT',
        maxConcurrentTests: parseInt(process.env.MAX_CONCURRENT_TESTS || '3'),
        timeout: parseInt(process.env.TEST_TIMEOUT || '300000'),
      },
    };

    console.log('System configuration loaded:', {
      systemName: this.systemConfig.name,
      version: this.systemConfig.version,
      baseK6TestsDir: this.config.BASE_K6_TESTS_DIR,
      baseResultsDir: this.config.BASE_RESULTS_DIR,
    });

    this.validateConfig();
  }

  get<T>(key: string): T {
    return this.config[key] as T;
  }

  getRequired<T>(key: string): T {
    const value = this.config[key];
    if (value === undefined || value === null) {
      throw new ConfigurationError(`Required configuration key '${key}' is missing`);
    }
    return value as T;
  }

  getSystemConfig(): BasicSystemConfig {
    return this.systemConfig;
  }

  isDevelopment(): boolean {
    return this.get<string>('NODE_ENV') === 'development';
  }

  isProduction(): boolean {
    return this.get<string>('NODE_ENV') === 'production';
  }

  getPort(): number {
    return this.getRequired<number>('PORT');
  }

  getFrontendUrl(): string {
    return this.getRequired<string>('FRONTEND_URL');
  }

  // Legacy methods for backward compatibility - now they return active repository paths
  getK6TestsDir(): string {
    // This will be overridden by RepositoryManager to return active repo path
    return this.getRequired<string>('BASE_K6_TESTS_DIR');
  }

  getResultsDir(): string {
    // This will be overridden by RepositoryManager to return active repo results path
    return this.getRequired<string>('BASE_RESULTS_DIR');
  }

  // New methods for base directories
  getBaseK6TestsDir(): string {
    return this.getRequired<string>('BASE_K6_TESTS_DIR');
  }

  getBaseResultsDir(): string {
    return this.getRequired<string>('BASE_RESULTS_DIR');
  }

  getLogLevel(): string {
    return this.get<string>('LOG_LEVEL');
  }

  private getDefaultBaseK6TestsDir(): string {
    // Base directory where all test repositories will be stored
    if (process.env.NODE_ENV === 'production' || this.fileExists('/k6-tests')) {
      return '/k6-tests'; // Docker path - base directory
    }
    return process.cwd().endsWith('/backend') ? '../k6-tests' : './k6-tests';
  }

  private getDefaultBaseResultsDir(): string {
    // Base directory where all results will be stored
    if (process.env.NODE_ENV === 'production' || this.fileExists('/results')) {
      return '/results'; // Docker volume mount
    }
    return process.cwd().endsWith('/backend') ? '../results' : './results';
  }

  private fileExists(path: string): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(path);
    } catch {
      return false;
    }
  }

  private validateConfig(): void {
    const requiredKeys = ['PORT', 'FRONTEND_URL', 'BASE_K6_TESTS_DIR', 'BASE_RESULTS_DIR'];

    for (const key of requiredKeys) {
      if (this.config[key] === undefined || this.config[key] === null) {
        throw new ConfigurationError(`Required configuration key '${key}' is missing`);
      }
    }

    if (this.getPort() < 1 || this.getPort() > 65535) {
      throw new ConfigurationError('PORT must be between 1 and 65535');
    }
  }
}
