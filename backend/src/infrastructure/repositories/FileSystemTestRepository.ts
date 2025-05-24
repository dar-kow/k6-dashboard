import { ITestRepository } from '../../core/interfaces/repositories/ITestRepository';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { TestConfig } from '../../core';

export class FileSystemTestRepository implements ITestRepository {
  private readonly testsDir: string;

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.testsDir = this.config.getK6TestsDir();
  }

  async findAll(): Promise<TestConfig[]> {
    try {
      const testsPath = `${this.testsDir}/tests`;
      const exists = await this.fileSystem.exists(testsPath);

      if (!exists) {
        await this.fileSystem.mkdir(testsPath, true);
        return [];
      }

      const entries = await this.fileSystem.readDir(testsPath);

      const tests = entries
        .filter((entry: any) => entry.isFile() && entry.name.endsWith('.js'))
        .map((entry: any) => {
          const name = entry.name.replace('.js', '');
          const description = this.formatTestName(name);
          return new TestConfig(name, description, entry.path);
        });

      this.logger.info('Found available tests', { count: tests.length });
      return tests;
    } catch (error) {
      this.logger.error('Error fetching available tests', error as Error);
      throw error;
    }
  }

  async findByName(name: string): Promise<TestConfig | null> {
    const tests = await this.findAll();
    return tests.find((test) => test.name === name) || null;
  }

  async exists(name: string): Promise<boolean> {
    const test = await this.findByName(name);
    return test !== null;
  }

  private formatTestName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
