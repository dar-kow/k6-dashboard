import { Router } from 'express';
import { TestController } from '../controllers/TestController';

export class TestRoutes {
  constructor(private readonly controller: TestController) {}

  getRouter(): Router {
    const router = Router();
    router.get('/', this.controller.getAvailableTests);
    return router;
  }
}
