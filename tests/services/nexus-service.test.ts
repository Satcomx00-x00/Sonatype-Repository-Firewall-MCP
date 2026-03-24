/// <reference types="bun-types" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { NexusService } from "../../src/services/nexus-service.js";
import type { HttpClient } from "../../src/utils/http-client.js";
import type { NexusIqConfiguration, NexusIqConnectionStatus } from "../../src/types/firewall.js";

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

// ─── NexusService ────────────────────────────────────────────────────────────

describe("NexusService", () => {
  let http: ReturnType<typeof makeMockHttp>;
  let service: NexusService;

  beforeEach(() => {
    http = makeMockHttp();
    service = new NexusService(http as unknown as HttpClient);
  });

  const sampleConfig: NexusIqConfiguration = {
    enabled: true,
    showLink: true,
    url: "https://iq.example.com",
    authenticationType: "USER",
    username: "admin",
    useTrustStoreForUrl: false,
    timeoutSeconds: 30,
  };

  // ─── getIqConfiguration ───────────────────────────────────────────────────

  describe("getIqConfiguration", () => {
    test("calls GET /service/rest/v1/iq", async () => {
      http.get.mockResolvedValueOnce(sampleConfig);
      const result = await service.getIqConfiguration();
      expect(result).toEqual(sampleConfig);
      expect(http.get).toHaveBeenCalledWith("/service/rest/v1/iq");
    });
  });

  // ─── updateIqConfiguration ────────────────────────────────────────────────

  describe("updateIqConfiguration", () => {
    test("calls PUT /service/rest/v1/iq with config body", async () => {
      http.put.mockResolvedValueOnce(sampleConfig);
      const result = await service.updateIqConfiguration(sampleConfig);
      expect(result).toEqual(sampleConfig);
      expect(http.put).toHaveBeenCalledWith("/service/rest/v1/iq", sampleConfig);
    });
  });

  // ─── verifyIqConnection ───────────────────────────────────────────────────

  describe("verifyIqConnection", () => {
    test("calls POST /service/rest/v1/iq/verify-connection", async () => {
      const status: NexusIqConnectionStatus = { success: true };
      http.post.mockResolvedValueOnce(status);
      const result = await service.verifyIqConnection();
      expect(result).toEqual(status);
      expect(http.post).toHaveBeenCalledWith("/service/rest/v1/iq/verify-connection");
    });

    test("returns failure status when connection fails", async () => {
      const status: NexusIqConnectionStatus = { success: false, reason: "Connection refused" };
      http.post.mockResolvedValueOnce(status);
      const result = await service.verifyIqConnection();
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Connection refused");
    });
  });

  // ─── enableFirewall ───────────────────────────────────────────────────────

  describe("enableFirewall", () => {
    test("calls POST /service/rest/v1/iq/enable", async () => {
      http.post.mockResolvedValueOnce(undefined);
      await service.enableFirewall();
      expect(http.post).toHaveBeenCalledWith("/service/rest/v1/iq/enable");
    });
  });

  // ─── disableFirewall ──────────────────────────────────────────────────────

  describe("disableFirewall", () => {
    test("calls POST /service/rest/v1/iq/disable", async () => {
      http.post.mockResolvedValueOnce(undefined);
      await service.disableFirewall();
      expect(http.post).toHaveBeenCalledWith("/service/rest/v1/iq/disable");
    });
  });
});
