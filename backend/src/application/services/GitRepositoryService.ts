import { IRepositoryService } from '../../core/interfaces/services/IRepositoryService';
import { IProcessExecutor } from '../../core/interfaces/external/IProcessExecutor';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class GitRepositoryService implements IRepositoryService {
  private readonly reposDir: string;

  constructor(
    private readonly processExecutor: IProcessExecutor,
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.reposDir = `${this.config.getK6TestsDir()}/repos`;
  }

  async cloneRepository(repoUrl: string, repoName: string): Promise<string> {
    const repoPath = `${this.reposDir}/${repoName}`;

    try {
      // Ensure repos directory exists
      await this.fileSystem.mkdir(this.reposDir, true);

      // Check if repository already exists
      const exists = await this.fileSystem.exists(repoPath);
      if (exists) {
        throw new Error(
          `Repository '${repoName}' already exists. Please choose a different name or delete the existing repository.`
        );
      }

      this.logger.info('Starting git clone operation', {
        repoUrl,
        repoName,
        repoPath,
        reposDir: this.reposDir,
      });

      // Create the target directory first
      await this.fileSystem.mkdir(repoPath, true);

      // Git clone with explicit destination directory
      // Use "." to clone into current directory (repoPath)
      const child = this.processExecutor.spawn('git', ['clone', repoUrl, '.'], {
        cwd: repoPath, // Set working directory to the target path
      });

      return new Promise((resolve, reject) => {
        let stderr = '';
        let stdout = '';

        // Collect stderr output for better error reporting
        if (child.stderr) {
          child.stderr.on('data', (data: any) => {
            stderr += data.toString();
          });
        }

        // Collect stdout output for logging
        if (child.stdout) {
          child.stdout.on('data', (data: any) => {
            stdout += data.toString();
          });
        }

        // Handle process errors (like git not found)
        child.on('error', (error) => {
          this.logger.error('Git process error', error, {
            repoUrl,
            repoName,
            repoPath,
            errorCode: error.code || 'unknown',
            errorMessage: error.message,
          });

          if (error.code === 'ENOENT') {
            reject(
              new Error(
                'Git is not installed or not found in PATH. Please ensure git is installed in the system.'
              )
            );
          } else {
            reject(new Error(`Git process error: ${error.message}`));
          }
        });

        child.on('close', async (code) => {
          if (code === 0) {
            this.logger.info('Git clone completed successfully', {
              repoName,
              repoPath,
              stdout: stdout.substring(0, 500), // Log first 500 chars
            });

            // Verify that files were actually cloned
            try {
              const entries = await this.fileSystem.readDir(repoPath);
              const files = entries.filter((e) => e.isFile()).map((e) => e.name);
              const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

              this.logger.info('Repository contents after clone', {
                repoName,
                fileCount: files.length,
                dirCount: dirs.length,
                sampleFiles: files.slice(0, 5),
                sampleDirs: dirs.slice(0, 5),
              });

              // Ensure results directory is created
              await this.ensureResultsDirectory(repoName);
              resolve(repoPath);
            } catch (resultsError) {
              this.logger.warn('Failed to create results directory, but clone succeeded', {
                repoName,
                error: (resultsError as Error).message,
              });
              resolve(repoPath); // Still resolve since clone succeeded
            }
          } else {
            this.logger.error('Git clone failed', new Error(`Git clone exited with code ${code}`), {
              repoUrl,
              repoName,
              repoPath,
              exitCode: code,
              stderr: stderr.substring(0, 1000), // Log first 1000 chars of error
              stdout: stdout.substring(0, 500),
            });

            // Clean up the empty directory
            try {
              await this.fileSystem.stat(repoPath);
              // Directory exists, try to remove it if empty
              const entries = await this.fileSystem.readDir(repoPath);
              if (entries.length === 0) {
                // Directory is empty, we can remove it (Note: this requires additional filesystem method)
                this.logger.debug('Cleaning up empty directory after failed clone', { repoPath });
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }

            // Provide user-friendly error messages
            let errorMessage = `Git clone failed with exit code ${code}`;

            if (stderr.includes('not found') || stderr.includes('does not exist')) {
              errorMessage = `Repository not found: ${repoUrl}. Please check the URL and ensure the repository exists and is accessible.`;
            } else if (stderr.includes('Permission denied') || stderr.includes('authentication')) {
              errorMessage = `Permission denied. Please check if you have access to the repository: ${repoUrl}`;
            } else if (stderr.includes('already exists')) {
              errorMessage = `Directory already exists. Please choose a different repository name.`;
            } else if (stderr) {
              errorMessage = `Git clone failed: ${stderr.split('\n')[0]}`; // First line of error
            }

            reject(new Error(errorMessage));
          }
        });
      });
    } catch (error) {
      this.logger.error('Failed to clone repository', error as Error, {
        repoUrl,
        repoName,
        repoPath,
      });
      throw error;
    }
  }

  async updateRepository(repoName: string): Promise<void> {
    const repoPath = `${this.reposDir}/${repoName}`;

    try {
      // Check if repository exists
      const exists = await this.fileSystem.exists(repoPath);
      if (!exists) {
        throw new Error(`Repository '${repoName}' not found. Please clone it first.`);
      }

      this.logger.info('Starting git pull operation', { repoName, repoPath });

      const child = this.processExecutor.spawn('git', ['pull'], {
        cwd: repoPath,
      });

      return new Promise((resolve, reject) => {
        let stderr = '';
        let stdout = '';

        // Collect output for logging
        if (child.stderr) {
          child.stderr.on('data', (data: any) => {
            stderr += data.toString();
          });
        }

        if (child.stdout) {
          child.stdout.on('data', (data: any) => {
            stdout += data.toString();
          });
        }

        child.on('error', (error) => {
          this.logger.error('Git pull process error', error, { repoName, repoPath });

          if (error.code === 'ENOENT') {
            reject(new Error('Git is not installed or not found in PATH.'));
          } else {
            reject(new Error(`Git process error: ${error.message}`));
          }
        });

        child.on('close', (code) => {
          if (code === 0) {
            this.logger.info('Git pull completed successfully', {
              repoName,
              stdout: stdout.substring(0, 500),
            });
            resolve();
          } else {
            this.logger.error('Git pull failed', new Error(`Git pull exited with code ${code}`), {
              repoName,
              repoPath,
              exitCode: code,
              stderr: stderr.substring(0, 1000),
              stdout: stdout.substring(0, 500),
            });

            let errorMessage = `Git pull failed with exit code ${code}`;
            if (stderr) {
              errorMessage = `Git pull failed: ${stderr.split('\n')[0]}`;
            }

            reject(new Error(errorMessage));
          }
        });
      });
    } catch (error) {
      this.logger.error('Failed to update repository', error as Error, {
        repoName,
        repoPath,
      });
      throw error;
    }
  }

  async getRepositories(): Promise<string[]> {
    try {
      await this.fileSystem.mkdir(this.reposDir, true);
      const entries = await this.fileSystem.readDir(this.reposDir);
      const repositories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      this.logger.debug('Found repositories', { count: repositories.length, repositories });
      return repositories;
    } catch (error) {
      this.logger.error('Failed to get repositories list', error as Error, {
        reposDir: this.reposDir,
      });
      return [];
    }
  }

  async getRepositoryConfig(repoName: string): Promise<any> {
    const configPath = `${this.reposDir}/${repoName}/config/env.js`;
    try {
      const exists = await this.fileSystem.exists(configPath);
      if (!exists) {
        this.logger.warn('Config file not found for repository', { repoName, configPath });
        return null;
      }

      const content = await this.fileSystem.readFile(configPath, 'utf-8');
      const cleanContent = content
        .toString()
        .replace(/export const/g, 'const')
        .replace(/export {.*}/g, '');

      const result = {};
      eval(cleanContent + '; Object.assign(result, { HOSTS, TOKENS, LOAD_PROFILES })');

      this.logger.debug('Loaded repository config', { repoName, configKeys: Object.keys(result) });
      return result;
    } catch (error) {
      this.logger.warn('Failed to load config for repository', {
        repoName,
        configPath,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async ensureResultsDirectory(repoName: string): Promise<void> {
    const resultsPath = `${this.reposDir}/${repoName}/results`;
    try {
      await this.fileSystem.mkdir(resultsPath, true);
      this.logger.debug('Ensured results directory exists', { repoName, resultsPath });
    } catch (error) {
      this.logger.error('Failed to create results directory', error as Error, {
        repoName,
        resultsPath,
      });
      throw error;
    }
  }
}
