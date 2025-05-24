import { Router } from 'express';
import { TestRunnerController } from '../controllers/TestRunnerController';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { TestProfile, Environment } from '../../core/entities/enums';

export class TestRunnerRoutes {
  constructor(private readonly controller: TestRunnerController) {}

  getRouter(): Router {
    const router = Router();

    router.post(
      '/test',
      ValidationMiddleware.validateBody([
        { field: 'test', required: true, type: 'string', minLength: 1 },
        {
          field: 'profile',
          required: false,
          type: 'string',
          allowedValues: Object.values(TestProfile),
        },
        {
          field: 'environment',
          required: false,
          type: 'string',
          allowedValues: Object.values(Environment),
        },
        { field: 'customToken', required: false, type: 'string' },
        { field: 'testId', required: false, type: 'string' },
      ]),
      this.controller.executeTest
    );

    router.post(
      '/all',
      ValidationMiddleware.validateBody([
        {
          field: 'profile',
          required: false,
          type: 'string',
          allowedValues: Object.values(TestProfile),
        },
        {
          field: 'environment',
          required: false,
          type: 'string',
          allowedValues: Object.values(Environment),
        },
        { field: 'customToken', required: false, type: 'string' },
        { field: 'testId', required: false, type: 'string' },
      ]),
      this.controller.executeAllTests
    );

    router.post(
      '/stop',
      ValidationMiddleware.validateBody([
        { field: 'testId', required: true, type: 'string', minLength: 1 },
      ]),
      this.controller.stopTest
    );

    router.get('/status', this.controller.getRunningTests);

    return router;
  }
}
