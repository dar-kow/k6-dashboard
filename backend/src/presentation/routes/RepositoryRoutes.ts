import { Router } from 'express';
import { RepositoryController } from '../controllers/RepositoryController';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class RepositoryRoutes {
  constructor(private readonly controller: RepositoryController) {}

  getRouter(): Router {
    const router = Router();

    // Get all repositories
    router.get('/', this.controller.getRepositories);

    // Get active repository
    router.get('/active', this.controller.getActiveRepository);

    // Set active repository
    router.put(
      '/active/:repositoryId',
      ValidationMiddleware.validateParams([
        { field: 'repositoryId', required: true, type: 'string' },
      ]),
      this.controller.setActiveRepository
    );

    // Add new repository
    router.post(
      '/',
      ValidationMiddleware.validateBody([
        { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
        { field: 'url', required: true, type: 'string', minLength: 1 },
        { field: 'branch', required: false, type: 'string', minLength: 1, maxLength: 50 },
        { field: 'description', required: false, type: 'string', maxLength: 500 },
      ]),
      this.controller.addRepository
    );

    // Update repository
    router.put(
      '/:repositoryId',
      ValidationMiddleware.validateParams([
        { field: 'repositoryId', required: true, type: 'string' },
      ]),
      ValidationMiddleware.validateBody([
        { field: 'name', required: false, type: 'string', minLength: 1, maxLength: 100 },
        { field: 'url', required: false, type: 'string', minLength: 1 },
        { field: 'branch', required: false, type: 'string', minLength: 1, maxLength: 50 },
        { field: 'description', required: false, type: 'string', maxLength: 500 },
      ]),
      this.controller.updateRepository
    );

    // Remove repository
    router.delete(
      '/:repositoryId',
      ValidationMiddleware.validateParams([
        { field: 'repositoryId', required: true, type: 'string' },
      ]),
      this.controller.removeRepository
    );

    // Sync repository (clone or update)
    router.post(
      '/:repositoryId/sync',
      ValidationMiddleware.validateParams([
        { field: 'repositoryId', required: true, type: 'string' },
      ]),
      this.controller.syncRepository
    );

    // Get repository status
    router.get(
      '/:repositoryId/status',
      ValidationMiddleware.validateParams([
        { field: 'repositoryId', required: true, type: 'string' },
      ]),
      this.controller.getRepositoryStatus
    );

    // Get repository configuration
    router.get(
      '/:repositoryId/config',
      ValidationMiddleware.validateParams([
        { field: 'repositoryId', required: true, type: 'string' },
      ]),
      this.controller.getRepositoryConfig
    );

    // Get repository tests
    router.get(
      '/:repositoryId/tests',
      ValidationMiddleware.validateParams([
        { field: 'repositoryId', required: true, type: 'string' },
      ]),
      this.controller.getRepositoryTests
    );

    return router;
  }
}
