/**
 * Shape and validation of a contact-form submission.
 *
 * The only rule is that a field was filled in. Nothing here judges whether a
 * message is long enough or a phone number looks the way we expect: a real
 * visitor who writes "בדיקה" or types a number in an unanticipated shape must
 * reach the inbox. Refusing a lead over a format guess loses exactly what this
 * form exists to capture, so the bounds below are only wide enough to stop a
 * script posting something absurd.
 */

export type Lead = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

/** Generous ceilings, present to bound abuse rather than to police input. */
const MAX_LENGTH: Record<keyof Lead, number> = {
  name: 200,
  email: 320, // the maximum length of an email address per RFC 3696
  phone: 50,
  subject: 200,
  message: 10_000,
};

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Returns the lead, or `null` if a field is empty or absurdly long. */
export function parseLead(data: FormData): Lead | null {
  const lead: Lead = {
    name: field(data.get("name")),
    email: field(data.get("email")),
    phone: field(data.get("phone")),
    subject: field(data.get("subject")),
    message: field(data.get("message")),
  };

  for (const [key, value] of Object.entries(lead) as [keyof Lead, string][]) {
    if (value.length === 0) return null;
    if (value.length > MAX_LENGTH[key]) return null;
  }

  return lead;
}
