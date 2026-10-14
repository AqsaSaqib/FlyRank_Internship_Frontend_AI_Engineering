"use client";

import type { DevLogPart } from "@/lib/chat/types";
import { LogStatsTool } from "./LogStatsTool";
import { QueryLogsTool } from "./QueryLogsTool";
import { SaveEntryTool } from "./SaveEntryTool";

export type DevLogToolPart = Extract<DevLogPart, { type: `tool-${string}` }>;

export function isDevLogToolPart(part: DevLogPart): part is DevLogToolPart {
  return part.type.startsWith("tool-");
}

/** Routes a typed tool part to its component. Each one switches on `part.state`. */
export function ToolPart({ part }: { part: DevLogToolPart }) {
  switch (part.type) {
    case "tool-queryLogs":
      return <QueryLogsTool part={part} />;
    case "tool-getLogStats":
      return <LogStatsTool part={part} />;
    case "tool-saveLogEntry":
      return <SaveEntryTool part={part} />;
  }
}
