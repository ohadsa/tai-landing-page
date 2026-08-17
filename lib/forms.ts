/**
 * Pure helpers shared by client components.
 *
 * Kept out of lib/content.ts deliberately: that module reads the YAML from disk
 * with node:fs, and any value import from a "use client" component would pull
 * fs into the browser bundle and fail the build.
 */

/**
 * True when a YAML field names a real destination — a form endpoint or a link.
 *
 * The design's reference template shipped `"#"` as a placeholder, which as a
 * form action posts to the current page — the visitor sees the field clear and
 * assumes success while nothing is sent. As an href it is just as misleading:
 * a social icon that goes nowhere. Treat `"#"` and empty as unconfigured.
 */
export function isConfiguredEndpoint(action: string | undefined): boolean {
  const value = action?.trim();
  return Boolean(value) && value !== "#";
}

/**
 * True when a 2xx response is actually reporting a failure.
 *
 * Form relays do not agree on this. FormSubmit answers 200 with
 * `{"success":"false"}` until the form has been activated, and Formspree
 * answers 200 with an `errors` array when validation fails. Trusting the
 * status code alone would show the visitor a thank-you for a message that was
 * never delivered.
 *
 * Anything unrecognised — an empty body, plain text, a shape we have not seen —
 * is treated as success, so a working endpoint is never reported as broken.
 */
export async function rejectedDespiteOk(response: Response): Promise<boolean> {
  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    return false;
  }
  if (payload === null || typeof payload !== "object") return false;

  const body = payload as Record<string, unknown>;
  return (
    String(body.success) === "false" ||
    body.ok === false ||
    (Array.isArray(body.errors) && body.errors.length > 0)
  );
}

/**
 * Whether the relay accepted the submission.
 *
 * Relays answer in two different shapes and both have a trap:
 *
 * - **A redirect.** Endpoints built for an ordinary browser form POST — such as
 *   FormSubmit's `/el/<alias>` — answer success with a 302 back to the page.
 *   The fetch must be made with `redirect: "manual"`, because following it
 *   fails CORS: after a cross-origin redirect the request's origin becomes
 *   `null`, so our own server's reply is rejected and a delivered message looks
 *   like a network error. The resulting opaque response exposes nothing except
 *   its type, and that type is the acceptance.
 * - **A 200 that means failure.** See {@link rejectedDespiteOk}.
 */
export async function wasAccepted(response: Response): Promise<boolean> {
  if (response.type === "opaqueredirect") return true;
  if (!response.ok) return false;
  return !(await rejectedDespiteOk(response));
}

/** Builds a mailto: URL with the subject and body pre-filled. */
export function mailto(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  // URLSearchParams encodes spaces as "+", which mail clients render literally
  // in a subject line; mailto needs percent-encoding.
  return query
    ? `mailto:${email}?${query.replace(/\+/g, "%20")}`
    : `mailto:${email}`;
}
