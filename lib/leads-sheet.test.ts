import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendLead } from "@/lib/leads-sheet";
import type { Lead } from "@/lib/lead";

const LEAD: Lead = {
  name: "טל עטר",
  email: "someone@example.com",
  phone: "050-1234567",
  subject: "שאלה על סדנה",
  message: "אשמח לשמוע עוד על הסדנה הקרובה.",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  process.env.LEADS_SHEET_WEBHOOK_URL =
    "https://script.google.com/macros/s/test/exec";
  process.env.LEADS_SHEET_SECRET = "test-secret";
  // The failure paths log deliberately; keep the test output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("appendLead", () => {
  it("posts the lead and the secret as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://script.google.com/macros/s/test/exec");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ secret: "test-secret", ...LEAD });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("retries once and succeeds when the first attempt throws", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after two attempts", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats a non-2xx response as a failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    expect(await appendLead(LEAD)).toBe(false);
  });

  it("treats the script's own refusal as a failure", async () => {
    // A wrong secret answers 200 with {ok:false}. Trusting the status alone is
    // exactly the mistake that made the old form claim success.
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ ok: false, error: "unauthorized" })),
    );
    expect(await appendLead(LEAD)).toBe(false);
  });

  it("treats an unparseable body as a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>error</html>")),
    );
    expect(await appendLead(LEAD)).toBe(false);
  });

  it("tolerates values pasted with surrounding quotes", async () => {
    // A .env file is parsed by dotenv, which strips the quotes. The Vercel
    // dashboard stores the value field literally, so the same paste arrives
    // wrapped in quote characters and every request is refused as
    // unauthorized — a failure that reproduces only in production.
    process.env.LEADS_SHEET_WEBHOOK_URL =
      '"https://script.google.com/macros/s/test/exec"';
    process.env.LEADS_SHEET_SECRET = '"test-secret"';

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://script.google.com/macros/s/test/exec");
    expect(JSON.parse(init.body).secret).toBe("test-secret");
  });

  it("tolerates values pasted with stray whitespace", async () => {
    process.env.LEADS_SHEET_WEBHOOK_URL =
      "  https://script.google.com/macros/s/test/exec\n";
    process.env.LEADS_SHEET_SECRET = "test-secret ";

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://script.google.com/macros/s/test/exec");
    expect(JSON.parse(init.body).secret).toBe("test-secret");
  });

  it("treats a value of nothing but quotes as unconfigured", async () => {
    process.env.LEADS_SHEET_SECRET = '""';
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails without calling out when the environment is not configured", async () => {
    delete process.env.LEADS_SHEET_WEBHOOK_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
