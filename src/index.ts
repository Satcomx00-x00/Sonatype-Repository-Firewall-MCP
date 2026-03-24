#!/usr/bin/env node
/**
 * Entry point – wires config → HttpClients → Services → Tools → MCP Server.
 * Dependency Inversion: high-level module (main) creates concrete instances
 * and injects them downward; nothing in the service/tool layer creates its own
 * dependencies.
 */

import { config } from "./config.js";
import { HttpClient } from "./utils/http-client.js";
import { logger } from "./utils/logger.js";
import { IqService } from "./services/iq-service.js";
import { NexusService } from "./services/nexus-service.js";
import { buildIqTools } from "./tools/iq-tools.js";
import { buildNexusTools } from "./tools/nexus-tools.js";
import { createServer } from "./server.js";

// ─── Build HTTP clients ──────────────────────────────────────────────────────

const iqClient = new HttpClient({
  baseUrl: config.IQ_SERVER_URL,
  username: config.IQ_SERVER_USERNAME,
  password: config.IQ_SERVER_PASSWORD,
  timeoutMs: config.HTTP_TIMEOUT_MS,
  retryCount: config.HTTP_RETRY_COUNT,
  retryDelayMs: config.HTTP_RETRY_DELAY_MS,
});

// ─── Build services ──────────────────────────────────────────────────────────

const iqService = new IqService(iqClient);

// Build all tools, conditionally including Nexus tools
const allTools = [...buildIqTools(iqService)];

if (config.NEXUS_URL) {
  const nexusClient = new HttpClient({
    baseUrl: config.NEXUS_URL,
    username: config.NEXUS_USERNAME,
    password: config.NEXUS_PASSWORD,
    timeoutMs: config.HTTP_TIMEOUT_MS,
    retryCount: config.HTTP_RETRY_COUNT,
    retryDelayMs: config.HTTP_RETRY_DELAY_MS,
  });
  const nexusService = new NexusService(nexusClient);
  allTools.push(...buildNexusTools(nexusService));
  logger.info("nexus.tools.enabled", { nexusUrl: config.NEXUS_URL });
} else {
  logger.info(
    "nexus.tools.disabled",
    { hint: "Set NEXUS_URL env var to enable Nexus Repository Manager tools" }
  );
}

// ─── Create and start the MCP server ────────────────────────────────────────

const server = createServer(config, allTools);

logger.info("server.starting", {
  transport: config.MCP_TRANSPORT,
  ...(config.MCP_TRANSPORT === "httpStream" && { port: config.MCP_HTTP_PORT }),
});

if (config.MCP_TRANSPORT === "httpStream") {
  server.start({
    transportType: "httpStream",
    httpStream: { port: config.MCP_HTTP_PORT },
  });
} else {
  server.start({ transportType: "stdio" });
}
