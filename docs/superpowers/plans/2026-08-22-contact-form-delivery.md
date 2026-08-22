# Contact Form Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the browser-to-FormSubmit relay, which reported success on every submission whether or not anything was delivered, with a Server Action that records each lead in a Google Sheet and emails the owner.

**Architecture:** `Contact.tsx` submits through `useActionState` to `submitContact`, a Server Action. The action screens the submission (honeypot, time-trap, rate limit, validation) and posts the lead to a Google Apps Script Web App, which appends a row and sends the notification. The browser never talks to a third party, and the action gets a real answer back.

**Tech Stack:** Next.js 16.2.12 (App Router), React 19.2.4, TypeScript strict, Vitest + Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-22-contact-form-delivery-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/` before using an unfamiliar Next.js API. This Next.js has breaking changes versus training data. `headers()` is **async** — `await headers()`.
- No new runtime dependencies. Validation is hand-rolled; the project ships exactly one runtime dependency (`yaml`) and that stays true.
- Package manager is **pnpm** (`pnpm-lock.yaml` is authoritative; `package-lock.json` is stale).
- All visitor-facing copy lives in `content/site.yaml` and is Hebrew. Never hardcode a user-visible string in a component.
- Tests run with `pnpm test`. Test files match `{app,lib,components}/**/*.test.{ts,tsx}`.
- The `@/*` path alias maps to the repo root.
- Secrets never enter git. `apps-script/Code.gs` in the repo carries a placeholder secret; the real one lives only in Apps Script and Vercel.
- TypeScript is `strict`. No `any` in committed code.

---

### Task 1: Lead parsing and validation

**Files:**
- Create: `lib/lead.ts`
- Test: `lib/lead.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Lead = { name: string; email: string; phone: string; subject: string; message: string }` and `parseLead(data: FormData, subjects: readonly string[]): Lead | null`. Returns `null` when anything is invalid; trims every field.

- [ ] **Step 1: Write the failing test**

```ts
// lib/lead.test.ts
import { describe, expect, it } from "vitest";
import { parseLead } from "@/lib/lead";

const SUBJECTS = ["שאלה על סדנה", "הרשמה לסדנה"];

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    name: "טל עטר",
    email: "someone@example.com",
    phone: "050-1234567",
    subject: "שאלה על סדנה",
    message: "אשמח לשמוע עוד על הסדנה הקרובה.",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("parseLead", () => {
  it("returns the trimmed lead when every field is valid", () => {
    expect(parseLead(form({ name: "  טל עטר  " }), SUBJECTS)).toEqual({
      name: "טל עטר",
      email: "someone@example.com",
      phone: "050-1234567",
      subject: "שאלה על סדנה",
      message: "אשמח לשמוע עוד על הסדנה הקרובה.",
    });
  });

  it("rejects a malformed email", () => {
    expect(parseLead(form({ email: "not-an-email" }), SUBJECTS)).toBeNull();
    expect(parseLead(form({ email: "a@b" }), SUBJECTS)).toBeNull();
  });

  it("rejects a subject the form never offered", () => {
    // The select only ever emits one of contact.subjects. Anything else came
    // from a script posting directly at the action.
    expect(parseLead(form({ subject: "<script>" }), SUBJECTS)).toBeNull();
  });

  it("rejects a name shorter than two characters", () => {
    expect(parseLead(form({ name: "א" }), SUBJECTS)).toBeNull();
  });

  it("rejects a message shorter than ten characters", () => {
    expect(parseLead(form({ message: "היי" }), SUBJECTS)).toBeNull();
  });

  it("rejects a message longer than five thousand characters", () => {
    expect(parseLead(form({ message: "א".repeat(5001) }), SUBJECTS)).toBeNull();
  });

  it("accepts the phone shapes Israeli visitors actually type", () => {
    for (const phone of ["0501234567", "050-123-4567", "+972 50 123 4567", "(050) 1234567"]) {
      expect(parseLead(form({ phone }), SUBJECTS)?.phone).toBe(phone);
    }
  });

  it("rejects a phone that is not a phone", () => {
    expect(parseLead(form({ phone: "call me" }), SUBJECTS)).toBeNull();
  });

  it("rejects a missing field", () => {
    const data = form();
    data.delete("email");
    expect(parseLead(data, SUBJECTS)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test lib/lead.test.ts`
Expected: FAIL — cannot resolve `@/lib/lead`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/lead.ts
/**
 * Shape and validation of a contact-form submission.
 *
 * Server-side validation is the only validation that counts. The `required` and
 * `type="email"` attributes on the form are a courtesy to the visitor; anything
 * posting straight at the Server Action ignores them entirely.
 */

