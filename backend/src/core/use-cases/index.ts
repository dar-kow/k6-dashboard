// Test execution use cases
export { ExecuteTestUseCase } from './test-execution/ExecuteTestUseCase';
export { ExecuteAllTestsUseCase } from './test-execution/ExecuteAllTestsUseCase';
export { StopTestUseCase } from './test-execution/StopTestUseCase';
export { GetRunningTestsUseCase } from './test-execution/GetRunningTestsUseCase';

// Test results use cases
export { GetTestDirectoriesUseCase } from './test-results/GetTestDirectoriesUseCase';
export { GetTestFilesUseCase } from './test-results/GetTestFilesUseCase';
export { GetTestResultUseCase } from './test-results/GetTestResultUseCase';

// Test management use cases
export { GetAvailableTestsUseCase } from './tests/GetAvailableTestsUseCase';

// src/presentation/middleware/SecurityMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class SecurityMiddleware {
  constructor(private readonly logger: ILogger) {}

  // Rate limiting middleware (simple implementation)
  rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const clients = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = req.ip || 'unknown';
      const now = Date.now();

      const client = clients.get(clientId);

      if (!client || now > client.resetTime) {
        clients.set(clientId, {
          count: 1,
          resetTime: now + windowMs,
        });
        return next();
      }

      if (client.count >= maxRequests) {
        this.logger.warn('Rate limit exceeded', {
          clientId,
          count: client.count,
          maxRequests,
        });

        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((client.resetTime - now) / 1000),
        });
      }

      client.count++;
      next();
    };
  }

  // Security headers middleware
  securityHeaders() {
    return (_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Remove server header
      res.removeHeader('X-Powered-By');

      next();
    };
  }

  // Input sanitization middleware
  sanitizeInput() {
    return (req: Request, _res: Response, next: NextFunction) => {
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }

      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }

      next();
    };
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Basic XSS prevention
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
