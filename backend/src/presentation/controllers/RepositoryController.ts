import { Request, Response, NextFunction } from 'express';
import { IRepositoryService } from '../../core/interfaces/services/IRepositoryService';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { CloneRepositoryDto, RepositoryDto } from '../../application/dto/TestExecutionDto';

export class RepositoryController {
  constructor(
    private readonly repositoryService: IRepositoryService,
    private readonly fileSystem: IFileSystem,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {}

  getRepositories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const repositories = await this.repositoryService.getRepositories();
      const result: RepositoryDto[] = [];

      for (const repoName of repositories) {
        try {
          const config = await this.repositoryService.getRepositoryConfig(repoName);
          const tests = await this.getRepositoryTests(repoName);

          result.push({
            name: repoName,
            config,
            tests,
          });
        } catch (error) {
          this.logger.warn('Failed to load details for repository', {
            repoName,
            error: (error as Error).message,
          });
          // Still include the repository but with minimal info
          result.push({
            name: repoName,
            config: null,
            tests: [],
          });
        }
      }

      res.json(result);
    } catch (error) {
      this.logger.error('Failed to get repositories', error as Error);
      next(error);
    }
  };

  cloneRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CloneRepositoryDto = req.body;

      // Basic validation
      if (!dto.name || !dto.url) {
        return res.status(400).json({
          error: 'Repository name and URL are required',
          details: {
            name: dto.name ? 'provided' : 'missing',
            url: dto.url ? 'provided' : 'missing',
          },
        });
      }

      // Validate repository name (no special characters, spaces, etc.)
      const nameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!nameRegex.test(dto.name)) {
        return res.status(400).json({
          error: 'Repository name can only contain letters, numbers, hyphens, and underscores',
          providedName: dto.name,
        });
      }

      // Validate URL format
      const urlRegex = /^https?:\/\/.+\.git$|^git@.+:.+\.git$|^https?:\/\/github\.com\/.+\/.+$/;
      if (!urlRegex.test(dto.url)) {
        return res.status(400).json({
          error: 'Invalid repository URL format. Expected a Git repository URL',
          providedUrl: dto.url,
          examples: [
            'https://github.com/user/repo.git',
            'https://github.com/user/repo',
            'git@github.com:user/repo.git',
          ],
        });
      }

      this.logger.info('Starting repository clone operation', {
        name: dto.name,
        url: dto.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      const path = await this.repositoryService.cloneRepository(dto.url, dto.name);

      this.logger.info('Repository cloned successfully', {
        name: dto.name,
        path,
        url: dto.url,
      });

      res.status(201).json({
        success: true,
        message: 'Repository cloned successfully',
        repository: {
          name: dto.name,
          url: dto.url,
          path,
          clonedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to clone repository', error as Error, {
        name: req.body?.name,
        url: req.body?.url,
      });

      // Send user-friendly error response instead of crashing
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: 'Failed to clone repository',
        details: errorMessage,
        troubleshooting: [
          'Ensure the repository URL is correct and accessible',
          'Check if you have permission to access the repository',
          'Verify that Git is installed on the server',
          'Try a different repository name if one already exists',
        ],
      });
    }
  };

  updateRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({
          error: 'Repository name is required',
        });
      }

      this.logger.info('Starting repository update operation', { name });

      await this.repositoryService.updateRepository(name);

      this.logger.info('Repository updated successfully', { name });

      res.json({
        success: true,
        message: 'Repository updated successfully',
        repository: {
          name,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to update repository', error as Error, {
        name: req.params?.name,
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: 'Failed to update repository',
        details: errorMessage,
        troubleshooting: [
          'Ensure the repository exists and was cloned properly',
          'Check if you have permission to access the repository',
          'Verify that Git is installed on the server',
          'The repository might have been moved or deleted',
        ],
      });
    }
  };

  getRepositoryConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({
          error: 'Repository name is required',
        });
      }

      const config = await this.repositoryService.getRepositoryConfig(name);

      if (!config) {
        return res.status(404).json({
          error: 'Repository configuration not found',
          repository: name,
          details:
            'The repository might not have a config/env.js file or the file format is invalid',
        });
      }

      res.json({
        success: true,
        repository: name,
        config,
      });
    } catch (error) {
      this.logger.error('Failed to get repository config', error as Error, {
        name: req.params?.name,
      });
      next(error);
    }
  };

  private async getRepositoryTests(repoName: string): Promise<string[]> {
    try {
      const testsPath = `${this.config.getK6TestsDir()}/repos/${repoName}/tests`;
      const entries = await this.fileSystem.readDir(testsPath);
      const tests = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
        .map((entry) => entry.name.replace('.js', ''));

      this.logger.debug('Found tests for repository', { repoName, testCount: tests.length, tests });
      return tests;
    } catch (error) {
      this.logger.warn('Failed to read tests directory for repository', {
        repoName,
        error: (error as Error).message,
      });
      return [];
    }
  }
}
