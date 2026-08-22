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
// often than it catches bad ones, and an address is proven by whether the reply
// arrives, not by a regex.
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
