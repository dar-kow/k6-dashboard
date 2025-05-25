import { Router } from 'express';
import { GitController } from '../controllers/GitController';

export class GitRoutes {
  constructor(private readonly controller: GitController) {}

  getRouter(): Router {
    const router = Router();

    router.post('/refresh', this.controller.refreshTests);
    router.get('/status', this.controller.getRepoStatus);

    return router;
  }
}
