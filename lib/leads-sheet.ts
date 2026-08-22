import type { Lead } from "@/lib/lead";

/**
 * Records a lead in the owner's Google Sheet.
 *
 * The endpoint is an Apps Script Web App: it appends the row, then emails the
 * owner. Two reasons this has to run on the server rather than in the browser.
 * Apps Script answers a POST with a 302 to script.googleusercontent.com and
 * sends no CORS headers on that hop, so a browser fetch cannot read the result
 * — the same class of bug that made the old form report success blindly. And
 * the shared secret would have to ship to the page.
 *
 * Never throws. The caller only needs to know whether the lead was recorded.
 */

const TIMEOUT_MS = 6000;
const ATTEMPTS = 2;

/**
 * Reads a setting, forgiving how it was pasted.
 *
 * A .env file is read by dotenv, which strips surrounding quotes. A hosting
 * dashboard stores the value field literally, so the very same paste arrives
 * still wrapped in them — and a secret containing quote characters is refused
 * as unauthorized while a quoted URL fails to parse at all. Both break only in
 * production, which is the worst place to discover a stray character.
 */
function setting(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  return raw.replace(/^(["'])([\s\S]*)\1$/, "$2").trim() || undefined;
}

export async function appendLead(lead: Lead): Promise<boolean> {
  const url = setting("LEADS_SHEET_WEBHOOK_URL");
  const secret = setting("LEADS_SHEET_SECRET");

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
        // Apps Script can be slow to wake. Long enough to survive a cold start,
        // short enough that the visitor is not left watching a spinner.
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
