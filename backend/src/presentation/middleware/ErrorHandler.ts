import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../../core/errors/BaseError';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class ErrorHandler {
  constructor(private readonly logger: ILogger) {}

  handle() {
    return (error: Error, req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof BaseError) {
        this.logger.warn('Operational error occurred', {
          error: error.message,
          statusCode: error.statusCode,
          path: req.path,
          method: req.method,
        });

        return res.status(error.statusCode).json({
          error: error.message,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }

      // Unexpected errors
      this.logger.error('Unexpected error occurred', error, {
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
      });

      return res.status(500).json({
        error: 'Internal Server Error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    };
  }
}
