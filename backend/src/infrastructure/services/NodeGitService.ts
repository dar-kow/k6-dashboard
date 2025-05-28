import { exec } from 'child_process';
import { promisify } from 'util';
import { IGitService } from '../../core/interfaces/services/IGitServices';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';

const execAsync = promisify(exec);

export class NodeGitService implements IGitService {
  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly logger: ILogger
  ) {}

  async clone(url: string, targetPath: string, branch: string = 'main'): Promise<void> {
    try {
      const command = `git clone -b ${branch} ${url} ${targetPath}`;
      await execAsync(command);
      this.logger.info('Repository cloned successfully', { url, targetPath, branch });
    } catch (error) {
      this.logger.error('Failed to clone repository', error as Error);
      throw new Error(`Failed to clone repository: ${(error as Error).message}`);
    }
  }

  async pull(repoPath: string): Promise<void> {
    try {
      await execAsync('git pull', { cwd: repoPath });
      this.logger.info('Repository pulled successfully', { repoPath });
    } catch (error) {
      this.logger.error('Failed to pull repository', error as Error);
      throw new Error(`Failed to pull repository: ${(error as Error).message}`);
    }
  }

  async exists(repoPath: string): Promise<boolean> {
    const gitPath = `${repoPath}/.git`;
    return await this.fileSystem.exists(gitPath);
  }
}
