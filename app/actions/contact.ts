"use server";

import { headers } from "next/headers";
import { parseLead } from "@/lib/lead";
import { appendLead } from "@/lib/leads-sheet";
import { allow } from "@/lib/rate-limit";
import type { ContactState } from "@/lib/contact-state";

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

  const lead = parseLead(data);
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
