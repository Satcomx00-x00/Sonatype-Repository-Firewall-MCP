/// <reference types="bun-types" />

import { describe, test, expect } from "bun:test";
import { defineTool } from "../../src/utils/tool-helpers.js";
import type { Tool, ToolParameters } from "fastmcp";

// ─── defineTool ──────────────────────────────────────────────────────────────

describe("defineTool", () => {
  test("returns the same tool object that was passed in", () => {
    const tool = {
      name: "test-tool",
      description: "A test tool",
      parameters: {},
      execute: async () => "ok",
    } as unknown as Tool<never, ToolParameters>;

    const result = defineTool(tool);
    expect(result).toBe(tool);
  });

  test("preserves all tool properties", () => {
    const execute = async () => "result";
    const tool = {
      name: "my-tool",
      description: "My tool description",
      parameters: { type: "object", properties: {} },
      execute,
    } as unknown as Tool<never, ToolParameters>;

    const result = defineTool(tool);
    expect(result.name).toBe("my-tool");
    expect(result.description).toBe("My tool description");
    expect(result.execute).toBe(execute);
  });

  test("does not mutate the tool object", () => {
    const tool = {
      name: "immutable-tool",
      description: "unchanged",
      parameters: {},
      execute: async () => "",
    } as unknown as Tool<never, ToolParameters>;

    const nameBefore = tool.name;
    defineTool(tool);
    expect(tool.name).toBe(nameBefore);
  });
});
