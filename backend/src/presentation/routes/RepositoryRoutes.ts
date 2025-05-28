import { Router } from 'express';
import { RepositoryController } from '../controllers/RepositoryController';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class RepositoryRoutes {
  constructor(private readonly controller: RepositoryController) {}

  getRouter(): Router {
    const router = Router();

    router.get('/', this.controller.getRepositories);

    router.post(
      '/',
      ValidationMiddleware.validateBody([
        { field: 'name', required: true, type: 'string', minLength: 1 },
        { field: 'url', required: true, type: 'string', minLength: 1 },
        { field: 'branch', required: false, type: 'string' },
      ]),
      this.controller.createRepository
    );

    router.get(
      '/:id/config',
      ValidationMiddleware.validateParams([{ field: 'id', required: true, type: 'string' }]),
      this.controller.getRepositoryConfig
    );

    router.post(
      '/:id/sync',
      ValidationMiddleware.validateParams([{ field: 'id', required: true, type: 'string' }]),
      this.controller.syncRepository
    );

    router.delete(
      '/:id',
      ValidationMiddleware.validateParams([{ field: 'id', required: true, type: 'string' }]),
      this.controller.deleteRepository
    );

    return router;
  }
}