export type Lead = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

// Deliberately permissive. A stricter pattern rejects valid addresses far more
// often than it catches bad ones, and the address is verified by whether the
// reply arrives, not by a regex.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Israeli numbers as visitors actually type them: 0501234567, 050-123-4567,
// +972 50 123 4567, (050) 1234567.
const PHONE = /^\+?[\d\s()-]{9,20}$/;

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Returns the lead, or `null` if any field is unusable.
 *
 * A single null rather than per-field errors: the form's own HTML validation
 * catches every realistic human mistake first, so reaching here means either a
 * script or a browser we cannot help specifically.
 */
export function parseLead(
  data: FormData,
  subjects: readonly string[],
): Lead | null {
  const lead: Lead = {
    name: field(data.get("name")),
    email: field(data.get("email")),
    phone: field(data.get("phone")),
    subject: field(data.get("subject")),
    message: field(data.get("message")),
  };

  const valid =
    lead.name.length >= 2 &&
    lead.name.length <= 100 &&
    lead.email.length <= 254 &&
    EMAIL.test(lead.email) &&
    PHONE.test(lead.phone) &&
    subjects.includes(lead.subject) &&
    lead.message.length >= 10 &&
    lead.message.length <= 5000;

  return valid ? lead : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test lib/lead.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/lead.ts lib/lead.test.ts
git commit -m "Add server-side lead validation"
```

---

### Task 2: Rate limiter

**Files:**
- Create: `lib/rate-limit.ts`
- Test: `lib/rate-limit.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `allow(key: string, now?: number): boolean` — true when the submission is within budget, false when the key is over it. Budget is 3 per 10 minutes. `resetRateLimit(): void` clears all state, for tests.

- [ ] **Step 1: Write the failing test**

```ts
// lib/rate-limit.test.ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test lib/rate-limit.test.ts`
Expected: FAIL — cannot resolve `@/lib/rate-limit`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/rate-limit.ts
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

  const recent = (accepted.get(key) ?? []).filter(
    (at) => now - at < WINDOW_MS,
  );

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test lib/rate-limit.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts lib/rate-limit.test.ts
git commit -m "Add per-client submission budget"
```

---

### Task 3: Google Sheet webhook client

**Files:**
- Create: `lib/leads-sheet.ts`
- Test: `lib/leads-sheet.test.ts`

**Interfaces:**
- Consumes: `type Lead` from `@/lib/lead` (Task 1).
- Produces: `appendLead(lead: Lead): Promise<boolean>` — true only when the webhook confirmed `{ ok: true }`. Never throws.

Reads `process.env.LEADS_SHEET_WEBHOOK_URL` and `process.env.LEADS_SHEET_SECRET`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/leads-sheet.test.ts
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
  process.env.LEADS_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/test/exec";
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
      vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: "unauthorized" })),
    );
    expect(await appendLead(LEAD)).toBe(false);
  });

  it("treats an unparseable body as a failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>error</html>")));
    expect(await appendLead(LEAD)).toBe(false);
  });

  it("fails without calling out when the environment is not configured", async () => {
    delete process.env.LEADS_SHEET_WEBHOOK_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await appendLead(LEAD)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test lib/leads-sheet.test.ts`
Expected: FAIL — cannot resolve `@/lib/leads-sheet`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/leads-sheet.ts
import type { Lead } from "@/lib/lead";

/**
 * Records a lead in the owner's Google Sheet.
 *
 * The endpoint is an Apps Script Web App: it appends the row, then emails the
 * owner. Two reasons this has to run on the server rather than in the browser:
 * Apps Script answers with a cross-origin redirect to
 * script.googleusercontent.com and sends no CORS headers, so a browser fetch
 * cannot read the result; and the shared secret would have to ship to the page.
 *
 * Never throws. The caller only needs to know whether the lead was recorded.
 */

const TIMEOUT_MS = 6000;
const ATTEMPTS = 2;

export async function appendLead(lead: Lead): Promise<boolean> {
  const url = process.env.LEADS_SHEET_WEBHOOK_URL;
  const secret = process.env.LEADS_SHEET_SECRET;

  if (!url || !secret) {
    console.error(
      "[contact] LEADS_SHEET_WEBHOOK_URL or LEADS_SHEET_SECRET is missing; the lead was not recorded",
    );
    return false;
  }

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, ...lead }),
        // Apps Script can be slow to wake. Long enough to survive a cold
        // start, short enough that the visitor is not left waiting.
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const body: unknown = await response.json();
      if ((body as { ok?: unknown } | null)?.ok !== true) {
        throw new Error(`the script refused the lead: ${JSON.stringify(body)}`);
      }
      return true;
    } catch (error) {
      console.error(
        `[contact] sheet append attempt ${attempt}/${ATTEMPTS} failed:`,
        error,
      );
    }
  }

  return false;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test lib/leads-sheet.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/leads-sheet.ts lib/leads-sheet.test.ts
