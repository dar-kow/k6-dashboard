export class Repository {
  constructor(
    public readonly name: string,
    public readonly url: string,
    public readonly path: string,
    public readonly config?: any
  ) {}

  getTestsPath(): string {
    return `${this.path}/tests`;
  }

  getResultsPath(): string {
    return `${this.path}/results`;
  }

  getConfigPath(): string {
    return `${this.path}/config/env.js`;
  }
}
