import { Request, Response } from 'express';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class HealthController {
  constructor(private readonly logger: ILogger) {}

  checkHealth = (_req: Request, res: Response) => {
    this.logger.debug('Health check requested');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };
}
