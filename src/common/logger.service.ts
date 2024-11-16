import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.ensureLogDirectoryExists();

    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV === 'development';

    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        ({
          timestamp,
          level,
          message,
          ...meta
        }: winston.Logform.TransformableInfo) => {
          const metaString = Object.keys(meta).length
            ? JSON.stringify(meta)
            : '';
          return `${timestamp} [${level}]: ${message} ${metaString}`;
        },
      ),
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: isDevelopment
          ? winston.format.combine(winston.format.colorize(), logFormat)
          : logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      }),
    ];

    if (isDevelopment) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), logFormat),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  private ensureLogDirectoryExists() {
    const logDir = path.resolve(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(`${message} -> ${trace}`, { context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
export { LoggerService };

