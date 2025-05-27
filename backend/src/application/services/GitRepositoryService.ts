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
    // TYLKO repos - usuwamy duplikację
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

      const child = this.processExecutor.spawn('git', ['clone', repoUrl, '.'], {
        cwd: repoPath,
      });

      return new Promise((resolve, reject) => {
        let stderr = '';
        let stdout = '';

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
          this.logger.error('Git process error', error, {
            repoUrl,
            repoName,
            repoPath,
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
            this.logger.info('Git clone completed successfully', { repoName, repoPath });

            try {
              // Verify clone and create results directory
              const entries = await this.fileSystem.readDir(repoPath);
              this.logger.info('Repository contents after clone', {
                repoName,
                fileCount: entries.filter((e) => e.isFile()).length,
                dirCount: entries.filter((e) => e.isDirectory()).length,
              });

              await this.ensureResultsDirectory(repoName);
              resolve(repoPath);
            } catch (resultsError) {
              this.logger.warn('Failed to create results directory, but clone succeeded', {
                repoName,
                error: (resultsError as Error).message,
              });
              resolve(repoPath);
            }
          } else {
            this.logger.error('Git clone failed', new Error(`Git clone exited with code ${code}`), {
              repoUrl,
              repoName,
              exitCode: code,
              stderr: stderr.substring(0, 1000),
            });

            let errorMessage = `Git clone failed with exit code ${code}`;
            if (stderr.includes('not found') || stderr.includes('does not exist')) {
              errorMessage = `Repository not found: ${repoUrl}. Please check the URL.`;
            } else if (stderr.includes('Permission denied') || stderr.includes('authentication')) {
              errorMessage = `Permission denied. Please check access to: ${repoUrl}`;
            } else if (stderr.includes('already exists')) {
              errorMessage = `Directory already exists. Choose a different repository name.`;
            } else if (stderr) {
              errorMessage = `Git clone failed: ${stderr.split('\n')[0]}`;
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
          reject(new Error(`Git process error: ${error.message}`));
        });

        child.on('close', (code) => {
          if (code === 0) {
            this.logger.info('Git pull completed successfully', { repoName });
            resolve();
          } else {
            this.logger.error('Git pull failed', new Error(`Exit code ${code}`), { repoName });
            const errorMessage = stderr
              ? `Git pull failed: ${stderr.split('\n')[0]}`
              : `Git pull failed with exit code ${code}`;
            reject(new Error(errorMessage));
          }
        });
      });
    } catch (error) {
      this.logger.error('Failed to update repository', error as Error, { repoName });
      throw error;
    }
  }

  async deleteRepository(repoName: string): Promise<void> {
    const repoPath = `${this.reposDir}/${repoName}`;

    try {
      const exists = await this.fileSystem.exists(repoPath);
      if (!exists) {
        throw new Error(`Repository '${repoName}' not found.`);
      }

      this.logger.info('Starting repository deletion', { repoName, repoPath });

      // Use rm -rf to delete the repository directory
      const child = this.processExecutor.spawn('rm', ['-rf', repoPath], {
        cwd: this.reposDir,
      });

      return new Promise((resolve, reject) => {
        let stderr = '';

        if (child.stderr) {
          child.stderr.on('data', (data: any) => {
            stderr += data.toString();
          });
        }

        child.on('error', (error) => {
          this.logger.error('Repository deletion process error', error, { repoName });
          reject(new Error(`Failed to delete repository: ${error.message}`));
        });

        child.on('close', (code) => {
          if (code === 0) {
            this.logger.info('Repository deleted successfully', { repoName });
            resolve();
          } else {
            this.logger.error('Repository deletion failed', new Error(`Exit code ${code}`), {
              repoName,
              stderr,
            });
            reject(new Error(`Failed to delete repository: ${stderr || `Exit code ${code}`}`));
          }
        });
      });
    } catch (error) {
      this.logger.error('Failed to delete repository', error as Error, { repoName });
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
      const config = this.parseEnvJsFile(content.toString(), repoName);

      if (config) {
        this.logger.debug('Loaded repository config', {
          repoName,
          configKeys: Object.keys(config),
        });
      }

      return config;
    } catch (error) {
      this.logger.error('Failed to load config for repository', error as Error, {
        repoName,
        configPath,
      });
      return null;
    }
  }

  private parseEnvJsFile(content: string, repoName: string): any {
    try {
      // Remove comments and clean up the content
      let cleanContent = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/export\s+const\s+/g, 'const ') // Replace export const with const
        .replace(/export\s+\{[^}]*\}/g, ''); // Remove export statements

      // Create a safe evaluation context
      const context = {
        HOSTS: {},
        TOKENS: {},
        LOAD_PROFILES: {},
        console: { log: () => {}, warn: () => {}, error: () => {} },
      };

      // Use Function constructor for better isolation
      const func = new Function(
        'HOSTS',
        'TOKENS',
        'LOAD_PROFILES',
        'console',
        cleanContent + '\n; return { HOSTS, TOKENS, LOAD_PROFILES };'
      );

      const result = func(context.HOSTS, context.TOKENS, context.LOAD_PROFILES, context.console);

      if (typeof result === 'object' && result !== null) {
        return {
          HOSTS: result.HOSTS || {},
          TOKENS: result.TOKENS || {},
          LOAD_PROFILES: result.LOAD_PROFILES || {},
        };
      }

      this.logger.warn('Invalid config structure returned from env.js', { repoName });
      return null;
    } catch (error) {
      this.logger.error('Failed to parse env.js file', error as Error, { repoName });
      return this.parseEnvJsWithRegex(content, repoName);
    }
  }

  private parseEnvJsWithRegex(content: string, repoName: string): any {
    try {
      const result: any = {
        HOSTS: {},
        TOKENS: {},
        LOAD_PROFILES: {},
      };

      // Extract HOSTS object
      const hostsMatch = content.match(/const\s+HOSTS\s*=\s*(\{[^}]*\})/s);
      if (hostsMatch) {
        try {
          result.HOSTS = JSON.parse(hostsMatch[1].replace(/'/g, '"'));
        } catch (e) {
          this.logger.warn('Failed to parse HOSTS from env.js', { repoName });
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Regex parsing of env.js also failed', error as Error, { repoName });
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
