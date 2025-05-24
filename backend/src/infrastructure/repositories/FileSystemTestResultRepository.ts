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
      console.log(`Using results directory: ${resultsDir}`);

      const entries = await this.fileSystem.readDir(resultsDir);
      console.log(`Found ${entries.length} entries in results directory`);

      const directories: TestDirectory[] = [];
      const virtualDirectories: TestDirectory[] = [];

      // Process real directories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          console.log(`Processing directory: ${entry.name}`);
          const date = this.extractDateFromDirectoryName(entry.name);
          directories.push(new TestDirectory(entry.name, entry.path, date, 'directory'));
        }
      }

      // Process virtual directories (single JSON files)
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          console.log(`Processing JSON file: ${entry.name}`);
          const date = this.extractDateFromFileName(entry.name);
          virtualDirectories.push(new TestDirectory(entry.name, entry.path, date, 'virtual'));
        }
      }

      // Sort by date descending
      const allDirs = [...directories, ...virtualDirectories].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      this.logger.info('Found test directories', {
        realDirs: directories.length,
        virtualDirs: virtualDirectories.length,
        total: allDirs.length,
      });

      console.log(
        `Found ${allDirs.length} result directories (${directories.length} real + ${virtualDirectories.length} virtual)`
      );
      return allDirs;
    } catch (error) {
      this.logger.error('Error fetching test directories', error as Error);
      console.error('Error fetching test directories:', error);
      return [];
    }
  }

  async findByDirectory(directory: string): Promise<TestFile[]> {
    const resultsDir = await this.findResultsDirectory();

    if (directory.endsWith('.json')) {
      // Virtual directory - single file
      const filePath = `${resultsDir}/${directory}`;
      const exists = await this.fileSystem.exists(filePath);

      if (!exists) {
        throw new FileNotFoundError(filePath);
      }

      const match = directory.match(/^\d{8}_\d{6}_(.+)\.json$/);
      const testName = match ? match[1] : directory.replace('.json', '');

      return [new TestFile(`${testName}.json`, filePath)];
    } else {
      // Real directory
      const dirPath = `${resultsDir}/${directory}`;
      const entries = await this.fileSystem.readDir(dirPath);

      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => new TestFile(entry.name, entry.path));
    }
  }

  async findResult(directory: string, file: string): Promise<any> {
    const resultsDir = await this.findResultsDirectory();
    let filePath: string;

    if (directory.endsWith('.json')) {
      // Virtual directory
      filePath = `${resultsDir}/${directory}`;
    } else {
      // Real directory
      filePath = `${resultsDir}/${directory}/${file}`;
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
      const dirPath = directory.endsWith('.json')
        ? `${resultsDir}/${directory}`
        : `${resultsDir}/${directory}`;

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
    // Zgodnie ze starym kodem: POSSIBLE_RESULTS_PATHS
    const possiblePaths = [
      `${this.config.getK6TestsDir()}/results`, // k6-tests/results
      this.config.getResultsDir(), // z konfiguracji
      '/results', // Docker volume mount
    ];

    console.log('Checking possible results paths:', possiblePaths);

    for (const resultsPath of possiblePaths) {
      try {
        const exists = await this.fileSystem.exists(resultsPath);
        if (exists) {
          const stats = await this.fileSystem.stat(resultsPath);
          if (stats.isDirectory()) {
            console.log(`Found results directory: ${resultsPath}`);
            return resultsPath;
          }
        }
      } catch (error) {
        console.log(`Path ${resultsPath} not accessible:`, error);
        continue;
      }
    }

    // If no existing directory found, create the first one
    const defaultPath = possiblePaths[0];
    try {
      await this.fileSystem.mkdir(defaultPath, true);
      console.log(`Created results directory: ${defaultPath}`);
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
