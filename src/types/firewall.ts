/**
 * TypeScript types for the Sonatype IQ Server Firewall REST API (v2).
 * Docs: https://help.sonatype.com/en/firewall-apis.html
 */

// ─── Firewall Metrics ────────────────────────────────────────────────────────

export interface FirewallMetrics {
  /** Total number of components quarantined since inception */
  totalComponentsQuarantined: number;
  /** Components quarantined in the last 7 days */
  componentsQuarantinedLast7Days: number;
  /** Components quarantined in the last 30 days */
  componentsQuarantinedLast30Days: number;
  /** Number of repositories with quarantine enabled */
  repositoriesWithQuarantineEnabled: number;
  /** Total number of active policy violations */
  totalPolicyViolations?: number;
  [key: string]: unknown;
}

// ─── Quarantine Summary ───────────────────────────────────────────────────────

export interface QuarantineRepositorySummary {
  repositoryId: string;
  repositoryName: string;
  repositoryFormat: string;
  quarantinedComponentCount: number;
}

export interface QuarantineSummary {
  quarantinedComponentCount: number;
  repositoryCount: number;
  repositories: QuarantineRepositorySummary[];
}

// ─── Release Quarantine Summary ───────────────────────────────────────────────

export interface ReleaseQuarantineSummary {
  autoReleasedComponentCount: number;
  repositoryCount: number;
  lastUpdated?: string;
}

// ─── Release Quarantine Configuration ─────────────────────────────────────────

export interface ReleaseQuarantineCondition {
  conditionTypeId: string;
  conditionTypeName: string;
  conditionValue: string;
}

export interface ReleaseQuarantineConfiguration {
  enabled: boolean;
  conditions: ReleaseQuarantineCondition[];
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface IqApplication {
  id: string;
  publicId: string;
  name: string;
  organizationId: string;
  contactUserName?: string;
  applicationTags?: { id: string; tagId: string; applicationId: string }[];
}

export interface IqApplicationsResponse {
  applications: IqApplication[];
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface IqOrganization {
  id: string;
  name: string;
  parentOrganizationId?: string;
  tags?: { id: string }[];
}

export interface IqOrganizationsResponse {
  organizations: IqOrganization[];
}

// ─── Policy Violations ────────────────────────────────────────────────────────

export interface PolicyViolationComponent {
  componentIdentifier: {
    format: string;
    coordinates: Record<string, string>;
  };
  hash?: string;
  displayName?: string;
}

export interface PolicyViolationAction {
  actionTypeId: string;
  policyName: string;
  threatLevel: number;
}

export interface PolicyViolation {
  policyViolationId: string;
  policyId: string;
  policyName: string;
  policyThreatLevel: number;
  constraintViolations: ConstraintViolation[];
  waived: boolean;
  grandfathered: boolean;
}

export interface ConstraintViolation {
  constraintId: string;
  constraintName: string;
  reasons: { reference?: unknown }[];
}

// ─── Component Evaluation ─────────────────────────────────────────────────────

export interface ComponentCoordinates {
  packageId?: string;
  version?: string;
  extension?: string;
  qualifier?: string;
  artifactId?: string;
  groupId?: string;
  name?: string;
}

export interface ComponentIdentifier {
  format: string;
  coordinates: ComponentCoordinates;
}

export interface ComponentEvaluationRequest {
  components: {
    packageUrl?: string;
    componentIdentifier?: ComponentIdentifier;
    hash?: string;
    displayName?: string;
  }[];
}

export interface ComponentEvaluationSubmitResponse {
  resultId: string;
  submittedDate: string;
  applicationId: string;
  resultsUrl: string;
}

export interface ComponentEvaluationResult {
  resultId: string;
  applicationId: string;
  results: {
    component: { packageUrl?: string; componentIdentifier?: ComponentIdentifier };
    matchState: string;
    pathnames?: string[];
    licenseData?: { declaredLicenses?: string[]; effectiveLicenses?: string[] };
    securityData?: {
      securityIssues?: {
        source: string;
        reference: string;
        severity: number;
        status: string;
        url?: string;
        threatCategory?: string;
        cweId?: string;
        cvssVector?: string;
      }[];
    };
    policyData?: {
      policyViolations?: PolicyViolation[];
    };
    quarantined?: boolean;
  }[];
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface PolicyReport {
  applicationId: string;
  applicationName: string;
  reportTitle: string;
  stage: string;
  evaluationDate: string;
  reportDataUrl: string;
  reportPdfUrl: string;
}

export interface PolicyReportSummary {
  applicationId: string;
  applicationName: string;
  organizationId: string;
  reports: PolicyReport[];
}

export interface PolicyReportDataResponse {
  applicationId: string;
  applicationName: string;
  reportTime: number;
  reportTitle: string;
  commitHash?: string;
  initiator?: string;
  components: {
    packageUrl?: string;
    componentIdentifier?: ComponentIdentifier;
    displayName?: string;
    quarantined?: boolean;
    violations?: PolicyViolation[];
  }[];
}

// ─── Waivers ──────────────────────────────────────────────────────────────────

export interface Waiver {
  waiverId: string;
  policyViolationId: string;
  comment?: string;
  createTime: string;
  expiryTime?: string;
  active: boolean;
}

// ─── Source Control ───────────────────────────────────────────────────────────

export interface SourceControlEntry {
  id: string;
  ownerId: string;
  ownerType: string;
  repositoryUrl: string;
  token?: string;
  provider?: string;
  baseBranch?: string;
  remediationPullRequestsEnabled?: boolean;
}

// ─── Proxy Configuration (Nexus side) ────────────────────────────────────────

export interface NexusIqConfiguration {
  enabled: boolean;
  showLink: boolean;
  url: string;
  authenticationType: string;
  username?: string;
  useTrustStoreForUrl: boolean;
  timeoutSeconds?: number;
  properties?: string;
}

export interface NexusIqConnectionStatus {
  success: boolean;
  reason?: string;
}
