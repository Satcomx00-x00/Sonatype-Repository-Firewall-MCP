/**
 * MCP server factory.
 * Open/Closed: adding new tool groups does not require modifying this module;
 * simply pass additional tools to the constructor.
 */

import { FastMCP } from "fastmcp";
import type { AppConfig } from "./config.js";
import { logger } from "./utils/logger.js";

export function createServer(
  config: AppConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: any[]
): FastMCP {
  const server = new FastMCP({
    name: "Sonatype Repository Firewall MCP",
    version: "1.0.0",
    instructions:
      "This MCP server provides tools to interact with the Sonatype IQ Server Firewall REST API and the " +
      "Nexus Repository Manager IQ integration endpoints. Use the available tools to inspect quarantine " +
      "status, evaluate components for policy violations, manage applications and organizations, and " +
      "configure Nexus Repository Firewall integration.",
  });

  for (const tool of tools) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.addTool(tool as any);
    logger.debug("tool.registered", { name: tool.name });
  }

  logger.info("server.created", {
    toolCount: tools.length,
    transport: config.MCP_TRANSPORT,
  });

  return server;
}
