import { beforeEach, describe, expect, it } from "vitest";
import { allow, LIMIT, resetRateLimit } from "@/lib/rate-limit";

const MINUTE = 60_000;

describe("allow", () => {
  beforeEach(() => resetRateLimit());

  /** Spends the whole budget for `key`, one submission per second. */
  const exhaust = (key: string) => {
    for (let i = 0; i < LIMIT; i += 1) allow(key, i * 1000);
  };

  it("permits a visitor to submit repeatedly within the budget", () => {
    for (let i = 0; i < LIMIT; i += 1) {
      expect(allow("1.1.1.1", i * 1000)).toBe(true);
    }
  });

  it("refuses the one past the budget, inside the window", () => {
    exhaust("1.1.1.1");
    expect(allow("1.1.1.1", LIMIT * 1000)).toBe(false);
  });

  it("permits again once the window has passed", () => {
    exhaust("1.1.1.1");
    expect(allow("1.1.1.1", 11 * MINUTE)).toBe(true);
  });

  it("counts each key separately", () => {
    // Two visitors behind one carrier address would share a key; two different
    // addresses must never share a budget.
    exhaust("1.1.1.1");
    expect(allow("2.2.2.2", LIMIT * 1000)).toBe(true);
  });

  it("does not let a refused attempt extend the window", () => {
    // A bot hammering the endpoint must not push its own unblock time back
    // forever; only accepted submissions are recorded.
    exhaust("1.1.1.1");
    expect(allow("1.1.1.1", 9 * MINUTE)).toBe(false);
    expect(allow("1.1.1.1", 11 * MINUTE)).toBe(true);
  });
});
