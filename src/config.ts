/**
 * Configuration module – validates all required environment variables at startup.
 * Single Responsibility: owns all env-var parsing / defaults / validation.
 */

import { z } from "zod";

const ConfigSchema = z.object({
  /** Base URL of the Sonatype IQ Server (e.g. https://iq.example.com) */
  IQ_SERVER_URL: z
    .string()
    .url()
    .default("http://localhost:8070")
    .describe("Base URL of the Sonatype IQ Server"),

  /** IQ Server username for Basic-Auth */
  IQ_SERVER_USERNAME: z
    .string()
    .min(1)
    .default("admin")
    .describe("IQ Server username"),

  /** IQ Server password for Basic-Auth */
  IQ_SERVER_PASSWORD: z
    .string()
    .min(1)
    .default("admin123")
    .describe("IQ Server password"),

  /** Optional Nexus Repository Manager base URL */
  NEXUS_URL: z
    .string()
    .url()
    .optional()
    .describe("Base URL of the Nexus Repository Manager"),

  /** Optional Nexus username for Basic-Auth */
  NEXUS_USERNAME: z
    .string()
    .optional()
    .describe("Nexus Repository Manager username"),

  /** Optional Nexus password for Basic-Auth */
  NEXUS_PASSWORD: z
    .string()
    .optional()
    .describe("Nexus Repository Manager password"),

  /** HTTP request timeout in milliseconds */
  HTTP_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000)
    .describe("HTTP request timeout in milliseconds"),

  /** Number of automatic retries on transient failures (5xx / network errors) */
  HTTP_RETRY_COUNT: z.coerce
    .number()
    .int()
    .min(0)
    .max(5)
    .default(3)
    .describe("Number of HTTP retries on transient failures"),

  /** Delay between retries in milliseconds (exponential back-off base) */
  HTTP_RETRY_DELAY_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(500)
    .describe("Base delay between retries (ms, doubles each attempt)"),

  /** MCP transport type: stdio (default) or httpStream */
  MCP_TRANSPORT: z
    .enum(["stdio", "httpStream"])
    .default("stdio")
    .describe("MCP transport type"),

  /** HTTP port when MCP_TRANSPORT=httpStream */
  MCP_HTTP_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000)
    .describe("HTTP port for httpStream transport"),

  /** Log level */
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info")
    .describe("Application log level"),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

function loadConfig(): AppConfig {
  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  return result.data;
}

export const config: AppConfig = loadConfig();
