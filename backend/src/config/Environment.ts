import { ConfigurationError } from '../core/errors';
import { IConfig } from '../core/interfaces/common/IConfig';

export class Environment implements IConfig {
  private readonly config: Record<string, any>;

  constructor() {
    // Bezpośrednie sprawdzenie NODE_ENV zamiast używania metody
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
      K6_TESTS_DIR: process.env.K6_TESTS_DIR || this.getDefaultK6TestsDir(),
      RESULTS_DIR: process.env.RESULTS_DIR || this.getDefaultResultsDir(),
      LOG_LEVEL: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'), // Używamy lokalnej zmiennej
    };

    console.log('Final configuration:', {
      K6_TESTS_DIR: this.config.K6_TESTS_DIR,
      RESULTS_DIR: this.config.RESULTS_DIR,
      NODE_ENV: this.config.NODE_ENV,
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

  private getDefaultK6TestsDir(): string {
    // Zgodnie ze starym kodem: path.join(__dirname, "../../../k6-tests")
    // gdzie __dirname to src/services, więc 3 poziomy w górę to projekt root
    if (process.env.NODE_ENV === 'production') {
      return '/k6-tests'; // Docker path
    }
    // Development path - idź do project root
    return process.cwd().endsWith('/backend') ? '../k6-tests' : './k6-tests';
  }

  private getDefaultResultsDir(): string {
    // Zgodnie ze starym kodem: "../../../k6-tests/results" oraz "/results"
    if (process.env.NODE_ENV === 'production') {
      return '/results'; // Docker volume mount
    }
    // Development - najpierw spróbuj k6-tests/results, potem results
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
