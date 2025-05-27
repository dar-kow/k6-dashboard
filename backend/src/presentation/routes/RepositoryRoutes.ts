import { Router } from 'express';
import { RepositoryController } from '../controllers/RepositoryController';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class RepositoryRoutes {
  constructor(private readonly controller: RepositoryController) {}

  getRouter(): Router {
    const router = Router();

    router.get('/', this.controller.getRepositories);

    router.post(
      '/clone',
      ValidationMiddleware.validateBody([
        { field: 'name', required: true, type: 'string', minLength: 1 },
        { field: 'url', required: true, type: 'string', minLength: 1 },
      ]),
      this.controller.cloneRepository
    );

    router.post(
      '/:name/update',
      ValidationMiddleware.validateParams([{ field: 'name', required: true, type: 'string' }]),
      this.controller.updateRepository
    );

    router.delete(
      '/:name',
      ValidationMiddleware.validateParams([{ field: 'name', required: true, type: 'string' }]),
      this.controller.deleteRepository
    );

    router.get(
      '/:name/config',
      ValidationMiddleware.validateParams([{ field: 'name', required: true, type: 'string' }]),
      this.controller.getRepositoryConfig
    );

    return router;
  }
}
