import { LoggerInterface } from "../types/types";

export class Logger implements LoggerInterface {
  private formatMessage(
    level: string,
    message: string,
    meta?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (meta && Object.keys(meta).length > 0) {
      return `${baseLog} | Meta: ${JSON.stringify(meta)}`;
    }

    return baseLog;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.formatMessage("info", message, meta));
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const errorMeta = error
      ? { ...meta, error: error.message, stack: error.stack }
      : meta;
    console.error(this.formatMessage("error", message, errorMeta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatMessage("warn", message, meta));
  }
}
