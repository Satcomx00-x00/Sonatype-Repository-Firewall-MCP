/**
 * Structured logger utility.
 * Writes JSON-formatted lines to stderr so that stdout stays clean for MCP stdio transport.
 */

import { config } from "../config.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[config.LOG_LEVEL];
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta !== undefined && { meta }),
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    write("debug", message, meta);
  },
  info(message: string, meta?: unknown): void {
    write("info", message, meta);
  },
  warn(message: string, meta?: unknown): void {
    write("warn", message, meta);
  },
  error(message: string, meta?: unknown): void {
    write("error", message, meta);
  },
} as const;

export type Logger = typeof logger;
