/**
 * Sabotage toggles: force each failure on demand, for testing and demos.
 *
 * OFF unless NEXT_PUBLIC_ENABLE_SABOTAGE === "true" (checked on both the
 * client and the server). Leave it unset in production; set it on a preview
 * deployment to record the failure states. See docs/failure-inventory.md.
 *
 * Chat (open the page with ?sabotage=<mode>, or send the
 * x-devlog-sabotage header / ?sabotage= to /api/chat directly):
 *   throw       the route handler throws before streaming
 *   midstream   a few tokens stream, then the upstream model errors
 *   disconnect  a few tokens stream, then the connection is cut
 *   429         HTTP 429 with Retry-After
 *   overloaded  HTTP 529 (model overloaded)
 *   malformed   the model returns a tool call whose input isn't valid JSON
 *   slow        the first token is delayed by ~10s
 *   empty       the model finishes without saying anything
 * Pages:
 *   crash       the page throws while rendering → error.tsx boundary
 *               (/?sabotage=crash for the chat, /logs?sabotage=crash for app/error.tsx)
 *   nologs      /logs renders as if no entries exist (first-run empty state)
 *
 * Chat sabotage applies to new messages only, not to Retry, so a retry
 * shows the recovery.
 */

export const SABOTAGE_MODES = [
  "throw",
  "midstream",
  "disconnect",
  "429",
  "overloaded",
  "malformed",
  "slow",
  "empty",
  "crash",
  "nologs",
] as const;

export type SabotageMode = (typeof SABOTAGE_MODES)[number];

export const SABOTAGE_HEADER = "x-devlog-sabotage";

/** Inlined at build time for the client bundle; read at runtime on the server. */
export const SABOTAGE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SABOTAGE === "true";

/** A valid mode when sabotage is enabled, otherwise null (whatever was asked for). */
export function parseSabotage(value: unknown): SabotageMode | null {
  if (!SABOTAGE_ENABLED || typeof value !== "string") return null;
  return SABOTAGE_MODES.find((m) => m === value) ?? null;
}
