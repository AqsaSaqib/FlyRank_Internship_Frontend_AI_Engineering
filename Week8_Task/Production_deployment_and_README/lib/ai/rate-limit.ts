/**
 * Abuse guard for the public /api/chat route: stops a stranger (or a script)
 * from draining the AI provider's credits.
 *
 * Two limits, checked before any model call:
 *   per client  → a burst limit per minute and a daily cap, keyed by IP
 *   whole app   → a daily cap on model requests across every visitor
 *
 * The counters live in this server instance's memory. On Vercel (Fluid
 * compute) one warm instance serves many requests, so this catches the
 * trivial abuse it's meant for: someone holding Enter or looping curl. It is
 * not a distributed limiter; a determined attacker spread across many IPs and
 * cold instances could exceed it. The provider-side spend cap (set in the
 * Anthropic / Google console) is the real backstop. Swapping the `Map` for
 * Upstash Redis / Vercel KV would make the counts global.
 */
import "server-only";

/** Read once per call so tests (and env changes on redeploy) take effect. */
function limits() {
  return {
    perMinute: positiveInt(process.env.CHAT_RATE_LIMIT_PER_MINUTE, 10),
    perDay: positiveInt(process.env.CHAT_RATE_LIMIT_PER_DAY, 100),
    appPerDay: positiveInt(process.env.CHAT_DAILY_BUDGET, 1_000),
  };
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Timestamps of this client's requests in the last minute, plus a fixed daily window. */
type ClientState = { recent: number[]; dayStart: number; dayCount: number };

const clients = new Map<string, ClientState>();
const app = { dayStart: 0, dayCount: 0 };

/** Bounds memory: an attacker rotating IPs can't grow the map forever. */
const MAX_TRACKED_CLIENTS = 10_000;

export type RateLimitResult =
  | { ok: true }
  /** `burst`: wait `retryAfter` seconds. `daily`: this client or the whole app is out for today. */
  | { ok: false; reason: "burst" | "daily"; retryAfter: number };

/**
 * Count one request from `clientId` and say whether it may go ahead. A
 * rejected request isn't counted, so waiting out the limit always works.
 */
export function checkRateLimit(clientId: string, now = Date.now()): RateLimitResult {
  const { perMinute, perDay, appPerDay } = limits();

  if (now - app.dayStart >= DAY) {
    app.dayStart = now;
    app.dayCount = 0;
  }
  if (app.dayCount >= appPerDay) {
    return { ok: false, reason: "daily", retryAfter: secondsUntil(app.dayStart + DAY, now) };
  }

  let client = clients.get(clientId);
  if (!client || now - client.dayStart >= DAY) {
    client = { recent: [], dayStart: now, dayCount: 0 };
  }
  client.recent = client.recent.filter((t) => now - t < MINUTE);

  if (client.dayCount >= perDay) {
    clients.set(clientId, client);
    return { ok: false, reason: "daily", retryAfter: secondsUntil(client.dayStart + DAY, now) };
  }
  if (client.recent.length >= perMinute) {
    clients.set(clientId, client);
    // The oldest request in the window is the next one to expire.
    return { ok: false, reason: "burst", retryAfter: secondsUntil(client.recent[0] + MINUTE, now) };
  }

  client.recent.push(now);
  client.dayCount += 1;
  app.dayCount += 1;
  // Re-insert so Map order is "least recently seen first", then evict from the front.
  clients.delete(clientId);
  clients.set(clientId, client);
  if (clients.size > MAX_TRACKED_CLIENTS) {
    const oldest = clients.keys().next().value;
    if (oldest !== undefined) clients.delete(oldest);
  }
  return { ok: true };
}

/**
 * Who is asking. Vercel sets `x-forwarded-for` (first entry = the client) and
 * `x-real-ip`; a client can't spoof them past Vercel's edge. Locally both may
 * be missing, and everyone shares one bucket, which is fine for development.
 */
export function clientIdFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "local";
}

/**
 * On unless CHAT_RATE_LIMIT=off. The free mock model spends nothing, so it
 * skips the limiter by default (CHAT_RATE_LIMIT=on forces it, e.g. in tests).
 */
export function rateLimitEnabled(provider: string): boolean {
  const setting = process.env.CHAT_RATE_LIMIT;
  if (setting === "off") return false;
  if (setting === "on") return true;
  return provider !== "mock";
}

/** Tests only: forget every counter. */
export function resetRateLimits() {
  clients.clear();
  app.dayStart = 0;
  app.dayCount = 0;
}

function secondsUntil(time: number, now: number) {
  return Math.max(1, Math.ceil((time - now) / 1000));
}

function positiveInt(raw: string | undefined, fallback: number) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
