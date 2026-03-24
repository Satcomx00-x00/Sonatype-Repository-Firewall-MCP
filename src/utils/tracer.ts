/**
 * Lightweight in-process tracing utility.
 * Produces structured span records on stderr as JSON without requiring an
 * OpenTelemetry collector at runtime (zero-dependency tracing).
 *
 * If you want full distributed tracing, replace this module with an
 * @opentelemetry/sdk-node setup — the service layer calls are identical.
 */

import { logger } from "./logger.js";

export interface Span {
  /** Record an attribute on this span. */
  setAttribute(key: string, value: string | number | boolean): void;
  /** Record an error on this span. */
  recordException(error: unknown): void;
  /** Finish the span, emitting the trace record. */
  end(): void;
}

class SpanImpl implements Span {
  private readonly name: string;
  private readonly startMs: number;
  private attributes: Record<string, string | number | boolean> = {};
  private error?: string;

  constructor(name: string) {
    this.name = name;
    this.startMs = performance.now();
  }

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  recordException(error: unknown): void {
    this.error =
      error instanceof Error ? error.message : String(error);
  }

  end(): void {
    const durationMs = Math.round(performance.now() - this.startMs);
    logger.debug("span.end", {
      span: this.name,
      durationMs,
      attributes: this.attributes,
      ...(this.error && { error: this.error }),
    });
  }
}

export const tracer = {
  /**
   * Start a new span with the given name.
   * Always call `span.end()` in a `finally` block.
   */
  startSpan(name: string): Span {
    logger.debug("span.start", { span: name });
    return new SpanImpl(name);
  },

  /**
   * Convenience helper that wraps an async operation in a span,
   * records exceptions automatically, and always calls `end()`.
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(name);
    try {
      const result = await fn(span);
      return result;
    } catch (err) {
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  },
} as const;