git commit -m "Add Google Sheet webhook client for leads"
```

---

### Task 4: The Server Action

**Files:**
- Create: `app/actions/contact.ts`
- Test: `app/actions/contact.test.ts`

**Interfaces:**
- Consumes: `parseLead` (Task 1), `allow` (Task 2), `appendLead` (Task 3), `getContent` from `@/lib/content`.
- Produces:
  ```ts
  type ContactState =
    | { status: "idle" }
    | { status: "success" }
    | { status: "error"; reason: "validation" | "rate_limit" | "unavailable" };
  const initialContactState: ContactState;
  function submitContact(previous: ContactState, data: FormData): Promise<ContactState>;
  ```

Form field names the action reads: `name`, `email`, `phone`, `subject`, `message`, `company` (honeypot), `elapsed` (milliseconds since mount).

- [ ] **Step 1: Write the failing test**

```ts
// app/actions/contact.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "1.1.1.1" }),
}));
vi.mock("@/lib/leads-sheet", () => ({ appendLead: vi.fn() }));

import { submitContact, initialContactState } from "@/app/actions/contact";
import { appendLead } from "@/lib/leads-sheet";
import { resetRateLimit } from "@/lib/rate-limit";
import { getContent } from "@/lib/content";

const appendLeadMock = vi.mocked(appendLead);
const SUBJECT = getContent().contact.subjects[0];

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    name: "טל עטר",
    email: "someone@example.com",
    phone: "050-1234567",
    subject: SUBJECT,
    message: "אשמח לשמוע עוד על הסדנה הקרובה.",
    company: "",
    elapsed: "9000",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  resetRateLimit();
  appendLeadMock.mockReset();
  appendLeadMock.mockResolvedValue(true);
});

