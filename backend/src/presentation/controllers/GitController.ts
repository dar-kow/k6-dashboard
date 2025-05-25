import { Request, Response, NextFunction } from 'express';
import { IProcessExecutor } from '../../core/interfaces/external/IProcessExecutor';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class GitController {
  constructor(
    private readonly processExecutor: IProcessExecutor,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {}

  refreshTests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.info('Starting k6 tests repository refresh');

      const repoUrl =
        this.config.get<string>('K6_TESTS_REPO_URL') ||
        process.env.K6_TESTS_REPO_URL ||
        'https://github.com/dar-kow/k6-tests.git';

      const k6TestsDir = '/k6-tests';

      // Check if directory exists and has git
      const checkGitProcess = this.processExecutor.spawn(
        'sh',
        ['-c', `cd ${k6TestsDir} && git status`],
        {
          cwd: k6TestsDir,
        }
      );

      let isGitRepo = false;

      checkGitProcess.on('close', async (code: number) => {
        isGitRepo = code === 0;

        if (isGitRepo) {
          // Git pull if it's already a git repository
          this.logger.info('Pulling latest changes from repository');

          const pullProcess = this.processExecutor.spawn('git', ['pull', 'origin', 'main'], {
            cwd: k6TestsDir,
          });

          let output = '';
          let errorOutput = '';

          pullProcess.stdout?.on('data', (data: Buffer) => {
            output += data.toString();
          });

          pullProcess.stderr?.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });

          pullProcess.on('close', (pullCode: number) => {
            if (pullCode === 0) {
              this.logger.info('Successfully pulled latest tests', { output });
              res.json({
                success: true,
                message: 'K6 tests updated successfully',
                action: 'pull',
                output: output,
                repoUrl: repoUrl,
              });
            } else {
              this.logger.error('Failed to pull repository', new Error(errorOutput));
              res.status(500).json({
                success: false,
                message: 'Failed to update tests',
                error: errorOutput,
                repoUrl: repoUrl,
              });
            }
          });

          pullProcess.on('error', (error: Error) => {
            this.logger.error('Git pull process error', error);
            res.status(500).json({
              success: false,
              message: 'Failed to execute git pull',
              error: error.message,
            });
          });
        } else {
          // Clone repository if it's not a git repo
          this.logger.info('Cloning repository', { repoUrl });

          // Remove existing directory and clone fresh
          const cloneProcess = this.processExecutor.spawn(
            'sh',
            ['-c', `rm -rf ${k6TestsDir} && git clone ${repoUrl} ${k6TestsDir}`],
            {}
          );

          let output = '';
          let errorOutput = '';

          cloneProcess.stdout?.on('data', (data: Buffer) => {
            output += data.toString();
          });

          cloneProcess.stderr?.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });

          cloneProcess.on('close', (cloneCode: number) => {
            if (cloneCode === 0) {
              this.logger.info('Successfully cloned repository', { output });
              res.json({
                success: true,
                message: 'K6 tests repository cloned successfully',
                action: 'clone',
                output: output,
                repoUrl: repoUrl,
              });
            } else {
              this.logger.error('Failed to clone repository', new Error(errorOutput));
              res.status(500).json({
                success: false,
                message: 'Failed to clone tests repository',
                error: errorOutput,
                repoUrl: repoUrl,
              });
            }
          });

          cloneProcess.on('error', (error: Error) => {
            this.logger.error('Git clone process error', error);
            res.status(500).json({
              success: false,
              message: 'Failed to execute git clone',
              error: error.message,
            });
          });
        }
      });

      checkGitProcess.on('error', (error: Error) => {
        // If git status fails, assume it's not a git repo and clone
        this.refreshByClone(repoUrl, k6TestsDir, res);
      });
    } catch (error) {
      this.logger.error('Error in refresh tests', error as Error);
      next(error);
    }
  };

  private refreshByClone = (repoUrl: string, k6TestsDir: string, res: Response) => {
    this.logger.info('Cloning repository (fallback)', { repoUrl });

    const cloneProcess = this.processExecutor.spawn(
      'sh',
      ['-c', `rm -rf ${k6TestsDir} && git clone ${repoUrl} ${k6TestsDir}`],
      {}
    );

    let output = '';
    let errorOutput = '';

    cloneProcess.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    cloneProcess.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    cloneProcess.on('close', (cloneCode: number) => {
      if (cloneCode === 0) {
        this.logger.info('Successfully cloned repository (fallback)', { output });
        res.json({
          success: true,
          message: 'K6 tests repository cloned successfully',
          action: 'clone',
          output: output,
          repoUrl: repoUrl,
        });
      } else {
        this.logger.error('Failed to clone repository (fallback)', new Error(errorOutput));
        res.status(500).json({
          success: false,
          message: 'Failed to clone tests repository',
          error: errorOutput,
          repoUrl: repoUrl,
        });
      }
    });
  };

  getRepoStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repoUrl =
        this.config.get<string>('K6_TESTS_REPO_URL') ||
        process.env.K6_TESTS_REPO_URL ||
        'https://github.com/dar-kow/k6-tests.git';

      const k6TestsDir = '/k6-tests';

      // Get git status and last commit info
      const statusProcess = this.processExecutor.spawn(
        'sh',
        ['-c', `cd ${k6TestsDir} && git log -1 --format="%H|%an|%ad|%s" --date=iso`],
        {}
      );

      let output = '';
      let errorOutput = '';

      statusProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      statusProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      statusProcess.on('close', (code: number) => {
        if (code === 0 && output.trim()) {
          const [hash, author, date, message] = output.trim().split('|');
          res.json({
            success: true,
            repoUrl: repoUrl,
            lastCommit: {
              hash: hash?.substring(0, 8),
              author: author,
              date: date,
              message: message,
            },
          });
        } else {
          res.json({
            success: false,
            repoUrl: repoUrl,
            message: 'No git repository found or empty repository',
            error: errorOutput,
          });
        }
      });
    } catch (error) {
      this.logger.error('Error getting repo status', error as Error);
      next(error);
    }
  };
}
