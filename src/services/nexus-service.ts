/**
 * Nexus Repository Manager service.
 * Single Responsibility: wraps Nexus REST API v1 IQ/Firewall integration calls.
 * Dependency Inversion: receives HttpClient via constructor.
 */

import type { HttpClient } from "../utils/http-client.js";
import type {
  NexusIqConfiguration,
  NexusIqConnectionStatus,
} from "../types/firewall.js";

export class NexusService {
  constructor(private readonly http: HttpClient) {}

  // ─── IQ / Firewall Configuration ──────────────────────────────────────────

  getIqConfiguration(): Promise<NexusIqConfiguration> {
    return this.http.get<NexusIqConfiguration>("/service/rest/v1/iq");
  }

  updateIqConfiguration(
    config: NexusIqConfiguration
  ): Promise<NexusIqConfiguration> {
    return this.http.put<NexusIqConfiguration>("/service/rest/v1/iq", config);
  }

  verifyIqConnection(): Promise<NexusIqConnectionStatus> {
    return this.http.post<NexusIqConnectionStatus>(
      "/service/rest/v1/iq/verify-connection"
    );
  }

  enableFirewall(): Promise<void> {
    return this.http.post<void>("/service/rest/v1/iq/enable");
  }

  disableFirewall(): Promise<void> {
    return this.http.post<void>("/service/rest/v1/iq/disable");
  }
}
