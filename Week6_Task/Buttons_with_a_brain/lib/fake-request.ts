export type OutcomeMode = "random" | "always-success" | "always-fail";

const MIN_DELAY = 600;
const MAX_DELAY = 1800;
const FAILURE_RATE = 0.2;

/**
 * Pretends to call an API: waits 600–1800ms, then resolves, or rejects 20% of
 * the time in "random" mode. The other modes force the outcome for testing.
 */
export function fakeRequest(mode: OutcomeMode = "random"): Promise<void> {
  const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
  const fails = mode === "always-fail" || (mode === "random" && Math.random() < FAILURE_RATE);

  return new Promise((resolve, reject) => {
    setTimeout(() => (fails ? reject(new Error("Request failed")) : resolve()), delay);
  });
}
