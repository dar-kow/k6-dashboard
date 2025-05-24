import { ILogger } from "../core/interfaces/common/ILogger";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class ConsoleLogger implements ILogger {
  private readonly logLevel: LogLevel;

  constructor(level: string = "info") {
    this.logLevel = this.parseLogLevel(level);
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(this.formatMessage("DEBUG", message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(this.formatMessage("INFO", message, meta));
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage("WARN", message, meta));
    }
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const errorMeta = error
        ? {
            ...meta,
            error: error.message,
            stack: error.stack,
          }
        : meta;

      console.error(this.formatMessage("ERROR", message, errorMeta));
    }
  }

  private formatMessage(
    level: string,
    message: string,
    meta?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "debug":
        return LogLevel.DEBUG;
      case "info":
        return LogLevel.INFO;
      case "warn":
        return LogLevel.WARN;
      case "error":
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }
}
