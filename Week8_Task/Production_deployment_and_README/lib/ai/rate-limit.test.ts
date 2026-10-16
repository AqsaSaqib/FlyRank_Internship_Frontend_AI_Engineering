// @vitest-environment node
import { checkRateLimit, clientIdFrom, rateLimitEnabled, resetRateLimits } from "./rate-limit";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.stubEnv("CHAT_RATE_LIMIT_PER_MINUTE", "3");
    vi.stubEnv("CHAT_RATE_LIMIT_PER_DAY", "5");
    vi.stubEnv("CHAT_DAILY_BUDGET", "8");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("allows a burst up to the per-minute limit, then asks the client to wait for the oldest request to expire", () => {
    const t0 = 1_000_000;
    expect(checkRateLimit("a", t0)).toEqual({ ok: true });
    expect(checkRateLimit("a", t0 + 10_000)).toEqual({ ok: true });
    expect(checkRateLimit("a", t0 + 20_000)).toEqual({ ok: true });

    expect(checkRateLimit("a", t0 + 30_000)).toEqual({ ok: false, reason: "burst", retryAfter: 30 });
    // Rejected requests aren't counted: once the first one is a minute old, one more fits.
    expect(checkRateLimit("a", t0 + MINUTE)).toEqual({ ok: true });
  });

  it("keeps each client's budget separate", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("a", i);
    expect(checkRateLimit("a", 10).ok).toBe(false);
    expect(checkRateLimit("b", 10)).toEqual({ ok: true });
  });

  it("caps a client per day, and resets the next day", () => {
    for (let i = 0; i < 5; i++) expect(checkRateLimit("a", i * MINUTE).ok).toBe(true);

    const blocked = checkRateLimit("a", 10 * MINUTE);
    expect(blocked).toMatchObject({ ok: false, reason: "daily" });
    expect(checkRateLimit("a", DAY)).toEqual({ ok: true });
  });

  it("caps the whole app per day, whoever is asking", () => {
    for (let i = 0; i < 8; i++) expect(checkRateLimit(`client-${i}`, i).ok).toBe(true);
    expect(checkRateLimit("someone-new", 100)).toMatchObject({ ok: false, reason: "daily" });
  });
});

describe("clientIdFrom", () => {
  const req = (headers: Record<string, string>) => new Request("http://localhost/api/chat", { headers });

  it("uses the first x-forwarded-for entry, then x-real-ip, then a shared local bucket", () => {
    expect(clientIdFrom(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIdFrom(req({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIdFrom(req({}))).toBe("local");
  });
});

describe("rateLimitEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is on for real providers, off for the free mock, and CHAT_RATE_LIMIT overrides both", () => {
    expect(rateLimitEnabled("anthropic")).toBe(true);
    expect(rateLimitEnabled("mock")).toBe(false);
    vi.stubEnv("CHAT_RATE_LIMIT", "on");
    expect(rateLimitEnabled("mock")).toBe(true);
    vi.stubEnv("CHAT_RATE_LIMIT", "off");
    expect(rateLimitEnabled("gemini")).toBe(false);
  });
});
