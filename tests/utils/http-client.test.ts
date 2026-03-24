/// <reference types="bun-types" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { HttpClient, HttpError } from "../../src/utils/http-client.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? "OK" : "Server Error",
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, statusText = "Error"): Response {
  return new Response("error body", { status, statusText });
}

// ─── HttpError ───────────────────────────────────────────────────────────────

describe("HttpError", () => {
  test("stores status, statusText, body and url", () => {
    const err = new HttpError(404, "Not Found", "body text", "https://api.test/resource");
    expect(err.status).toBe(404);
    expect(err.statusText).toBe("Not Found");
    expect(err.body).toBe("body text");
    expect(err.url).toBe("https://api.test/resource");
  });

  test("sets name to HttpError", () => {
    const err = new HttpError(500, "ISE", "", "https://api.test/");
    expect(err.name).toBe("HttpError");
  });

  test("message includes status code, status text and url", () => {
    const err = new HttpError(403, "Forbidden", "", "https://api.test/admin");
    expect(err.message).toContain("403");
    expect(err.message).toContain("Forbidden");
    expect(err.message).toContain("https://api.test/admin");
  });

  test("is an instance of Error", () => {
    expect(new HttpError(400, "Bad Request", "", "url")).toBeInstanceOf(Error);
  });
});

// ─── HttpClient ──────────────────────────────────────────────────────────────

describe("HttpClient", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = mock(() => Promise.resolve(jsonResponse({})));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock;
  });

  // ─── baseUrl ──────────────────────────────────────────────────────────────

  describe("baseUrl normalisation", () => {
    test("strips trailing slash from baseUrl", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      const client = new HttpClient({ baseUrl: "https://api.test/", retryCount: 0 });
      await client.get("/path");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/path");
    });

    test("concatenates path correctly without double slash", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await client.get("/v1/items");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/v1/items");
    });
  });

  // ─── Authentication ───────────────────────────────────────────────────────

  describe("authentication", () => {
    test("injects Basic-Auth header when credentials are provided", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      const client = new HttpClient({
        baseUrl: "https://api.test",
        username: "alice",
        password: "s3cret",
        retryCount: 0,
      });
      await client.get("/secure");
      const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
      const expected = "Basic " + Buffer.from("alice:s3cret").toString("base64");
      expect(headers["Authorization"]).toBe(expected);
    });

    test("omits Authorization header when no credentials provided", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await client.get("/open");
      const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  // ─── HTTP methods ─────────────────────────────────────────────────────────

  describe("GET", () => {
    test("calls fetch with GET method", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      const result = await client.get<{ id: number }>("/items/1");
      expect(result).toEqual({ id: 1 });
      expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    });

    test("passes extra headers when provided", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await client.get("/items", { "X-Custom": "value" });
      const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
      expect(headers["X-Custom"]).toBe("value");
    });
  });

  describe("POST", () => {
    test("calls fetch with POST method and serialised body", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ created: true }));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await client.post("/items", { name: "widget" });
      const init = fetchMock.mock.calls[0][1];
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ name: "widget" }));
    });

    test("sends no body when none provided", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await client.post("/action");
      expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    });
  });

  describe("PUT", () => {
    test("calls fetch with PUT method and serialised body", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ updated: true }));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await client.put("/items/1", { name: "updated" });
      const init = fetchMock.mock.calls[0][1];
      expect(init.method).toBe("PUT");
      expect(init.body).toBe(JSON.stringify({ name: "updated" }));
    });
  });

  describe("DELETE", () => {
    test("calls fetch with DELETE method", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await client.delete("/items/1");
      expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    });
  });

  // ─── Response parsing ─────────────────────────────────────────────────────

  describe("response parsing", () => {
    test("returns parsed JSON body", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ value: 42 }));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      const result = await client.get<{ value: number }>("/resource");
      expect(result).toEqual({ value: 42 });
    });

    test("returns undefined for empty response body", async () => {
      fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      const result = await client.get("/empty");
      expect(result).toBeUndefined();
    });
  });

  // ─── Error handling ───────────────────────────────────────────────────────

  describe("error handling", () => {
    test("throws HttpError immediately on 404 (no retry)", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(404, "Not Found"));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 3, retryDelayMs: 1 });
      await expect(client.get("/missing")).rejects.toBeInstanceOf(HttpError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("throws HttpError immediately on 401 (no retry)", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(401, "Unauthorized"));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 3, retryDelayMs: 1 });
      await expect(client.get("/secure")).rejects.toBeInstanceOf(HttpError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("includes correct status on thrown HttpError", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(422, "Unprocessable"));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      const err = await client.get("/bad").catch((e) => e);
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(422);
    });
  });

  // ─── Retry logic ─────────────────────────────────────────────────────────

  describe("retry logic", () => {
    test("retries on 503 and succeeds on subsequent attempt", async () => {
      fetchMock
        .mockResolvedValueOnce(errorResponse(503, "Service Unavailable"))
        .mockResolvedValueOnce(errorResponse(503, "Service Unavailable"))
        .mockResolvedValueOnce(jsonResponse({ recovered: true }));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 3, retryDelayMs: 1 });
      const result = await client.get<{ recovered: boolean }>("/flaky");
      expect(result).toEqual({ recovered: true });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    }, 5000);

    test("retries on 429 (rate-limited) and succeeds", async () => {
      fetchMock
        .mockResolvedValueOnce(errorResponse(429, "Too Many Requests"))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 2, retryDelayMs: 1 });
      const result = await client.get<{ ok: boolean }>("/limited");
      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    }, 5000);

    test("exhausts all retries on persistent 5xx and throws", async () => {
      fetchMock.mockResolvedValue(errorResponse(500, "Internal Server Error"));
      // retryCount: 2 → 1 initial + 2 retries = 3 total attempts
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 2, retryDelayMs: 1 });
      await expect(client.get("/broken")).rejects.toBeInstanceOf(HttpError);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    }, 5000);

    test("does not retry when retryCount is 0", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(500, "Internal Server Error"));
      const client = new HttpClient({ baseUrl: "https://api.test", retryCount: 0 });
      await expect(client.get("/broken")).rejects.toBeInstanceOf(HttpError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
