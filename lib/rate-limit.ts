/**
 * A submission budget per client, held in memory.
 *
 * This resets on cold start and is not shared between Vercel instances, so it
 * throttles one attacker against one warm instance rather than enforcing a
 * global limit. That is deliberate: the honeypot and the time-trap do the real
 * work, and a shared limiter would mean running Redis for a landing page. If
 * spam ever arrives, this is the module to swap.
 */

const LIMIT = 3;
const WINDOW_MS = 10 * 60_000;
/** Bounds memory if a flood arrives from many addresses. */
const MAX_KEYS = 5000;

const accepted = new Map<string, number[]>();

export function allow(key: string, now: number = Date.now()): boolean {
  if (accepted.size > MAX_KEYS) accepted.clear();

  const recent = (accepted.get(key) ?? []).filter((at) => now - at < WINDOW_MS);

  if (recent.length >= LIMIT) {
    // Store the pruned list, but do not record this attempt. Recording refusals
    // would let a bot push its own unblock time back indefinitely.
    accepted.set(key, recent);
    return false;
  }

  recent.push(now);
  accepted.set(key, recent);
  return true;
}

export function resetRateLimit(): void {
  accepted.clear();
}
