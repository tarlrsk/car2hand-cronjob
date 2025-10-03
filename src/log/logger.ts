import { createLogger, format, transports } from "winston";
import { LoggerInterface } from "../types/types";

const orderedJsonFormat = format((info) => {
  const { timestamp, level, message, ...rest } = info;

  info[Symbol.for("message")] = JSON.stringify({
    timestamp,
    level,
    message,
    ...rest,
  });

  return info;
});

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), orderedJsonFormat()),
  transports: [new transports.Console()],
});

export class Logger implements LoggerInterface {
  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    logger.error(message, { error: error?.message, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, meta);
  }
}
