import { ITestResultRepository } from '../../core/interfaces/repositories/ITestResultRepository';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { TestDirectory, TestFile } from '../../core/entities';
import { FileNotFoundError } from '../../core/errors';

export class FileSystemTestResultRepository implements ITestResultRepository {
  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {}

  async findAll(): Promise<TestDirectory[]> {
    try {
      const resultsDir = await this.findResultsDirectory();
      this.logger.debug('Using results directory', { resultsDir });

      const entries = await this.fileSystem.readDir(resultsDir);
      const directories: TestDirectory[] = [];
      const virtualDirectories: TestDirectory[] = [];

      // TYLKO repos - usuwamy duplikację z repositories
      const reposDir = `${this.config.getK6TestsDir()}/repos`;
      const repoExists = await this.fileSystem.exists(reposDir);

      if (repoExists) {
        const repos = await this.fileSystem.readDir(reposDir);
        for (const repo of repos.filter((r) => r.isDirectory())) {
          const repoResultsPath = `${reposDir}/${repo.name}/results`;
          const repoResultsExists = await this.fileSystem.exists(repoResultsPath);

          if (repoResultsExists) {
            try {
              const repoEntries = await this.fileSystem.readDir(repoResultsPath);

              for (const entry of repoEntries) {
                if (entry.isDirectory()) {
                  const date = this.extractDateFromDirectoryName(entry.name);
                  directories.push(
                    new TestDirectory(`${repo.name}/${entry.name}`, entry.path, date, 'directory')
                  );
                } else if (entry.isFile() && entry.name.endsWith('.json')) {
                  const date = this.extractDateFromFileName(entry.name);
                  virtualDirectories.push(
                    new TestDirectory(`${repo.name}/${entry.name}`, entry.path, date, 'virtual')
                  );
                }
              }
            } catch (error) {
              this.logger.warn(`Failed to read results for repository ${repo.name}`, {
                repoName: repo.name,
                error: (error as Error).message,
              });
            }
          }
        }
      }

      // Legacy structure (direct results in main directory)
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const date = this.extractDateFromDirectoryName(entry.name);
          directories.push(new TestDirectory(entry.name, entry.path, date, 'directory'));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          const date = this.extractDateFromFileName(entry.name);
          virtualDirectories.push(new TestDirectory(entry.name, entry.path, date, 'virtual'));
        }
      }

      const allDirs = [...directories, ...virtualDirectories].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      this.logger.info('Found test directories', {
        realDirs: directories.length,
        virtualDirs: virtualDirectories.length,
        total: allDirs.length,
        repoBasedDirs: directories.filter((d) => d.name.includes('/')).length,
      });

      return allDirs;
    } catch (error) {
      this.logger.error('Error fetching test directories', error as Error);
      return [];
    }
  }

  async findByDirectory(directory: string): Promise<TestFile[]> {
    const resultsDir = await this.findResultsDirectory();

    // Handle repository-based paths
    const isRepoPath = directory.includes('/');
    let filePath: string;

    if (isRepoPath) {
      const [repoName, subPath] = directory.split('/', 2);
      const repoResultsPath = `${this.config.getK6TestsDir()}/repos/${repoName}/results`;
      filePath = `${repoResultsPath}/${subPath}`;
    } else {
      filePath = `${resultsDir}/${directory}`;
    }

    if (directory.endsWith('.json') || (isRepoPath && directory.split('/')[1].endsWith('.json'))) {
      const exists = await this.fileSystem.exists(filePath);
      if (!exists) {
        throw new FileNotFoundError(filePath);
      }

      const fileName = directory.split('/').pop() || directory;
      const match = fileName.match(/^\d{8}_\d{6}_(.+)\.json$/);
      const testName = match ? match[1] : fileName.replace('.json', '');

      return [new TestFile(`${testName}.json`, filePath)];
    } else {
      try {
        const entries = await this.fileSystem.readDir(filePath);
        return entries
          .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
          .map((entry) => new TestFile(entry.name, entry.path));
      } catch (error) {
        this.logger.error('Error reading directory files', error as Error, {
          directory,
          filePath,
        });
        throw new FileNotFoundError(filePath);
      }
    }
  }

  async findResult(directory: string, file: string): Promise<any> {
    const resultsDir = await this.findResultsDirectory();
    let filePath: string;

    const isRepoPath = directory.includes('/');

    if (isRepoPath) {
      const [repoName, subPath] = directory.split('/', 2);
      const repoResultsPath = `${this.config.getK6TestsDir()}/repos/${repoName}/results`;

      if (directory.endsWith('.json')) {
        filePath = `${repoResultsPath}/${subPath}`;
      } else {
        filePath = `${repoResultsPath}/${subPath}/${file}`;
      }
    } else {
      if (directory.endsWith('.json')) {
        filePath = `${resultsDir}/${directory}`;
      } else {
        filePath = `${resultsDir}/${directory}/${file}`;
      }
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
      const resultsDir = await this.findResultsDirectory();
      const isRepoPath = directory.includes('/');

      let dirPath: string;
      if (isRepoPath) {
        const [repoName, subPath] = directory.split('/', 2);
        const repoResultsPath = `${this.config.getK6TestsDir()}/repos/${repoName}/results`;
        dirPath = directory.endsWith('.json')
          ? `${repoResultsPath}/${subPath}`
          : `${repoResultsPath}/${subPath}`;
      } else {
        dirPath = directory.endsWith('.json')
          ? `${resultsDir}/${directory}`
          : `${resultsDir}/${directory}`;
      }

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
      this.logger.error(`Failed to create results directory: ${error}`);
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
