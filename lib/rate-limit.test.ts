import { beforeEach, describe, expect, it } from "vitest";
import { allow, resetRateLimit } from "@/lib/rate-limit";

const MINUTE = 60_000;

describe("allow", () => {
  beforeEach(() => resetRateLimit());

  it("permits the first three submissions from one key", () => {
    expect(allow("1.1.1.1", 0)).toBe(true);
    expect(allow("1.1.1.1", 1000)).toBe(true);
    expect(allow("1.1.1.1", 2000)).toBe(true);
  });

  it("refuses the fourth inside the window", () => {
    for (const at of [0, 1000, 2000]) allow("1.1.1.1", at);
    expect(allow("1.1.1.1", 3000)).toBe(false);
  });

  it("permits again once the window has passed", () => {
    for (const at of [0, 1000, 2000]) allow("1.1.1.1", at);
    expect(allow("1.1.1.1", 11 * MINUTE)).toBe(true);
  });

  it("counts each key separately", () => {
    for (const at of [0, 1000, 2000]) allow("1.1.1.1", at);
    expect(allow("2.2.2.2", 3000)).toBe(true);
  });

  it("does not let a refused attempt extend the window", () => {
    // A bot hammering the endpoint must not push its own unblock time back
    // forever; only accepted submissions are recorded.
    for (const at of [0, 1000, 2000]) allow("1.1.1.1", at);
    expect(allow("1.1.1.1", 9 * MINUTE)).toBe(false);
    expect(allow("1.1.1.1", 11 * MINUTE)).toBe(true);
  });
});