describe("submitContact", () => {
  it("records a valid lead and reports success", async () => {
    const result = await submitContact(initialContactState, form());

    expect(result).toEqual({ status: "success" });
    expect(appendLeadMock).toHaveBeenCalledWith({
      name: "טל עטר",
      email: "someone@example.com",
      phone: "050-1234567",
      subject: SUBJECT,
      message: "אשמח לשמוע עוד על הסדנה הקרובה.",
    });
  });

  it("reports failure when the lead could not be recorded", async () => {
    // The whole point of the rewrite: a lead that was not stored is never
    // reported to the visitor as sent.
    appendLeadMock.mockResolvedValue(false);
    expect(await submitContact(initialContactState, form())).toEqual({
      status: "error",
      reason: "unavailable",
    });
  });

  it("silently drops a submission that filled the honeypot", async () => {
    const result = await submitContact(initialContactState, form({ company: "Acme" }));

    // Success, so the bot learns nothing about why it was rejected.
    expect(result).toEqual({ status: "success" });
    expect(appendLeadMock).not.toHaveBeenCalled();
  });

  it("silently drops a submission completed faster than a human could type", async () => {
    const result = await submitContact(initialContactState, form({ elapsed: "800" }));

    expect(result).toEqual({ status: "success" });
    expect(appendLeadMock).not.toHaveBeenCalled();
  });

  it("accepts a submission with no elapsed value at all", async () => {
    // Absent rather than small: never punish a visitor whose browser did not
    // report the timing.
    const data = form();
    data.delete("elapsed");

    expect(await submitContact(initialContactState, data)).toEqual({ status: "success" });
    expect(appendLeadMock).toHaveBeenCalledTimes(1);
  });

  it("reports a validation error and records nothing", async () => {
    const result = await submitContact(initialContactState, form({ email: "nope" }));

    expect(result).toEqual({ status: "error", reason: "validation" });
    expect(appendLeadMock).not.toHaveBeenCalled();
  });

  it("rejects a subject the form never offered", async () => {
    const result = await submitContact(initialContactState, form({ subject: "anything" }));
    expect(result).toEqual({ status: "error", reason: "validation" });
  });

  it("rate limits after three accepted submissions", async () => {
    for (let i = 0; i < 3; i += 1) {
      expect(await submitContact(initialContactState, form())).toEqual({ status: "success" });
    }
    expect(await submitContact(initialContactState, form())).toEqual({
      status: "error",
      reason: "rate_limit",
    });
    expect(appendLeadMock).toHaveBeenCalledTimes(3);
  });

  it("does not spend rate-limit budget on bot submissions", async () => {
    // A bot tripping the honeypot must not lock out the real visitor behind
    // the same NAT address.
    for (let i = 0; i < 5; i += 1) {
      await submitContact(initialContactState, form({ company: "Acme" }));
    }
    expect(await submitContact(initialContactState, form())).toEqual({ status: "success" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test app/actions/contact.test.ts`
Expected: FAIL — cannot resolve `@/app/actions/contact`.

- [ ] **Step 3: Write the implementation**

```ts
// app/actions/contact.ts
"use server";

import { headers } from "next/headers";
import { getContent } from "@/lib/content";
import { parseLead } from "@/lib/lead";
import { appendLead } from "@/lib/leads-sheet";
import { allow } from "@/lib/rate-limit";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      reason: "validation" | "rate_limit" | "unavailable";
    };

export const initialContactState: ContactState = { status: "idle" };

/** Below this, nobody typed a name, an address, a phone and a message. */
const MIN_ELAPSED_MS = 3000;

/**
 * Screens the submission, then records the lead.
 *
 * `success` means the lead reached the sheet. The form this replaced inferred
 * success from an opaque redirect and so reported it unconditionally; every
 * path here that cannot record the lead says so.
 */
export async function submitContact(
  _previous: ContactState,
  data: FormData,
): Promise<ContactState> {
  // Bots fill every field they find, and submit the instant the page parses.
  // Both get the same answer a delivered lead gets, so a bot cannot learn what
  // tripped it, and neither spends the visitor's rate-limit budget.
  if (String(data.get("company") ?? "").trim() !== "") {
    return { status: "success" };
  }
  const elapsed = Number(data.get("elapsed"));
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < MIN_ELAPSED_MS) {
    return { status: "success" };
  }

  if (!allow(await clientAddress())) {
    return { status: "error", reason: "rate_limit" };
  }

  const lead = parseLead(data, getContent().contact.subjects);
  if (!lead) {
    return { status: "error", reason: "validation" };
  }

  if (!(await appendLead(lead))) {
    return { status: "error", reason: "unavailable" };
  }

  return { status: "success" };
}

/**
 * The visitor's address as Vercel reports it.
 *
 * `x-forwarded-for` accumulates proxies left to right, so the first entry is
 * the client. Everything unattributable shares one bucket, which is the safe
 * direction: it throttles rather than exempts.
 */
async function clientAddress(): Promise<string> {
  const received = await headers();
  return (
    received.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    received.get("x-real-ip") ||
    "unknown"
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test app/actions/contact.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add app/actions/contact.ts app/actions/contact.test.ts
git commit -m "Add contact form server action"
```

---

### Task 5: Content keys for the new failure states

**Files:**
- Modify: `content/site.yaml` (the `contact:` block, around line 260)
- Modify: `lib/content.ts` (the `contact` member of `SiteContent`, around line 177)

**Interfaces:**
- Produces: `contact.validation_message` and `contact.rate_limit_message` on `SiteContent`, both `string`.

Purely additive — nothing reads them until Task 6, so the build and every existing test stay green.

- [ ] **Step 1: Add the two keys to the YAML**

In `content/site.yaml`, directly after the existing `error_message` line inside `contact:`:

```yaml
  # Shown when the server rejects the submitted fields. The form's own HTML
  # validation catches this first for anyone using a browser normally.
  validation_message: "משהו בפרטים לא תקין. אפשר לבדוק ולנסות שוב."
  # Shown after several submissions in quick succession from the same address.
  rate_limit_message: "נשלחו כמה הודעות ברצף. אפשר לנסות שוב בעוד כמה דקות."
```

- [ ] **Step 2: Add the two fields to the type**

In `lib/content.ts`, inside the `contact: { ... }` member, beside the existing `error_message`:

```ts
    validation_message: string;
    rate_limit_message: string;
```

- [ ] **Step 3: Run the whole suite to confirm nothing broke**

Run: `pnpm test`
Expected: PASS, everything green. Additive changes only.

- [ ] **Step 4: Commit**

```bash
git add content/site.yaml lib/content.ts
git commit -m "Add contact copy for validation and rate-limit states"
```

---

### Task 6: Rewrite the form and delete the relay

**Files:**
- Modify: `components/Contact.tsx` (full rewrite of the submit path)
- Modify: `lib/forms.ts` — delete `wasAccepted` and `rejectedDespiteOk`
- Modify: `lib/content.test.ts` — delete the suites for both
- Modify: `content/site.yaml` — delete `contact.form_action`, `contact.mailto_fallback_note`, `contact.mailto_opened_message` and their comments
- Modify: `lib/content.ts` — delete the same three fields from the type
- Modify: `app/globals.css` — replace `.contact-fallback-note` with `.honeypot`
- Modify: `app/page.test.tsx` — replace the endpoint/mailto test
- Test: `components/Contact.test.tsx`

**Interfaces:**
- Consumes: `submitContact`, `initialContactState`, `ContactState` (Task 4); `validation_message`, `rate_limit_message` (Task 5).
- Produces: nothing downstream.

One task because it must be atomic — deleting `wasAccepted` while `Contact.tsx` still calls it does not compile.

- [ ] **Step 1: Write the failing component test**

```tsx
// components/Contact.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Contact } from "@/components/Contact";
import { getContent } from "@/lib/content";

vi.mock("@/app/actions/contact", () => ({
  initialContactState: { status: "idle" },
  submitContact: vi.fn(async () => ({ status: "success" })),
}));

const contact = getContent().contact;

describe("Contact", () => {
  it("renders every field the lead needs", () => {
    render(<Contact contact={contact} />);
    for (const label of [
      contact.fields.name,
      contact.fields.email,
      contact.fields.phone,
      contact.fields.subject,
      contact.fields.message,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("carries a honeypot that no visitor can reach", () => {
    const { container } = render(<Contact contact={contact} />);
    const honeypot = container.querySelector<HTMLInputElement>('input[name="company"]');

    expect(honeypot).not.toBeNull();
    // Off-screen rather than display:none, which bots skip, and out of the tab
    // order so a keyboard visitor never lands in it.
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(honeypot?.value).toBe("");
  });

  it("starts with no status message", () => {
    render(<Contact contact={contact} />);
    expect(screen.queryByText(contact.success_message)).toBeNull();
    expect(screen.queryByText(contact.error_message)).toBeNull();
  });

  it("announces status changes to screen readers", () => {
    const { container } = render(<Contact contact={contact} />);
    expect(container.querySelector(".form-message")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test components/Contact.test.tsx`
Expected: FAIL — no `input[name="company"]`.

- [ ] **Step 3: Rewrite `components/Contact.tsx`**

Replace the file entirely:

```tsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { mailto } from "@/lib/forms";
import {
  initialContactState,
  submitContact,
  type ContactState,
} from "@/app/actions/contact";
import { RESERVE_EVENT, type ReserveDetail } from "@/components/ReserveButton";

/**
 * Submits through a Server Action, which records the lead in the owner's sheet.
 *
 * What it replaced posted from the browser to a third-party relay and read an
 * opaque redirect as proof of delivery — so it said "נשלחה" on every submission
 * whether or not anything arrived. Every state below reflects what the server
 * actually did.
 */
export function Contact({ contact }: { contact: SiteContent["contact"] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const mountedAt = useRef(Date.now());
  // Controlled so a workshop's שמירת מקום button can fill them in before the
  // visitor reaches the form.
  const [subject, setSubject] = useState(contact.subjects[0]);
  const [message, setMessage] = useState("");

  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    async (previous, data) => {
      // Stamped on the client. Comparing the visitor's clock to the server's
      // would drop real leads whenever the two disagree.
      data.set("elapsed", String(Date.now() - mountedAt.current));
      return submitContact(previous, data);
    },
    initialContactState,
  );

  useEffect(() => {
    function onReserve(event: Event) {
      const workshop = (event as CustomEvent<ReserveDetail>).detail?.workshop;
      if (!workshop) return;
      // Guard the select against a subject that is not one of its options,
      // which would render it blank.
      if (contact.subjects.includes(contact.reserve_subject)) {
        setSubject(contact.reserve_subject);
      }
      setMessage(contact.reserve_message.replace("{workshop}", workshop));
    }

    window.addEventListener(RESERVE_EVENT, onReserve);
    return () => window.removeEventListener(RESERVE_EVENT, onReserve);
  }, [contact]);

  useEffect(() => {
    if (state.status !== "success") return;
    // reset() clears the uncontrolled fields; the controlled two need saying.
    formRef.current?.reset();
    setSubject(contact.subjects[0]);
    setMessage("");
  }, [state, contact.subjects]);

  const statusMessage =
    state.status === "success"
      ? contact.success_message
      : state.status === "error"
        ? state.reason === "validation"
          ? contact.validation_message
          : state.reason === "rate_limit"
            ? contact.rate_limit_message
            : contact.error_message
        : "";

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">{contact.eyebrow}</p>
          <h2 className="section-title" id="contact-title">
            {contact.title}
          </h2>
          <p className="contact-copy">{contact.description}</p>
          <a className="contact-email" href={mailto(contact.email)}>
            {contact.email}
          </a>
        </div>

        <form className="contact-form" ref={formRef} action={formAction}>
          <div className="field">
            <label htmlFor="contact-name">{contact.fields.name}</label>
            <input id="contact-name" name="name" autoComplete="name" required />
          </div>

          <div className="field">
            <label htmlFor="contact-email">{contact.fields.email}</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="contact-phone">{contact.fields.phone}</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="contact-subject">{contact.fields.subject}</label>
            <select
              id="contact-subject"
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {contact.subjects.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label htmlFor="contact-message">{contact.fields.message}</label>
            <textarea
              id="contact-message"
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
          </div>

          {/*
            The honeypot. A real input rather than type="hidden", which bots
            skip, positioned off-screen rather than display:none, which they
            also skip. Hidden from assistive tech and out of the tab order, so
            no visitor can reach it; anything that fills it is a script.
          */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="contact-company">Company</label>
            <input
              id="contact-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button className="button contact-submit" type="submit" disabled={pending}>
            {pending ? contact.sending_label : contact.fields.submit}
          </button>

          <p className="form-message" aria-live="polite">
            {statusMessage}
          </p>
        </form>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Swap the fallback-note style for the honeypot style**

In `app/globals.css`, replace the `.contact-fallback-note` rule (around line 1017) with:

```css
.honeypot {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
```

- [ ] **Step 5: Delete the relay helpers**

In `lib/forms.ts`, delete `rejectedDespiteOk` and `wasAccepted` entirely, along with their doc comments. Keep `isConfiguredEndpoint` (used by `SiteFooter`, `LegalLinks` and `Newsletter`) and `mailto` (used by `Contact` and the legal pages). Update the module's header comment so it no longer describes relay behaviour:

```ts
/**
 * Pure helpers shared by client components.
 *
 * Kept out of lib/content.ts deliberately: that module reads the YAML from disk
 * with node:fs, and any value import from a "use client" component would pull
 * fs into the browser bundle and fail the build.
 */
```

In `lib/content.test.ts`, delete the `describe("rejectedDespiteOk", ...)` and `describe("wasAccepted", ...)` blocks, the `json` helper if it is now unused, and the two names from the `@/lib/forms` import.

- [ ] **Step 6: Delete the obsolete content keys**

In `content/site.yaml`, inside `contact:`, delete `form_action` and the whole comment block above it (the FormSubmit alias explanation, including the commented-out `# form_action: "https://formsubmit.co/el/jotama"` line), plus `mailto_fallback_note` and `mailto_opened_message` with their comments.

In `lib/content.ts`, delete these three lines from the `contact` type:

```ts
    form_action: string;
    mailto_fallback_note: string;
    mailto_opened_message: string;
```

- [ ] **Step 7: Update the page test**

In `app/page.test.tsx`, replace the whole `it("posts the contact form to a real endpoint, with no mailto notice", ...)` block with:

```tsx
  it("offers a submit button and a honeypot the visitor cannot reach", () => {
    const { container } = render(<Home />);
    expect(
      screen.getByRole("button", { name: content.contact.fields.submit }),
    ).toBeInTheDocument();
    expect(container.querySelector('input[name="company"]')).not.toBeNull();
  });
```

If `isConfiguredEndpoint` is still imported and used by the remaining social/legal assertions in that file, leave the import alone; it is only the contact assertion that changes.

- [ ] **Step 8: Run the full suite and the type check**

Run: `pnpm test`
Expected: PASS. `components/Contact.test.tsx` green, no references to the deleted helpers or keys anywhere.

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Submit the contact form through a server action

The form posted straight from the browser to FormSubmit and read the
resulting opaque redirect as proof of delivery, so it reported success on
every submission whether or not anything arrived. Leads were lost with no
trace. Submissions now go through a server action that records them in the
owner's sheet and reports what actually happened."
```

---

### Task 7: Configuration, the script of record, and the runbook

**Files:**
- Create: `apps-script/Code.gs`
- Create: `.env.example`
- Create: `docs/contact-form.md`
- Modify: `.gitignore`

No tests: this task ships no executable application code.

- [ ] **Step 1: Commit the Apps Script as the repo's copy of record**

Create `apps-script/Code.gs` with the deployed script, but with the secret replaced by a placeholder so the real value never enters git. Copy the deployed source verbatim otherwise, including `SHEET_ID = '12EL3V3_5Xhux6AaydfT5S9jVveg8PnFtaay1CmkrQCY'` and `NOTIFY_TO = 'tai.atar22@gmail.com'`, and open the file with:

```js
/**
 * Deployed as a Web App on the owner's Google account, bound to the leads
 * spreadsheet. This copy exists so the script is reviewable and recoverable;
 * editing it here changes nothing until it is pasted into Apps Script and
 * redeployed as a new version.
 *
 * SECRET below is a placeholder. The real value lives in two places only: the
 * Apps Script editor, and LEADS_SHEET_SECRET in the Vercel project.
 */
const SECRET = 'REPLACE_WITH_THE_VALUE_IN_VERCEL';
```

- [ ] **Step 2: Create `.env.example`**

```bash
# The Apps Script Web App that records leads. Deploy > Manage deployments in
# the Apps Script editor; the URL ends in /exec.
LEADS_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"

# Must match SECRET in the Apps Script source exactly. Without it the script
# answers {"ok":false,"error":"unauthorized"} and the lead is not recorded.
LEADS_SHEET_SECRET=""
```

- [ ] **Step 3: Let `.env.example` past `.gitignore`**

The `# env files` section currently ignores `.env*`, which swallows the example too. Add the exception directly beneath it:

```gitignore
.env*
!.env.example
```

- [ ] **Step 4: Write `docs/contact-form.md`**

Cover, in this order: the pipeline in a sentence; the two Vercel environment variables and where each value comes from; how to change the Apps Script (edit, save, **Deploy > Manage deployments > pencil > Version: New version > Deploy** — a plain save does not change what `/exec` serves); how to read the failure states in the Vercel logs (every one is prefixed `[contact]`); and the verification checklist from Step 5 below, written so a non-engineer can run it.

- [ ] **Step 5: Record the verification checklist in that file**

```markdown
## Verifying delivery

Run this after any change to the form, the action, or the Apps Script.

1. Open https://www.taiatar.com/#contact
2. Submit a real message, taking more than three seconds over it
3. Confirm the page shows the success message
4. Confirm a new row in the leads sheet with all six columns filled
5. Confirm the notification in the tai.atar22@gmail.com **inbox**, not Spam
6. Press Reply and confirm it addresses the visitor, not yourself

If step 3 shows an error, the Vercel runtime logs carry the reason on a line
beginning `[contact]`. If steps 3 and 4 pass but 5 fails, the row was saved and
only the notification failed — check the Apps Script execution log.
```

- [ ] **Step 6: Commit**

```bash
git add apps-script/Code.gs .env.example .gitignore docs/contact-form.md
git commit -m "Document the contact form pipeline and its configuration"
```

---

## Deployment

Not part of any task; done once, by the owner, after Task 7.

1. In Apps Script, replace the placeholder `SECRET` with the real value, save, then **Deploy > Manage deployments > pencil > Version: New version > Deploy**. Editing without redeploying leaves the old code serving `/exec`.
2. In the Vercel project, **Settings > Environment Variables**, add `LEADS_SHEET_WEBHOOK_URL` and `LEADS_SHEET_SECRET` to Production, Preview and Development.
3. Redeploy — environment variables are read at runtime, but an existing deployment will not pick up new ones without one.
4. Run the verification checklist above. The work is not done until every step passes.
