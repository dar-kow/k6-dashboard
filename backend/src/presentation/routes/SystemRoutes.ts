import { Router } from 'express';
import { SystemController } from '../controllers/SystemController';

export class SystemRoutes {
  constructor(private readonly controller: SystemController) {}

  getRouter(): Router {
    const router = Router();

    router.get('/info', this.controller.getSystemInfo);
    router.get('/environment/:environment', this.controller.getEnvironmentConfig);
    router.get('/config', this.controller.getTestConfiguration);

    return router;
  }
}
