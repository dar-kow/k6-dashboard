export interface IConfig {
  get<T>(key: string): T;
  getRequired<T>(key: string): T;
  isDevelopment(): boolean;
  isProduction(): boolean;
  getPort(): number;
  getFrontendUrl(): string;
  getK6TestsDir(): string;
  getResultsDir(): string;
}
