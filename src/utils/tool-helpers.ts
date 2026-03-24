/**
 * Typed tool definition helper.
 * Calling defineTool() forces TypeScript to infer the Params generic from the
 * `parameters` field, which in turn properly types `args` inside `execute`.
 * Without this wrapper, TypeScript loses the Params type when tools are placed
 * in a loosely-typed array.
 */

import type { FastMCPSessionAuth, Tool, ToolParameters } from "fastmcp";

export function defineTool<Params extends ToolParameters>(
  tool: Tool<FastMCPSessionAuth, Params>
): Tool<FastMCPSessionAuth, Params> {
  return tool;
}
