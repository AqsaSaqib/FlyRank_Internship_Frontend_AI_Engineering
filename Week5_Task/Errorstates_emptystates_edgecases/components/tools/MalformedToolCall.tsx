"use client";

import type { DevLogPart } from "@/lib/chat/types";
import { ToolCard, ToolErrorBody } from "./ToolCard";

export type DynamicToolPart = Extract<DevLogPart, { type: "dynamic-tool" }>;

/**
 * A tool call the SDK couldn't match to a typed tool: the model sent input
 * that isn't valid JSON / doesn't fit the schema, or named a tool that
 * doesn't exist. The SDK reports these as `dynamic-tool` parts. Same designed
 * error card as the typed tools, showing the raw input the model sent.
 */
export function MalformedToolCall({ part }: { part: DynamicToolPart }) {
  const common = { icon: "search" as const, stateKey: part.state };

  if (part.state !== "output-error") {
    // Still arriving, or (unusually) it recovered: a neutral working card.
    return (
      <ToolCard {...common} phase={part.state === "input-streaming" ? "streaming" : "working"} title={`Running ${part.toolName}…`} />
    );
  }

  const raw = typeof part.input === "string" ? part.input : JSON.stringify(part.input ?? null);
  return (
    <ToolCard {...common} phase="error" title="The assistant's tool call was malformed">
      <ToolErrorBody
        errorText={part.errorText}
        attempted={
          <pre className="max-w-full overflow-x-auto rounded-lg border border-border bg-background px-2.5 py-2 font-mono text-xs text-muted-foreground">
            <span className="text-foreground">{part.toolName}</span>({raw})
          </pre>
        }
      />
    </ToolCard>
  );
}
