/// <reference types="bun-types" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { IqService } from "../../src/services/iq-service.js";
import type { HttpClient } from "../../src/utils/http-client.js";
import type {
  FirewallMetrics,
  QuarantineSummary,
  ReleaseQuarantineSummary,
  ReleaseQuarantineConfiguration,
  IqApplication,
  IqOrganization,
  PolicyReport,
  ComponentEvaluationRequest,
  ComponentEvaluationSubmitResponse,
  ComponentEvaluationResult,
  Waiver,
  SourceControlEntry,
} from "../../src/types/firewall.js";

// ─── Mock HttpClient factory ─────────────────────────────────────────────────

function makeMockHttp() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: mock<(...args: any[]) => Promise<any>>(() => Promise.resolve({})),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post: mock<(...args: any[]) => Promise<any>>(() => Promise.resolve({})),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    put: mock<(...args: any[]) => Promise<any>>(() => Promise.resolve({})),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: mock<(...args: any[]) => Promise<any>>(() => Promise.resolve({})),
  };
}

// ─── IqService ───────────────────────────────────────────────────────────────

describe("IqService", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let http: ReturnType<typeof makeMockHttp>;
  let service: IqService;

  beforeEach(() => {
    http = makeMockHttp();
    service = new IqService(http as unknown as HttpClient);
  });

  // ─── Firewall Metrics ──────────────────────────────────────────────────────

  describe("getFirewallMetrics", () => {
    test("calls GET /api/v2/firewall/metrics/embedded", async () => {
      const metrics: FirewallMetrics = {
        totalComponentsQuarantined: 10,
        componentsQuarantinedLast7Days: 2,
        componentsQuarantinedLast30Days: 5,
        repositoriesWithQuarantineEnabled: 3,
      };
      http.get.mockResolvedValueOnce(metrics);
      const result = await service.getFirewallMetrics();
      expect(result).toEqual(metrics);
      expect(http.get).toHaveBeenCalledWith("/api/v2/firewall/metrics/embedded");
    });
  });

  // ─── Quarantine ───────────────────────────────────────────────────────────

  describe("getQuarantineSummary", () => {
    test("calls GET /api/v2/firewall/quarantine/summary", async () => {
      const summary: QuarantineSummary = { quarantinedComponentCount: 5, repositoryCount: 2, repositories: [] };
      http.get.mockResolvedValueOnce(summary);
      const result = await service.getQuarantineSummary();
      expect(result).toEqual(summary);
      expect(http.get).toHaveBeenCalledWith("/api/v2/firewall/quarantine/summary");
    });
  });

  describe("getReleaseQuarantineSummary", () => {
    test("calls GET /api/v2/firewall/releaseQuarantine/summary", async () => {
      const summary: ReleaseQuarantineSummary = { autoReleasedComponentCount: 3, repositoryCount: 1 };
      http.get.mockResolvedValueOnce(summary);
      const result = await service.getReleaseQuarantineSummary();
      expect(result).toEqual(summary);
      expect(http.get).toHaveBeenCalledWith("/api/v2/firewall/releaseQuarantine/summary");
    });
  });

  describe("getReleaseQuarantineConfiguration", () => {
    test("calls GET /api/v2/firewall/releaseQuarantine/configuration", async () => {
      const config: ReleaseQuarantineConfiguration = { enabled: true, conditions: [] };
      http.get.mockResolvedValueOnce(config);
      const result = await service.getReleaseQuarantineConfiguration();
      expect(result).toEqual(config);
      expect(http.get).toHaveBeenCalledWith("/api/v2/firewall/releaseQuarantine/configuration");
    });
  });

  // ─── Applications ─────────────────────────────────────────────────────────

  describe("getApplications", () => {
    const apps: IqApplication[] = [
      { id: "a1", publicId: "app1", name: "App 1", organizationId: "org1" },
    ];

    test("calls GET /api/v2/applications without query string when no publicId", async () => {
      http.get.mockResolvedValueOnce({ applications: apps });
      const result = await service.getApplications();
      expect(result).toEqual(apps);
      expect(http.get).toHaveBeenCalledWith("/api/v2/applications");
    });

    test("appends publicId as query string when provided", async () => {
      http.get.mockResolvedValueOnce({ applications: apps });
      await service.getApplications("my-app");
      expect(http.get).toHaveBeenCalledWith("/api/v2/applications?publicId=my-app");
    });

    test("URL-encodes the publicId query parameter", async () => {
      http.get.mockResolvedValueOnce({ applications: [] });
      await service.getApplications("my app/id");
      expect(http.get).toHaveBeenCalledWith("/api/v2/applications?publicId=my%20app%2Fid");
    });

    test("returns empty array when response has no applications field", async () => {
      http.get.mockResolvedValueOnce({});
      const result = await service.getApplications();
      expect(result).toEqual([]);
    });
  });

  describe("getApplication", () => {
    test("calls GET /api/v2/applications/:id", async () => {
      const app: IqApplication = { id: "a1", publicId: "app1", name: "App 1", organizationId: "org1" };
      http.get.mockResolvedValueOnce(app);
      const result = await service.getApplication("a1");
      expect(result).toEqual(app);
      expect(http.get).toHaveBeenCalledWith("/api/v2/applications/a1");
    });

    test("URL-encodes the application id", async () => {
      http.get.mockResolvedValueOnce({});
      await service.getApplication("app/id with spaces");
      expect(http.get).toHaveBeenCalledWith("/api/v2/applications/app%2Fid%20with%20spaces");
    });
  });

  // ─── Organizations ────────────────────────────────────────────────────────

  describe("getOrganizations", () => {
    test("calls GET /api/v2/organizations and returns organizations array", async () => {
      const orgs: IqOrganization[] = [{ id: "o1", name: "Org 1" }];
      http.get.mockResolvedValueOnce({ organizations: orgs });
      const result = await service.getOrganizations();
      expect(result).toEqual(orgs);
      expect(http.get).toHaveBeenCalledWith("/api/v2/organizations");
    });

    test("returns empty array when response has no organizations field", async () => {
      http.get.mockResolvedValueOnce({});
      const result = await service.getOrganizations();
      expect(result).toEqual([]);
    });
  });

  // ─── Reports ──────────────────────────────────────────────────────────────

  describe("getApplicationReports", () => {
    test("calls GET /api/v2/reports/applications/:id and returns reports", async () => {
      const reports: PolicyReport[] = [
        {
          applicationId: "a1",
          applicationName: "App 1",
          reportTitle: "Report",
          stage: "build",
          evaluationDate: "2025-01-01",
          reportDataUrl: "/data",
          reportPdfUrl: "/pdf",
        },
      ];
      http.get.mockResolvedValueOnce({ reports });
      const result = await service.getApplicationReports("a1");
      expect(result).toEqual(reports);
      expect(http.get).toHaveBeenCalledWith("/api/v2/reports/applications/a1");
    });

    test("returns empty array when response has no reports field", async () => {
      http.get.mockResolvedValueOnce({});
      const result = await service.getApplicationReports("a1");
      expect(result).toEqual([]);
    });
  });

  describe("getReportData", () => {
    test("calls GET /api/v2/applications/:appId/reports/:reportId/raw", async () => {
      http.get.mockResolvedValueOnce({});
      await service.getReportData("app1", "report1");
      expect(http.get).toHaveBeenCalledWith(
        "/api/v2/applications/app1/reports/report1/raw"
      );
    });

    test("URL-encodes both applicationId and reportId", async () => {
      http.get.mockResolvedValueOnce({});
      await service.getReportData("app/1", "report 2");
      expect(http.get).toHaveBeenCalledWith(
        "/api/v2/applications/app%2F1/reports/report%202/raw"
      );
    });
  });

  // ─── Component Evaluation ─────────────────────────────────────────────────

  describe("submitComponentEvaluation", () => {
    test("calls POST /api/v2/evaluation/applications/:id with request body", async () => {
      const submitResponse: ComponentEvaluationSubmitResponse = {
        resultId: "r1",
        submittedDate: "2025-01-01",
        applicationId: "a1",
        resultsUrl: "/results/r1",
      };
      const request: ComponentEvaluationRequest = {
        components: [{ packageUrl: "pkg:npm/lodash@4.17.21" }],
      };
      http.post.mockResolvedValueOnce(submitResponse);
      const result = await service.submitComponentEvaluation("a1", request);
      expect(result).toEqual(submitResponse);
      expect(http.post).toHaveBeenCalledWith(
        "/api/v2/evaluation/applications/a1",
        request
      );
    });
  });

  describe("getComponentEvaluationResults", () => {
    test("calls GET /api/v2/evaluation/results/:resultId", async () => {
      const evalResult: Partial<ComponentEvaluationResult> = {
        resultId: "r1",
        applicationId: "a1",
        results: [],
      };
      http.get.mockResolvedValueOnce(evalResult);
      const result = await service.getComponentEvaluationResults("r1");
      expect(result).toEqual(evalResult);
      expect(http.get).toHaveBeenCalledWith("/api/v2/evaluation/results/r1");
    });
  });

  // ─── Policy Waivers ───────────────────────────────────────────────────────

  describe("getWaivers", () => {
    test("calls GET /api/v2/policyWaivers/application/:id and returns waivers", async () => {
      const waivers: Waiver[] = [
        {
          waiverId: "w1",
          policyViolationId: "pv1",
          createTime: "2025-01-01",
          active: true,
        },
      ];
      http.get.mockResolvedValueOnce({ waivers });
      const result = await service.getWaivers("a1");
      expect(result).toEqual(waivers);
      expect(http.get).toHaveBeenCalledWith("/api/v2/policyWaivers/application/a1");
    });

    test("returns empty array when response has no waivers field", async () => {
      http.get.mockResolvedValueOnce({});
      const result = await service.getWaivers("a1");
      expect(result).toEqual([]);
    });
  });

  // ─── Source Control ───────────────────────────────────────────────────────

  describe("getSourceControlEntry", () => {
    test("calls GET /api/v2/sourceControl/:ownerType/:ownerId", async () => {
      const entry: SourceControlEntry = {
        id: "sc1",
        ownerId: "o1",
        ownerType: "organization",
        repositoryUrl: "https://github.com/org/repo",
      };
      http.get.mockResolvedValueOnce(entry);
      const result = await service.getSourceControlEntry("organization", "o1");
      expect(result).toEqual(entry);
      expect(http.get).toHaveBeenCalledWith("/api/v2/sourceControl/organization/o1");
    });

    test("URL-encodes ownerType and ownerId", async () => {
      http.get.mockResolvedValueOnce({});
      await service.getSourceControlEntry("org type", "id/1");
      expect(http.get).toHaveBeenCalledWith(
        "/api/v2/sourceControl/org%20type/id%2F1"
      );
    });
  });
});
