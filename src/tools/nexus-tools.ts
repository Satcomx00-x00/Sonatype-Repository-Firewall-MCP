/**
 * MCP tools for Nexus Repository Manager IQ/Firewall integration endpoints.
 * Open/Closed: each tool is a pure value; adding new tools does not modify existing ones.
 */

import { z } from "zod";
import { defineTool } from "../utils/tool-helpers.js";
import type { NexusService } from "../services/nexus-service.js";
import { logger } from "../utils/logger.js";
import { tracer } from "../utils/tracer.js";
import { HttpError } from "../utils/http-client.js";

function formatError(err: unknown): string {
  if (err instanceof HttpError) {
    return `API Error ${err.status} ${err.statusText}: ${err.body}`;
  }
  if (err instanceof Error) {
    return `Error: ${err.message}`;
  }
  return `Unknown error: ${String(err)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildNexusTools(nexusService: NexusService): any[] {
  return [
    defineTool({
      name: "get_nexus_iq_configuration",
      description:
        "Get the current Sonatype IQ Server / Repository Firewall integration configuration from Nexus Repository Manager.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.get_nexus_iq_configuration");
        ctx.log.info("Fetching Nexus IQ configuration");
        return tracer.withSpan("tool.get_nexus_iq_configuration", async () => {
          try {
            const cfg = await nexusService.getIqConfiguration();
            ctx.log.info("Nexus IQ configuration retrieved", {
              enabled: cfg.enabled,
              url: cfg.url,
            });
            return JSON.stringify(cfg, null, 2);
          } catch (err) {
            ctx.log.error("Failed to fetch Nexus IQ configuration", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "update_nexus_iq_configuration",
      description:
        "Update the Sonatype IQ Server / Repository Firewall integration configuration in Nexus Repository Manager.",
      parameters: z.object({
        enabled: z.boolean().describe("Enable or disable IQ Server integration"),
        showLink: z.boolean().describe("Show link to IQ Server in Nexus UI"),
        url: z.string().url().describe("URL of the Sonatype IQ Server"),
        authenticationType: z
          .enum(["USER", "PKI"])
          .describe("Authentication type: USER or PKI"),
        username: z
          .string()
          .optional()
          .describe("IQ Server username (required when authenticationType=USER)"),
        password: z
          .string()
          .optional()
          .describe("IQ Server password (required when authenticationType=USER)"),
        useTrustStoreForUrl: z
          .boolean()
          .default(false)
          .describe("Use Nexus trust store when connecting to IQ Server"),
        timeoutSeconds: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Connection timeout in seconds"),
      }),
      async execute(args, ctx) {
        logger.info("tool.update_nexus_iq_configuration", { url: args.url });
        ctx.log.info("Updating Nexus IQ configuration", { url: args.url });
        return tracer.withSpan("tool.update_nexus_iq_configuration", async () => {
          try {
            const updated = await nexusService.updateIqConfiguration({
              enabled: args.enabled,
              showLink: args.showLink,
              url: args.url,
              authenticationType: args.authenticationType,
              username: args.username,
              useTrustStoreForUrl: args.useTrustStoreForUrl,
              timeoutSeconds: args.timeoutSeconds,
            });
            ctx.log.info("Nexus IQ configuration updated");
            return JSON.stringify(updated, null, 2);
          } catch (err) {
            ctx.log.error("Failed to update Nexus IQ configuration", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "verify_nexus_iq_connection",
      description:
        "Test the connection from Nexus Repository Manager to Sonatype IQ Server using the current configuration.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.verify_nexus_iq_connection");
        ctx.log.info("Verifying Nexus to IQ Server connection");
        return tracer.withSpan("tool.verify_nexus_iq_connection", async (span) => {
          try {
            const status = await nexusService.verifyIqConnection();
            span.setAttribute("success", status.success);
            ctx.log.info("Connection verification complete", { success: status.success });
            return JSON.stringify(status, null, 2);
          } catch (err) {
            ctx.log.error("Failed to verify connection", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "enable_nexus_firewall",
      description:
        "Enable the Sonatype Repository Firewall integration in Nexus Repository Manager.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.enable_nexus_firewall");
        ctx.log.info("Enabling Nexus Repository Firewall");
        return tracer.withSpan("tool.enable_nexus_firewall", async () => {
          try {
            await nexusService.enableFirewall();
            ctx.log.info("Nexus Repository Firewall enabled");
            return "Repository Firewall has been enabled successfully.";
          } catch (err) {
            ctx.log.error("Failed to enable firewall", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "disable_nexus_firewall",
      description:
        "Disable the Sonatype Repository Firewall integration in Nexus Repository Manager.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.disable_nexus_firewall");
        ctx.log.info("Disabling Nexus Repository Firewall");
        return tracer.withSpan("tool.disable_nexus_firewall", async () => {
          try {
            await nexusService.disableFirewall();
            ctx.log.info("Nexus Repository Firewall disabled");
            return "Repository Firewall has been disabled successfully.";
          } catch (err) {
            ctx.log.error("Failed to disable firewall", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),
  ];
}
