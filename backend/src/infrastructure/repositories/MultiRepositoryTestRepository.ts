import { ITestRepository } from '../../core/interfaces/repositories/ITestRepository';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { TestConfig } from '../../core';

export class MultiRepositoryTestRepository implements ITestRepository {
  private readonly repositoriesPath: string;

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.repositoriesPath = `${this.config.getK6TestsDir()}/repositories`;
  }

  async findAll(repositoryId?: string): Promise<TestConfig[]> {
    try {
      if (repositoryId) {
        return await this.findTestsInRepository(repositoryId);
      }

      const testsPath = `${this.config.getK6TestsDir()}/tests`;
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

  private async findTestsInRepository(repositoryId: string): Promise<TestConfig[]> {
    try {
      const testsPath = `${this.repositoriesPath}/${repositoryId}/tests`;
      const exists = await this.fileSystem.exists(testsPath);

      if (!exists) {
        this.logger.warn('Tests directory not found in repository', { repositoryId, testsPath });
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

      this.logger.info('Found tests in repository', { repositoryId, count: tests.length });
      return tests;
    } catch (error) {
      this.logger.error('Error fetching tests from repository', error as Error, { repositoryId });
      throw error;
    }
  }

  async findByName(name: string, repositoryId?: string): Promise<TestConfig | null> {
    this.logger.debug('Finding test by name', { name, repositoryId });

    const tests = await this.findAll(repositoryId);
    const found = tests.find((test) => test.name === name);

    this.logger.debug('Test search result', {
      name,
      repositoryId,
      found: !!found,
      availableTests: tests.map((t) => t.name),
    });

    return found || null;
  }

  async exists(name: string, repositoryId?: string): Promise<boolean> {
    const test = await this.findByName(name, repositoryId);
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
