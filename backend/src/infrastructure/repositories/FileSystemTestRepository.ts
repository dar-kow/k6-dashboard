import { ITestRepository } from '../../core/interfaces/repositories/ITestRepository';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { TestConfig } from '../../core';

export class FileSystemTestRepository implements ITestRepository {
  private readonly testsDir: string;
  private readonly reposDir: string;

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.testsDir = this.config.getK6TestsDir();
    this.reposDir = `${this.testsDir}/repos`;
  }

  async findAll(): Promise<TestConfig[]> {
    try {
      const allTests: TestConfig[] = [];

      // Legacy tests from main tests directory
      const legacyTestsPath = `${this.testsDir}/tests`;
      const legacyExists = await this.fileSystem.exists(legacyTestsPath);

      if (legacyExists) {
        const entries = await this.fileSystem.readDir(legacyTestsPath);
        const legacyTests = entries
          .filter((entry: any) => entry.isFile() && entry.name.endsWith('.js'))
          .map((entry: any) => {
            const name = entry.name.replace('.js', '');
            const description = this.formatTestName(name);
            return new TestConfig(name, description, entry.path, 'legacy');
          });
        allTests.push(...legacyTests);
      }

      // Repository-based tests
      const reposExists = await this.fileSystem.exists(this.reposDir);
      if (reposExists) {
        const repoEntries = await this.fileSystem.readDir(this.reposDir);

        for (const repoEntry of repoEntries.filter((e) => e.isDirectory())) {
          const repoTestsPath = `${this.reposDir}/${repoEntry.name}/tests`;
          const repoTestsExists = await this.fileSystem.exists(repoTestsPath);

          if (repoTestsExists) {
            const testEntries = await this.fileSystem.readDir(repoTestsPath);
            const repoTests = testEntries
              .filter((entry: any) => entry.isFile() && entry.name.endsWith('.js'))
              .map((entry: any) => {
                const name = entry.name.replace('.js', '');
                const description = `${this.formatTestName(name)} (${repoEntry.name})`;
                return new TestConfig(name, description, entry.path, repoEntry.name);
              });
            allTests.push(...repoTests);
          }
        }
      }

      this.logger.info('Found available tests', { count: allTests.length });
      return allTests;
    } catch (error) {
      this.logger.error('Error fetching available tests', error as Error);
      throw error;
    }
  }

  async findByName(name: string, repository?: string): Promise<TestConfig | null> {
    const tests = await this.findAll();

    if (repository) {
      return tests.find((test) => test.name === name && test.repository === repository) || null;
    }

    return tests.find((test) => test.name === name) || null;
  }

  async exists(name: string, repository?: string): Promise<boolean> {
    const test = await this.findByName(name, repository);
    return test !== null;
  }

  async findByRepository(repository: string): Promise<TestConfig[]> {
    const tests = await this.findAll();
    return tests.filter((test) => test.repository === repository);
  }

  private formatTestName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
