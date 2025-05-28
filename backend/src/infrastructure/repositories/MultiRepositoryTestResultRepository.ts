import { ITestResultRepository } from '../../core/interfaces/repositories/ITestResultRepository';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { TestDirectory, TestFile } from '../../core/entities';
import { FileNotFoundError } from '../../core/errors';

export class MultiRepositoryTestResultRepository implements ITestResultRepository {
  private readonly repositoriesPath: string;

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.repositoriesPath = `${this.config.getK6TestsDir()}/repositories`;
  }

  async findAll(repositoryId?: string): Promise<TestDirectory[]> {
    try {
      const directories: TestDirectory[] = [];

      if (repositoryId) {
        const repoResultsDir = `${this.repositoriesPath}/${repositoryId}/results`;
        if (await this.fileSystem.exists(repoResultsDir)) {
          const repoDirs = await this.getDirectoriesFromPath(
            repoResultsDir,
            `repo:${repositoryId}`
          );
          directories.push(...repoDirs);
        }
      } else {
        const defaultResultsDir = await this.findResultsDirectory();
        const defaultDirs = await this.getDirectoriesFromPath(defaultResultsDir, 'default');
        directories.push(...defaultDirs);

        const reposPath = this.repositoriesPath;
        if (await this.fileSystem.exists(reposPath)) {
          const repos = await this.fileSystem.readDir(reposPath);
          for (const repo of repos) {
            if (repo.isDirectory()) {
              const repoResultsDir = `${repo.path}/results`;
              if (await this.fileSystem.exists(repoResultsDir)) {
                const repoDirs = await this.getDirectoriesFromPath(
                  repoResultsDir,
                  `repo:${repo.name}`
                );
                directories.push(...repoDirs);
              }
            }
          }
        }
      }

      const allDirs = directories.sort((a, b) => b.date.getTime() - a.date.getTime());

      this.logger.info('Found test directories', { total: allDirs.length });
      return allDirs;
    } catch (error) {
      this.logger.error('Error fetching test directories', error as Error);
      return [];
    }
  }

  private async getDirectoriesFromPath(path: string, prefix: string): Promise<TestDirectory[]> {
    const entries = await this.fileSystem.readDir(path);
    const directories: TestDirectory[] = [];
    const virtualDirectories: TestDirectory[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const date = this.extractDateFromDirectoryName(entry.name);
        directories.push(
          new TestDirectory(`${prefix}/${entry.name}`, entry.path, date, 'directory')
        );
      }
    }

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const date = this.extractDateFromFileName(entry.name);
        virtualDirectories.push(
          new TestDirectory(`${prefix}/${entry.name}`, entry.path, date, 'virtual')
        );
      }
    }

    return [...directories, ...virtualDirectories];
  }

  async findByDirectory(directory: string): Promise<TestFile[]> {
    const [prefix, ...rest] = directory.split('/');
    const actualDir = rest.join('/');

    let resultsDir: string;
    if (prefix.startsWith('repo:')) {
      const repoId = prefix.substring(5);
      resultsDir = `${this.repositoriesPath}/${repoId}/results`;
    } else {
      resultsDir = await this.findResultsDirectory();
    }

    if (actualDir.endsWith('.json')) {
      const filePath = `${resultsDir}/${actualDir}`;
      const exists = await this.fileSystem.exists(filePath);

      if (!exists) {
        throw new FileNotFoundError(filePath);
      }

      const match = actualDir.match(/^\d{8}_\d{6}_(.+)\.json$/);
      const testName = match ? match[1] : actualDir.replace('.json', '');

      return [new TestFile(`${testName}.json`, filePath)];
    } else {
      const dirPath = `${resultsDir}/${actualDir}`;
      const entries = await this.fileSystem.readDir(dirPath);

      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => new TestFile(entry.name, entry.path));
    }
  }

  async findResult(directory: string, file: string): Promise<any> {
    const [prefix, ...rest] = directory.split('/');
    const actualDir = rest.join('/');

    let resultsDir: string;
    if (prefix.startsWith('repo:')) {
      const repoId = prefix.substring(5);
      resultsDir = `${this.repositoriesPath}/${repoId}/results`;
    } else {
      resultsDir = await this.findResultsDirectory();
    }

    let filePath: string;
    if (actualDir.endsWith('.json')) {
      filePath = `${resultsDir}/${actualDir}`;
    } else {
      filePath = `${resultsDir}/${actualDir}/${file}`;
    }

    const exists = await this.fileSystem.exists(filePath);
    if (!exists) {
      throw new FileNotFoundError(filePath);
    }

    try {
      const content = await this.fileSystem.readFile(filePath, 'utf-8');
      return JSON.parse(content as string);
    } catch (error) {
      this.logger.error('Error parsing test result JSON', error as Error, {
        filePath,
      });
      throw new Error(`Invalid JSON in file: ${filePath}`);
    }
  }

  async exists(directory: string): Promise<boolean> {
    try {
      const [prefix, ...rest] = directory.split('/');
      const actualDir = rest.join('/');

      let resultsDir: string;
      if (prefix.startsWith('repo:')) {
        const repoId = prefix.substring(5);
        resultsDir = `${this.repositoriesPath}/${repoId}/results`;
      } else {
        resultsDir = await this.findResultsDirectory();
      }

      const dirPath = actualDir.endsWith('.json')
        ? `${resultsDir}/${actualDir}`
        : `${resultsDir}/${actualDir}`;

      return await this.fileSystem.exists(dirPath);
    } catch {
      return false;
    }
  }

  async ensureDirectoryExists(path: string): Promise<void> {
    const exists = await this.fileSystem.exists(path);
    if (!exists) {
      await this.fileSystem.mkdir(path, true);
      this.logger.info('Created directory', { path });
    }
  }

  private async findResultsDirectory(): Promise<string> {
    const possiblePaths = [
      `${this.config.getK6TestsDir()}/results`,
      this.config.getResultsDir(),
      '/results',
    ];

    for (const resultsPath of possiblePaths) {
      try {
        const exists = await this.fileSystem.exists(resultsPath);
        if (exists) {
          const stats = await this.fileSystem.stat(resultsPath);
          if (stats.isDirectory()) {
            return resultsPath;
          }
        }
      } catch (error) {
        continue;
      }
    }

    const defaultPath = possiblePaths[0];
    try {
      await this.fileSystem.mkdir(defaultPath, true);
    } catch (error) {
      console.error(`Failed to create results directory: ${error}`);
    }
    return defaultPath;
  }

  private extractDateFromDirectoryName(name: string): Date {
    const match = name.match(/(\d{8}_\d{6})/);
    if (match) {
      const dateStr = match[1];
      return this.parseDateTime(dateStr);
    }
    return new Date();
  }

  private extractDateFromFileName(name: string): Date {
    const match = name.match(/^(\d{8})_(\d{6})_/);
    if (match) {
      const dateStr = `${match[1]}_${match[2]}`;
      return this.parseDateTime(dateStr);
    }
    return new Date();
  }

  private parseDateTime(dateTimeStr: string): Date {
    const year = parseInt(dateTimeStr.substr(0, 4));
    const month = parseInt(dateTimeStr.substr(4, 2)) - 1;
    const day = parseInt(dateTimeStr.substr(6, 2));
    const hour = parseInt(dateTimeStr.substr(9, 2));
    const minute = parseInt(dateTimeStr.substr(11, 2));
    const second = parseInt(dateTimeStr.substr(13, 2));

    return new Date(year, month, day, hour, minute, second);
  }
}
