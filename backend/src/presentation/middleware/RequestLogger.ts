import { Request, Response, NextFunction } from "express";
import { ILogger } from "../../core/interfaces/common/ILogger";

export class RequestLogger {
  constructor(private readonly logger: ILogger) {}

  log() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - start;
        this.logger.info("HTTP Request", {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
        });
      });

      next();
    };
  }
}
