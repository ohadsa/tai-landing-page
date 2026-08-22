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
