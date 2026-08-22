import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "1.1.1.1" }),
}));
vi.mock("@/lib/leads-sheet", () => ({ appendLead: vi.fn() }));

import { submitContact } from "@/app/actions/contact";
import { initialContactState } from "@/lib/contact-state";
import { appendLead } from "@/lib/leads-sheet";
import { LIMIT, resetRateLimit } from "@/lib/rate-limit";

const appendLeadMock = vi.mocked(appendLead);
const SUBJECT = "שאלה על סדנה";

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
    const result = await submitContact(
      initialContactState,
      form({ company: "Acme" }),
    );

    // Success, so the bot learns nothing about why it was rejected.
    expect(result).toEqual({ status: "success" });
    expect(appendLeadMock).not.toHaveBeenCalled();
  });

  it("silently drops a submission completed faster than a human could type", async () => {
    const result = await submitContact(
      initialContactState,
      form({ elapsed: "800" }),
    );

    expect(result).toEqual({ status: "success" });
    expect(appendLeadMock).not.toHaveBeenCalled();
  });

  it("accepts a submission with no elapsed value at all", async () => {
    // Absent rather than small: never punish a visitor whose browser did not
    // report the timing.
    const data = form();
    data.delete("elapsed");

    expect(await submitContact(initialContactState, data)).toEqual({
      status: "success",
    });
    expect(appendLeadMock).toHaveBeenCalledTimes(1);
  });

  it("asks the visitor to fill an empty field, and records nothing", async () => {
    const result = await submitContact(
      initialContactState,
      form({ message: "" }),
    );

    expect(result).toEqual({ status: "error", reason: "validation" });
    expect(appendLeadMock).not.toHaveBeenCalled();
  });

  it("records a short message rather than judging it", async () => {
    // The rule is "filled in", not "long enough". A visitor writing one word
    // is a lead like any other.
    expect(
      await submitContact(initialContactState, form({ message: "בדיקה" })),
    ).toEqual({ status: "success" });
    expect(appendLeadMock).toHaveBeenCalledTimes(1);
  });

  it("rate limits once the address has spent its budget", async () => {
    for (let i = 0; i < LIMIT; i += 1) {
      expect(await submitContact(initialContactState, form())).toEqual({
        status: "success",
      });
    }
    expect(await submitContact(initialContactState, form())).toEqual({
      status: "error",
      reason: "rate_limit",
    });
    // The refused one never reaches the sheet.
    expect(appendLeadMock).toHaveBeenCalledTimes(LIMIT);
  });

  it("does not spend rate-limit budget on bot submissions", async () => {
    // A bot tripping the honeypot must not lock out the real visitor behind
    // the same NAT address.
    for (let i = 0; i < LIMIT + 5; i += 1) {
      await submitContact(initialContactState, form({ company: "Acme" }));
    }
    expect(await submitContact(initialContactState, form())).toEqual({
      status: "success",
    });
  });
});
