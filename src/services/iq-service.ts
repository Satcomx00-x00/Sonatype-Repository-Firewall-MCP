/**
 * Sonatype IQ Server service.
 * Single Responsibility: wraps all IQ Server REST API v2 Firewall calls.
 * Dependency Inversion: receives HttpClient via constructor.
 */

import type { HttpClient } from "../utils/http-client.js";
import type {
  FirewallMetrics,
  IqApplication,
  IqApplicationsResponse,
  IqOrganization,
  IqOrganizationsResponse,
  PolicyReport,
  PolicyReportDataResponse,
  PolicyReportSummary,
  QuarantineSummary,
  ReleaseQuarantineConfiguration,
  ReleaseQuarantineSummary,
  ComponentEvaluationRequest,
  ComponentEvaluationResult,
  ComponentEvaluationSubmitResponse,
  SourceControlEntry,
  Waiver,
} from "../types/firewall.js";

export class IqService {
  constructor(private readonly http: HttpClient) {}

  // ─── Firewall Metrics ──────────────────────────────────────────────────────

  getFirewallMetrics(): Promise<FirewallMetrics> {
    return this.http.get<FirewallMetrics>(
      "/api/v2/firewall/metrics/embedded"
    );
  }

  // ─── Quarantine ───────────────────────────────────────────────────────────

  getQuarantineSummary(): Promise<QuarantineSummary> {
    return this.http.get<QuarantineSummary>(
      "/api/v2/firewall/quarantine/summary"
    );
  }

  getReleaseQuarantineSummary(): Promise<ReleaseQuarantineSummary> {
    return this.http.get<ReleaseQuarantineSummary>(
      "/api/v2/firewall/releaseQuarantine/summary"
    );
  }

  getReleaseQuarantineConfiguration(): Promise<ReleaseQuarantineConfiguration> {
    return this.http.get<ReleaseQuarantineConfiguration>(
      "/api/v2/firewall/releaseQuarantine/configuration"
    );
  }

  // ─── Applications ─────────────────────────────────────────────────────────

  async getApplications(
    publicId?: string
  ): Promise<IqApplication[]> {
    const qs = publicId
      ? `?publicId=${encodeURIComponent(publicId)}`
      : "";
    const response = await this.http.get<IqApplicationsResponse>(
      `/api/v2/applications${qs}`
    );
    return response.applications ?? [];
  }

  getApplication(applicationId: string): Promise<IqApplication> {
    return this.http.get<IqApplication>(
      `/api/v2/applications/${encodeURIComponent(applicationId)}`
    );
  }

  // ─── Organizations ────────────────────────────────────────────────────────

  async getOrganizations(): Promise<IqOrganization[]> {
    const response = await this.http.get<IqOrganizationsResponse>(
      "/api/v2/organizations"
    );
    return response.organizations ?? [];
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  async getApplicationReports(applicationId: string): Promise<PolicyReport[]> {
    const response = await this.http.get<PolicyReportSummary>(
      `/api/v2/reports/applications/${encodeURIComponent(applicationId)}`
    );
    return response.reports ?? [];
  }

  getReportData(
    applicationId: string,
    reportId: string
  ): Promise<PolicyReportDataResponse> {
    return this.http.get<PolicyReportDataResponse>(
      `/api/v2/applications/${encodeURIComponent(applicationId)}/reports/${encodeURIComponent(reportId)}/raw`
    );
  }

  // ─── Component Evaluation ─────────────────────────────────────────────────

  submitComponentEvaluation(
    applicationId: string,
    request: ComponentEvaluationRequest
  ): Promise<ComponentEvaluationSubmitResponse> {
    return this.http.post<ComponentEvaluationSubmitResponse>(
      `/api/v2/evaluation/applications/${encodeURIComponent(applicationId)}`,
      request
    );
  }

  getComponentEvaluationResults(
    resultId: string
  ): Promise<ComponentEvaluationResult> {
    return this.http.get<ComponentEvaluationResult>(
      `/api/v2/evaluation/results/${encodeURIComponent(resultId)}`
    );
  }

  // ─── Policy Waivers ───────────────────────────────────────────────────────

  async getWaivers(applicationId: string): Promise<Waiver[]> {
    const response = await this.http.get<{ waivers: Waiver[] }>(
      `/api/v2/policyWaivers/application/${encodeURIComponent(applicationId)}`
    );
    return response.waivers ?? [];
  }

  // ─── Source Control ───────────────────────────────────────────────────────

  getSourceControlEntry(
    ownerType: string,
    ownerId: string
  ): Promise<SourceControlEntry> {
    return this.http.get<SourceControlEntry>(
      `/api/v2/sourceControl/${encodeURIComponent(ownerType)}/${encodeURIComponent(ownerId)}`
    );
  }
}
