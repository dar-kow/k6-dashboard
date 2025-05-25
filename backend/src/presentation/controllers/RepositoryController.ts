import { Request, Response, NextFunction } from 'express';
import {
  IRepositoryManager,
  TestRepository,
} from '../../core/interfaces/services/IRepositoryManager';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class RepositoryController {
  constructor(
    private readonly repositoryManager: IRepositoryManager,
    private readonly logger: ILogger
  ) {}

  // Get all repositories
  getRepositories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting all repositories');

      const repositories = await this.repositoryManager.getAllRepositories();

      res.json({
        success: true,
        repositories,
        count: repositories.length,
      });
    } catch (error) {
      this.logger.error('Error getting repositories', error as Error);
      next(error);
    }
  };

  // Get active repository
  getActiveRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting active repository');

      const activeRepo = await this.repositoryManager.getActiveRepository();

      if (!activeRepo) {
        return res.status(404).json({
          success: false,
          message: 'No active repository found',
        });
      }

      res.json({
        success: true,
        repository: activeRepo,
      });
    } catch (error) {
      this.logger.error('Error getting active repository', error as Error);
      next(error);
    }
  };

  // Set active repository
  setActiveRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryId } = req.params;
      this.logger.info('Setting active repository', { repositoryId });

      const success = await this.repositoryManager.setActiveRepository(repositoryId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      const activeRepo = await this.repositoryManager.getActiveRepository();

      res.json({
        success: true,
        message: 'Active repository changed successfully',
        repository: activeRepo,
      });
    } catch (error) {
      this.logger.error('Error setting active repository', error as Error);
      next(error);
    }
  };

  // Add new repository
  addRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, url, branch, description } = req.body;

      this.logger.info('Adding new repository', { name, url, branch });

      // Validate required fields
      if (!name || !url) {
        return res.status(400).json({
          success: false,
          message: 'Name and URL are required',
        });
      }

      const repository = await this.repositoryManager.addRepository({
        name,
        url,
        branch: branch || 'main',
        description,
        directory: '', // Will be generated automatically
      });

      res.status(201).json({
        success: true,
        message: 'Repository added successfully',
        repository,
      });
    } catch (error) {
      this.logger.error('Error adding repository', error as Error);
      next(error);
    }
  };

  // Update repository
  updateRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryId } = req.params;
      const updates = req.body;

      this.logger.info('Updating repository', { repositoryId, updates });

      const repository = await this.repositoryManager.updateRepository(repositoryId, updates);

      res.json({
        success: true,
        message: 'Repository updated successfully',
        repository,
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      this.logger.error('Error updating repository', error as Error);
      next(error);
    }
  };

  // Remove repository
  removeRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryId } = req.params;

      this.logger.info('Removing repository', { repositoryId });

      const success = await this.repositoryManager.removeRepository(repositoryId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      res.json({
        success: true,
        message: 'Repository removed successfully',
      });
    } catch (error) {
      this.logger.error('Error removing repository', error as Error);
      next(error);
    }
  };

  // Clone or update repository
  syncRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryId } = req.params;

      this.logger.info('Syncing repository', { repositoryId });

      const repository = await this.repositoryManager.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      const result = await this.repositoryManager.cloneOrUpdateRepository(repository);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          output: result.output,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (error) {
      this.logger.error('Error syncing repository', error as Error);
      next(error);
    }
  };

  // Get repository status
  getRepositoryStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryId } = req.params;

      this.logger.debug('Getting repository status', { repositoryId });

      const repository = await this.repositoryManager.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      const status = await this.repositoryManager.getRepositoryStatus(repository);

      res.json({
        success: status.success,
        repository: {
          id: repository.id,
          name: repository.name,
          directory: repository.directory,
        },
        status: status.success
          ? {
              lastCommit: status.lastCommit,
            }
          : {
              error: status.error,
            },
      });
    } catch (error) {
      this.logger.error('Error getting repository status', error as Error);
      next(error);
    }
  };

  // Get repository configuration
  getRepositoryConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryId } = req.params;

      this.logger.debug('Getting repository config', { repositoryId });

      const repository = await this.repositoryManager.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      const config = await this.repositoryManager.getRepositoryConfig(repository);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Repository configuration not found',
        });
      }

      res.json({
        success: true,
        repository: {
          id: repository.id,
          name: repository.name,
        },
        config,
      });
    } catch (error) {
      this.logger.error('Error getting repository config', error as Error);
      next(error);
    }
  };

  // Get tests from repository
  getRepositoryTests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryId } = req.params;

      this.logger.debug('Getting repository tests', { repositoryId });

      const repository = await this.repositoryManager.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      const tests = await this.repositoryManager.getRepositoryTests(repository);

      res.json({
        success: true,
        repository: {
          id: repository.id,
          name: repository.name,
        },
        tests,
        count: tests.length,
      });
    } catch (error) {
      this.logger.error('Error getting repository tests', error as Error);
      next(error);
    }
  };
}
