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

  async deleteRepository(repoName: string): Promise<void> {
    const repoPath = `${this.reposDir}/${repoName}`;

    try {
      // Check if repository exists
      const exists = await this.fileSystem.exists(repoPath);
      if (!exists) {
        throw new Error(`Repository '${repoName}' not found.`);
      }

      this.logger.info('Starting repository deletion', { repoName, repoPath });

      // Use rm -rf to delete the repository directory
      // This is platform dependent - for production consider using a proper directory deletion method
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
          this.logger.error('Repository deletion process error', error, { repoName, repoPath });
          reject(new Error(`Failed to delete repository: ${error.message}`));
        });

        child.on('close', (code) => {
          if (code === 0) {
            this.logger.info('Repository deleted successfully', { repoName, repoPath });
            resolve();
          } else {
            this.logger.error(
              'Repository deletion failed',
              new Error(`rm command exited with code ${code}`),
              {
                repoName,
                repoPath,
                exitCode: code,
                stderr: stderr.substring(0, 1000),
              }
            );

            reject(new Error(`Failed to delete repository: ${stderr || `Exit code ${code}`}`));
          }
        });
      });
    } catch (error) {
      this.logger.error('Failed to delete repository', error as Error, {
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

      // Enhanced parsing for env.js files
      const config = this.parseEnvJsFile(content.toString(), repoName);

      if (config) {
        this.logger.debug('Loaded repository config', {
          repoName,
          configKeys: Object.keys(config),
          hostsCount: config.HOSTS ? Object.keys(config.HOSTS).length : 0,
          tokensCount: config.TOKENS ? Object.keys(config.TOKENS).length : 0,
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
        console: { log: () => {}, warn: () => {}, error: () => {} }, // Disable console in eval
      };

      // Use Function constructor instead of eval for better isolation
      const func = new Function(
        'HOSTS',
        'TOKENS',
        'LOAD_PROFILES',
        'console',
        cleanContent + '\n; return { HOSTS, TOKENS, LOAD_PROFILES };'
      );

      const result = func(context.HOSTS, context.TOKENS, context.LOAD_PROFILES, context.console);

      // Validate the result structure
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
      this.logger.error('Failed to parse env.js file', error as Error, {
        repoName,
        contentPreview: content.substring(0, 200),
      });

      // Try a simpler regex-based parsing as fallback
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

      // Extract TOKENS object (more complex structure)
      const tokensMatch = content.match(/const\s+TOKENS\s*=\s*(\{[\s\S]*?\n\};)/);
      if (tokensMatch) {
        try {
          // This is a simplified approach - might need more sophisticated parsing
          const tokensStr = tokensMatch[1]
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/}\s*;/, '}');
          result.TOKENS = JSON.parse(tokensStr);
        } catch (e) {
          this.logger.warn('Failed to parse TOKENS from env.js', { repoName });
        }
      }

      // Extract LOAD_PROFILES object
      const profilesMatch = content.match(/const\s+LOAD_PROFILES\s*=\s*(\{[\s\S]*?\n\};)/);
      if (profilesMatch) {
        try {
          const profilesStr = profilesMatch[1]
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/}\s*;/, '}');
          result.LOAD_PROFILES = JSON.parse(profilesStr);
        } catch (e) {
          this.logger.warn('Failed to parse LOAD_PROFILES from env.js', { repoName });
        }
      }

      this.logger.debug('Parsed env.js with regex fallback', {
        repoName,
        hasHosts: Object.keys(result.HOSTS).length > 0,
        hasTokens: Object.keys(result.TOKENS).length > 0,
        hasProfiles: Object.keys(result.LOAD_PROFILES).length > 0,
      });

      return result;
    } catch (error) {
      this.logger.error('Regex parsing of env.js also failed', error as Error, {
        repoName,
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
