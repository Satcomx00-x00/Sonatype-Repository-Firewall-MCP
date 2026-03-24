/**
 * Generic HTTP client with:
 *   – Basic-Auth header injection
 *   – Configurable timeout (AbortController)
 *   – Exponential back-off retry on transient failures (5xx / network errors)
 *   – Structured logging and tracing on every request
 *
 * Single Responsibility: knows nothing about Sonatype endpoints.
 */

import { logger } from "./logger.js";
import { tracer } from "./tracer.js";

export interface HttpClientOptions {
  baseUrl: string;
  username?: string;
  password?: string;
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
    public readonly url: string
  ) {
    super(`HTTP ${status} ${statusText} — ${url}`);
    this.name = "HttpError";
  }
}

function isTransientError(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: string | undefined;
  private readonly timeoutMs: number;
  private readonly retryCount: number;
  private readonly retryDelayMs: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.retryCount = options.retryCount ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 500;

    if (options.username !== undefined && options.password !== undefined) {
      const encoded = Buffer.from(
        `${options.username}:${options.password}`
      ).toString("base64");
      this.authHeader = `Basic ${encoded}`;
    }
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method = "GET", path, body, headers: extraHeaders = {} } = options;
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extraHeaders,
    };

    if (this.authHeader) {
      headers["Authorization"] = this.authHeader;
    }

    return tracer.withSpan(`http.${method} ${path}`, async (span) => {
      span.setAttribute("http.method", method);
      span.setAttribute("http.url", url);

      let lastError: unknown;

      for (let attempt = 0; attempt <= this.retryCount; attempt++) {
        if (attempt > 0) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          logger.warn("http.retry", { url, attempt, delayMs: delay });
          await sleep(delay);
        }

        const controller = new AbortController();
        const timer = setTimeout(
          () => controller.abort(),
          this.timeoutMs
        );

        try {
          logger.debug("http.request", { method, url, attempt });

          const response = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          span.setAttribute("http.status", response.status);

          if (!response.ok) {
            const responseBody = await response.text().catch(() => "");
            if (isTransientError(response.status)) {
              lastError = new HttpError(
                response.status,
                response.statusText,
                responseBody,
                url
              );
              logger.warn("http.transient_error", {
                status: response.status,
                url,
                attempt,
              });
              continue;
            }
            throw new HttpError(
              response.status,
              response.statusText,
              responseBody,
              url
            );
          }

          const text = await response.text();
          const data = text ? (JSON.parse(text) as T) : (undefined as T);
          logger.debug("http.response", { status: response.status, url });
          return data;
        } catch (err) {
          if (
            err instanceof HttpError &&
            !isTransientError(err.status)
          ) {
            throw err;
          }
          if (err instanceof DOMException && err.name === "AbortError") {
            lastError = new Error(
              `Request timed out after ${this.timeoutMs}ms: ${url}`
            );
            logger.warn("http.timeout", { url, attempt });
            continue;
          }
          lastError = err;
          logger.warn("http.network_error", { url, attempt, error: String(err) });
        } finally {
          clearTimeout(timer);
        }
      }

      span.recordException(lastError);
      throw lastError;
    });
  }

  /** Convenience GET */
  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: "GET", path, headers });
  }

  /** Convenience POST */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", path, body });
  }

  /** Convenience PUT */
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "PUT", path, body });
  }

  /** Convenience DELETE */
  delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: "DELETE", path });
  }
}
