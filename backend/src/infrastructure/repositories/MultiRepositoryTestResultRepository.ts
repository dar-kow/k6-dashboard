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
          const repoDirs = await this.getDirectoriesFromPath(repoResultsDir, repositoryId);
          directories.push(...repoDirs);
        }
      } else {
        const defaultResultsDir = await this.findDefaultResultsDirectory();
        const defaultDirs = await this.getDirectoriesFromPath(defaultResultsDir, 'default');
        directories.push(...defaultDirs);

        if (await this.fileSystem.exists(this.repositoriesPath)) {
          const repos = await this.fileSystem.readDir(this.repositoriesPath);
          for (const repo of repos) {
            if (repo.isDirectory()) {
              const repoResultsDir = `${repo.path}/results`;
              if (await this.fileSystem.exists(repoResultsDir)) {
                const repoDirs = await this.getDirectoriesFromPath(repoResultsDir, repo.name);
                directories.push(...repoDirs);
              }
            }
          }
        }
      }

      const allDirs = directories.sort((a, b) => b.date.getTime() - a.date.getTime());

      this.logger.info('Found test directories', {
        total: allDirs.length,
        repositoryId: repositoryId || 'all',
      });

      return allDirs;
    } catch (error) {
      this.logger.error('Error fetching test directories', error as Error);
      return [];
    }
  }

  private async getDirectoriesFromPath(
    path: string,
    repositoryId: string
  ): Promise<TestDirectory[]> {
    const entries = await this.fileSystem.readDir(path);
    const directories: TestDirectory[] = [];
    const virtualDirectories: TestDirectory[] = [];

    console.log(`🔍 Processing path: ${path} for repositoryId: ${repositoryId}`);

    // 🔧 POPRAWKA: Lepsze logowanie repository metadata
    let repositoryName: string | undefined;
    let actualRepositoryId: string | undefined;

    if (repositoryId !== 'default') {
      try {
        // Użyj absolutnej ścieżki do repositories.json
        const repositoriesMetaPath = `${this.repositoriesPath}/repositories.json`;
        console.log(`📋 Looking for repositories metadata at: ${repositoriesMetaPath}`);

        const metaExists = await this.fileSystem.exists(repositoriesMetaPath);
        console.log(`📋 Repositories metadata exists: ${metaExists}`);

        if (metaExists) {
          const content = await this.fileSystem.readFile(repositoriesMetaPath, 'utf-8');
          console.log(
            `📋 Raw repositories.json content (first 200 chars):`,
            (content as string).substring(0, 200)
          );

          try {
            const reposData = JSON.parse(content as string);
            console.log(`📋 Parsed repositories data:`, {
              isArray: Array.isArray(reposData),
              length: Array.isArray(reposData) ? reposData.length : 'N/A',
              repositories: Array.isArray(reposData)
                ? reposData.map((r) => ({ id: r.id, name: r.name }))
                : 'Not array',
            });

            const repoInfo = reposData.find((r: any) => r.id === repositoryId);
            console.log(`📋 Looking for repositoryId: ${repositoryId}`);
            console.log(`📋 Found repository info:`, repoInfo);

            if (repoInfo) {
              repositoryName = repoInfo.name;
              actualRepositoryId = repoInfo.id;
              console.log(`✅ Repository resolved: ${repositoryName} (ID: ${actualRepositoryId})`);
            } else {
              console.warn(`⚠️ Repository ${repositoryId} not found in metadata`);
              console.warn(
                `⚠️ Available repositories:`,
                reposData.map((r: any) => r.id)
              );
            }
          } catch (parseError) {
            console.error(`❌ Error parsing repositories.json:`, parseError);
            console.error(`❌ Content that failed to parse:`, content);
          }
        } else {
          console.warn(`⚠️ Repositories metadata file not found at ${repositoriesMetaPath}`);

          // 🔧 POPRAWKA: Sprawdź czy katalog repositories w ogóle istnieje
          const reposDirExists = await this.fileSystem.exists(this.repositoriesPath);
          console.warn(
            `⚠️ Repositories directory exists: ${reposDirExists} at ${this.repositoriesPath}`
          );

          if (reposDirExists) {
            try {
              const repoEntries = await this.fileSystem.readDir(this.repositoriesPath);
              console.warn(
                `⚠️ Contents of repositories directory:`,
                repoEntries.map((e) => ({
                  name: e.name,
                  isDir: e.isDirectory(),
                  isFile: e.isFile(),
                }))
              );
            } catch (dirError) {
              console.error(`❌ Error reading repositories directory:`, dirError);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error loading repository metadata:`, error);
      }
    } else {
      repositoryName = 'Default Tests';
      console.log(`📋 Using default repository name: ${repositoryName}`);
    }

    console.log(
      `🏷️ Final repository info: name="${repositoryName}", id="${actualRepositoryId || repositoryId}"`
    );

    // Process real directories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const date = this.extractDateFromDirectoryName(entry.name);
        const directory = new TestDirectory(
          `${repositoryId}/${entry.name}`,
          entry.path,
          date,
          'directory',
          actualRepositoryId || repositoryId,
          repositoryName
        );
        directories.push(directory);
        console.log(`📁 Created real directory:`, {
          name: directory.name,
          repositoryName: directory.repositoryName,
          repositoryId: directory.repositoryId,
        });
      }
    }

    // Process virtual directories (single JSON files)
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const date = this.extractDateFromFileName(entry.name);
        const directory = new TestDirectory(
          `${repositoryId}/${entry.name}`,
          entry.path,
          date,
          'virtual',
          actualRepositoryId || repositoryId,
          repositoryName
        );
        virtualDirectories.push(directory);
        console.log(`📄 Created virtual directory:`, {
          name: directory.name,
          repositoryName: directory.repositoryName,
          repositoryId: directory.repositoryId,
          testName: directory.getTestName(),
        });
      }
    }

    const allDirs = [...directories, ...virtualDirectories];
    console.log(`📊 Final directories summary:`, {
      repositoryId: actualRepositoryId || repositoryId,
      repositoryName,
      totalDirs: allDirs.length,
      realDirs: directories.length,
      virtualDirs: virtualDirectories.length,
    });

    return allDirs;
  }

  async findByDirectory(directory: string): Promise<TestFile[]> {
    this.logger.debug('Finding files in directory', { directory });

    const [repositoryId, ...rest] = directory.split('/');
    const actualDir = rest.join('/');

    let resultsDir: string;
    if (repositoryId === 'default') {
      resultsDir = await this.findDefaultResultsDirectory();
    } else {
      resultsDir = `${this.repositoriesPath}/${repositoryId}/results`;
    }

    this.logger.debug('Resolved paths', {
      directory,
      repositoryId,
      actualDir,
      resultsDir,
    });

    if (actualDir.endsWith('.json')) {
      const filePath = `${resultsDir}/${actualDir}`;

      if (!(await this.fileSystem.exists(filePath))) {
        throw new FileNotFoundError(filePath);
      }

      const testName = actualDir.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
      return [new TestFile(`${testName}.json`, filePath)];
    }
    // Real directory
    else {
      const dirPath = `${resultsDir}/${actualDir}`;
      const entries = await this.fileSystem.readDir(dirPath);

      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => new TestFile(entry.name, entry.path));
    }
  }

  async findResult(directory: string, file: string): Promise<any> {
    this.logger.debug('Finding result', { directory, file });

    const [repositoryId, ...rest] = directory.split('/');
    const actualDir = rest.join('/');

    let resultsDir: string;
    if (repositoryId === 'default') {
      resultsDir = await this.findDefaultResultsDirectory();
    } else {
      resultsDir = `${this.repositoriesPath}/${repositoryId}/results`;
    }

    let filePath: string;
    if (actualDir.endsWith('.json')) {
      filePath = `${resultsDir}/${actualDir}`;
    } else {
      filePath = `${resultsDir}/${actualDir}/${file}`;
    }

    this.logger.debug('Resolved file path', {
      directory,
      file,
      repositoryId,
      actualDir,
      filePath,
    });

    if (!(await this.fileSystem.exists(filePath))) {
      throw new FileNotFoundError(filePath);
    }

    try {
      const content = await this.fileSystem.readFile(filePath, 'utf-8');
      return JSON.parse(content as string);
    } catch (error) {
      this.logger.error('Error parsing JSON', error as Error, { filePath });
      throw new Error(`Invalid JSON in file: ${filePath}`);
    }
  }

  async exists(directory: string): Promise<boolean> {
    try {
      const [repositoryId, ...rest] = directory.split('/');
      const actualDir = rest.join('/');

      let resultsDir: string;
      if (repositoryId === 'default') {
        resultsDir = await this.findDefaultResultsDirectory();
      } else {
        resultsDir = `${this.repositoriesPath}/${repositoryId}/results`;
      }

      const targetPath = actualDir.endsWith('.json')
        ? `${resultsDir}/${actualDir}`
        : `${resultsDir}/${actualDir}`;

      return await this.fileSystem.exists(targetPath);
    } catch {
      return false;
    }
  }

  async ensureDirectoryExists(path: string): Promise<void> {
    if (!(await this.fileSystem.exists(path))) {
      await this.fileSystem.mkdir(path, true);
      this.logger.info('Created directory', { path });
    }
  }

  private async findDefaultResultsDirectory(): Promise<string> {
    const possiblePaths = [
      `${this.config.getK6TestsDir()}/results`,
      this.config.getResultsDir(),
      '/results',
    ];

    for (const path of possiblePaths) {
      try {
        if (await this.fileSystem.exists(path)) {
          const stats = await this.fileSystem.stat(path);
          if (stats.isDirectory()) {
            return path;
          }
        }
      } catch {
        continue;
      }
    }

    const defaultPath = possiblePaths[0];
    await this.fileSystem.mkdir(defaultPath, true);
    return defaultPath;
  }

  private extractDateFromDirectoryName(name: string): Date {
    const match = name.match(/(\d{8}_\d{6})/);
    if (match) {
      return this.parseDateTime(match[1]);
    }
    return new Date();
  }

  private extractDateFromFileName(name: string): Date {
    const match = name.match(/^(\d{8})_(\d{6})_/);
    if (match) {
      return this.parseDateTime(`${match[1]}_${match[2]}`);
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
