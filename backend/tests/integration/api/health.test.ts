import request from 'supertest';
import express from 'express';
import { HealthController } from '../../../src/presentation/controllers/HealthController';
import { HealthRoutes } from '../../../src/presentation/routes/HealthRoutes';
import { ConsoleLogger } from '../../../src/config/Logger';

describe('Health API Integration', () => {
  let app: express.Application;

  beforeAll(() => {
    const logger = new ConsoleLogger('error');
    const controller = new HealthController(logger);
    const routes = new HealthRoutes(controller);

    app = express();
    app.use('/health', routes.getRouter());
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });

      // Validate timestamp format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });
});
