/**
 * MCP tools for Sonatype IQ Server Firewall endpoints.
 * Open/Closed: each tool is a pure value; adding new tools does not modify existing ones.
 */

import { z } from "zod";
import { defineTool } from "../utils/tool-helpers.js";
import type { IqService } from "../services/iq-service.js";
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
export function buildIqTools(iqService: IqService): any[] {
  return [
    defineTool({
      name: "get_firewall_metrics",
      description:
        "Retrieve Sonatype IQ Server Firewall dashboard metrics, including total quarantined component counts and repository statistics.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.get_firewall_metrics");
        ctx.log.info("Fetching firewall metrics");
        return tracer.withSpan("tool.get_firewall_metrics", async (span) => {
          try {
            const metrics = await iqService.getFirewallMetrics();
            span.setAttribute("quarantinedTotal", metrics.totalComponentsQuarantined);
            ctx.log.info("Firewall metrics retrieved", { quarantined: metrics.totalComponentsQuarantined });
            return JSON.stringify(metrics, null, 2);
          } catch (err) {
            ctx.log.error("Failed to fetch firewall metrics", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "get_quarantine_summary",
      description:
        "Get a summary of all components currently quarantined by the Sonatype Repository Firewall, grouped by repository.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.get_quarantine_summary");
        ctx.log.info("Fetching quarantine summary");
        return tracer.withSpan("tool.get_quarantine_summary", async (span) => {
          try {
            const summary = await iqService.getQuarantineSummary();
            span.setAttribute("quarantinedCount", summary.quarantinedComponentCount);
            span.setAttribute("repositoryCount", summary.repositoryCount);
            ctx.log.info("Quarantine summary retrieved", {
              quarantinedCount: summary.quarantinedComponentCount,
              repositoryCount: summary.repositoryCount,
            });
            return JSON.stringify(summary, null, 2);
          } catch (err) {
            ctx.log.error("Failed to fetch quarantine summary", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "get_release_quarantine_summary",
      description:
        "Get a summary of components that have been automatically released from quarantine by the Sonatype Repository Firewall.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.get_release_quarantine_summary");
        ctx.log.info("Fetching release quarantine summary");
        return tracer.withSpan("tool.get_release_quarantine_summary", async (span) => {
          try {
            const summary = await iqService.getReleaseQuarantineSummary();
            span.setAttribute("autoReleased", summary.autoReleasedComponentCount);
            ctx.log.info("Release quarantine summary retrieved", {
              autoReleased: summary.autoReleasedComponentCount,
            });
            return JSON.stringify(summary, null, 2);
          } catch (err) {
            ctx.log.error("Failed to fetch release quarantine summary", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "get_release_quarantine_configuration",
      description:
        "Get the auto-release-from-quarantine configuration including policy conditions that trigger automatic component release.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.get_release_quarantine_configuration");
        ctx.log.info("Fetching release quarantine configuration");
        return tracer.withSpan("tool.get_release_quarantine_configuration", async () => {
          try {
            const releaseConfig = await iqService.getReleaseQuarantineConfiguration();
            ctx.log.info("Release quarantine configuration retrieved", { enabled: releaseConfig.enabled });
            return JSON.stringify(releaseConfig, null, 2);
          } catch (err) {
            ctx.log.error("Failed to fetch release quarantine configuration", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "list_applications",
      description:
        "List all applications registered in Sonatype IQ Server. Optionally filter by publicId.",
      parameters: z.object({
        publicId: z.string().optional().describe("Filter by application public ID"),
      }),
      async execute(args, ctx) {
        logger.info("tool.list_applications", { publicId: args.publicId });
        ctx.log.info("Listing IQ applications", { publicId: args.publicId });
        return tracer.withSpan("tool.list_applications", async (span) => {
          try {
            const apps = await iqService.getApplications(args.publicId);
            span.setAttribute("count", apps.length);
            ctx.log.info("Applications retrieved", { count: apps.length });
            return JSON.stringify(apps, null, 2);
          } catch (err) {
            ctx.log.error("Failed to list applications", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "get_application",
      description:
        "Get details of a specific application registered in Sonatype IQ Server by its internal application ID.",
      parameters: z.object({
        applicationId: z.string().min(1).describe("Internal application ID"),
      }),
      async execute(args, ctx) {
        logger.info("tool.get_application", { applicationId: args.applicationId });
        ctx.log.info("Fetching application details", { applicationId: args.applicationId });
        return tracer.withSpan("tool.get_application", async (span) => {
          span.setAttribute("applicationId", args.applicationId);
          try {
            const app = await iqService.getApplication(args.applicationId);
            ctx.log.info("Application retrieved", { name: app.name });
            return JSON.stringify(app, null, 2);
          } catch (err) {
            ctx.log.error("Failed to get application", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "list_organizations",
      description: "List all organizations defined in Sonatype IQ Server.",
      parameters: z.object({}),
      async execute(_args, ctx) {
        logger.info("tool.list_organizations");
        ctx.log.info("Listing IQ organizations");
        return tracer.withSpan("tool.list_organizations", async (span) => {
          try {
            const orgs = await iqService.getOrganizations();
            span.setAttribute("count", orgs.length);
            ctx.log.info("Organizations retrieved", { count: orgs.length });
            return JSON.stringify(orgs, null, 2);
          } catch (err) {
            ctx.log.error("Failed to list organizations", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "list_application_reports",
      description:
        "List all available policy evaluation reports for a given application in Sonatype IQ Server.",
      parameters: z.object({
        applicationId: z.string().min(1).describe("Internal application ID"),
      }),
      async execute(args, ctx) {
        logger.info("tool.list_application_reports", { applicationId: args.applicationId });
        ctx.log.info("Listing application reports", { applicationId: args.applicationId });
        return tracer.withSpan("tool.list_application_reports", async (span) => {
          span.setAttribute("applicationId", args.applicationId);
          try {
            const reports = await iqService.getApplicationReports(args.applicationId);
            span.setAttribute("count", reports.length);
            ctx.log.info("Reports retrieved", { count: reports.length });
            return JSON.stringify(reports, null, 2);
          } catch (err) {
            ctx.log.error("Failed to list reports", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "get_report_data",
      description:
        "Retrieve raw policy evaluation report data for a specific report, including component violations and quarantine status.",
      parameters: z.object({
        applicationId: z.string().min(1).describe("Internal application ID"),
        reportId: z.string().min(1).describe("Report ID"),
      }),
      async execute(args, ctx) {
        logger.info("tool.get_report_data", {
          applicationId: args.applicationId,
          reportId: args.reportId,
        });
        ctx.log.info("Fetching report data", {
          applicationId: args.applicationId,
          reportId: args.reportId,
        });
        return tracer.withSpan("tool.get_report_data", async (span) => {
          span.setAttribute("applicationId", args.applicationId);
          span.setAttribute("reportId", args.reportId);
          try {
            const data = await iqService.getReportData(args.applicationId, args.reportId);
            ctx.log.info("Report data retrieved", {
              applicationName: data.applicationName,
              componentCount: data.components?.length ?? 0,
            });
            return JSON.stringify(data, null, 2);
          } catch (err) {
            ctx.log.error("Failed to fetch report data", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "evaluate_components",
      description:
        "Submit one or more components for policy evaluation against a Sonatype IQ Server application. " +
        "Provide components as an array of objects with packageUrl (purl) and/or hash.",
      parameters: z.object({
        applicationId: z
          .string()
          .min(1)
          .describe("Internal application ID to evaluate against"),
        components: z
          .array(
            z.object({
              packageUrl: z
                .string()
                .optional()
                .describe("Package URL (purl) e.g. pkg:maven/org.example/my-lib@1.0.0"),
              hash: z.string().optional().describe("SHA-1 hash of the component"),
              displayName: z.string().optional().describe("Human-readable display name"),
            })
          )
          .min(1)
          .describe("Components to evaluate"),
      }),
      async execute(args, ctx) {
        logger.info("tool.evaluate_components", {
          applicationId: args.applicationId,
          count: args.components.length,
        });
        ctx.log.info("Submitting component evaluation", {
          applicationId: args.applicationId,
          count: args.components.length,
        });
        return tracer.withSpan("tool.evaluate_components", async (span) => {
          span.setAttribute("applicationId", args.applicationId);
          span.setAttribute("componentCount", args.components.length);
          try {
            const submission = await iqService.submitComponentEvaluation(
              args.applicationId,
              { components: args.components }
            );
            ctx.log.info("Evaluation submitted", { resultId: submission.resultId });
            return JSON.stringify(submission, null, 2);
          } catch (err) {
            ctx.log.error("Failed to submit evaluation", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "get_evaluation_results",
      description:
        "Retrieve the results of a previously submitted component evaluation from Sonatype IQ Server.",
      parameters: z.object({
        resultId: z
          .string()
          .min(1)
          .describe("Result ID returned by evaluate_components"),
      }),
      async execute(args, ctx) {
        logger.info("tool.get_evaluation_results", { resultId: args.resultId });
        ctx.log.info("Fetching evaluation results", { resultId: args.resultId });
        return tracer.withSpan("tool.get_evaluation_results", async (span) => {
          span.setAttribute("resultId", args.resultId);
          try {
            const results = await iqService.getComponentEvaluationResults(args.resultId);
            ctx.log.info("Evaluation results retrieved", {
              applicationId: results.applicationId,
              resultCount: results.results?.length ?? 0,
            });
            return JSON.stringify(results, null, 2);
          } catch (err) {
            ctx.log.error("Failed to fetch evaluation results", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "list_waivers",
      description:
        "List all active policy waivers for a specific application in Sonatype IQ Server.",
      parameters: z.object({
        applicationId: z.string().min(1).describe("Internal application ID"),
      }),
      async execute(args, ctx) {
        logger.info("tool.list_waivers", { applicationId: args.applicationId });
        ctx.log.info("Listing policy waivers", { applicationId: args.applicationId });
        return tracer.withSpan("tool.list_waivers", async (span) => {
          span.setAttribute("applicationId", args.applicationId);
          try {
            const waivers = await iqService.getWaivers(args.applicationId);
            span.setAttribute("count", waivers.length);
            ctx.log.info("Waivers retrieved", { count: waivers.length });
            return JSON.stringify(waivers, null, 2);
          } catch (err) {
            ctx.log.error("Failed to list waivers", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),

    defineTool({
      name: "get_source_control",
      description:
        "Get the source control configuration entry for a Sonatype IQ Server owner (application or organization).",
      parameters: z.object({
        ownerType: z
          .enum(["application", "organization", "global"])
          .describe("The type of owner: application, organization, or global"),
        ownerId: z.string().min(1).describe("The internal ID of the owner"),
      }),
      async execute(args, ctx) {
        logger.info("tool.get_source_control", {
          ownerType: args.ownerType,
          ownerId: args.ownerId,
        });
        ctx.log.info("Fetching source control entry", {
          ownerType: args.ownerType,
          ownerId: args.ownerId,
        });
        return tracer.withSpan("tool.get_source_control", async (span) => {
          span.setAttribute("ownerType", args.ownerType);
          span.setAttribute("ownerId", args.ownerId);
          try {
            const entry = await iqService.getSourceControlEntry(args.ownerType, args.ownerId);
            ctx.log.info("Source control entry retrieved", { id: entry.id });
            return JSON.stringify(entry, null, 2);
          } catch (err) {
            ctx.log.error("Failed to get source control entry", { error: String(err) });
            return formatError(err);
          }
        });
      },
    }),
  ];
}
