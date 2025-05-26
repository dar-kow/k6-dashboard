import { ConfigurationError } from '../core/errors';
import { IConfig } from '../core/interfaces/common/IConfig';

export class Environment implements IConfig {
  private readonly config: Record<string, any>;

  constructor() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isDev = nodeEnv === 'development';

    this.config = {
      NODE_ENV: nodeEnv,
      PORT: parseInt(process.env.PORT || '4000'),
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost',
      K6_TESTS_DIR: process.env.K6_TESTS_DIR || this.getDefaultK6TestsDir(),
      RESULTS_DIR: process.env.RESULTS_DIR || this.getDefaultResultsDir(),
      LOG_LEVEL: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
      REPOSITORIES: this.parseRepositories(),
    };

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

  getK6TestsDir(): string {
    return this.getRequired<string>('K6_TESTS_DIR');
  }

  getResultsDir(): string {
    return this.getRequired<string>('RESULTS_DIR');
  }

  getLogLevel(): string {
    return this.get<string>('LOG_LEVEL');
  }

  getRepositories(): Array<{ name: string; url: string }> {
    return this.get<Array<{ name: string; url: string }>>('REPOSITORIES') || [];
  }

  private parseRepositories(): Array<{ name: string; url: string }> {
    const reposEnv = process.env.REPOSITORIES;
    if (!reposEnv) return [];

    try {
      return JSON.parse(reposEnv);
    } catch {
      return [];
    }
  }

  private getDefaultK6TestsDir(): string {
    if (process.env.NODE_ENV === 'production') {
      return '/k6-tests';
    }
    return process.cwd().endsWith('/backend') ? '../k6-tests' : './k6-tests';
  }

  private getDefaultResultsDir(): string {
    if (process.env.NODE_ENV === 'production') {
      return '/results';
    }
    return process.cwd().endsWith('/backend') ? '../k6-tests/results' : './k6-tests/results';
  }

  private validateConfig(): void {
    const requiredKeys = ['PORT', 'FRONTEND_URL', 'K6_TESTS_DIR', 'RESULTS_DIR'];

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
