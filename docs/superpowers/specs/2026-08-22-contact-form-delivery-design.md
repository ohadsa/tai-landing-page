# Contact form delivery — design

**Date:** 2026-08-22
**Status:** approved, ready to implement

## The problem

`components/Contact.tsx` posted the form straight from the browser to
`https://formsubmit.co/el/juzanu` and decided whether it worked by inspecting the
response. It could not. The fetch used `redirect: "manual"`, and `wasAccepted()` in
`lib/forms.ts` treated the resulting `opaqueredirect` as success:

```ts
if (response.type === "opaqueredirect") return true;
```

An `opaqueredirect` response carries no status, no headers and no body. FormSubmit
redirects on failure paths too — an unactivated alias, or its default reCAPTCHA
interstitial, which a `fetch` can never complete. So the form reported
"ההודעה נשלחה" on every submission whether or not anything was delivered.

The owner confirmed the symptom: a real submission produced a success message and no
lead. Leads were being dropped silently, with no way to tell how many.

Three compounding faults:

1. **No delivery signal.** Success was inferred from a redirect, which proves nothing.
2. **A third party in the request path.** The browser talked directly to FormSubmit;
   the site had no server-side view of any submission.
3. **No record.** Nothing was stored anywhere. A failed send left no trace.

## Requirements

- Every lead reaches the owner as a row in a Google Sheet she controls, plus an email
  notification to `tai.atar22@gmail.com`.
- A lead carries name, email, phone, subject and message.
- Replying to the notification must answer the visitor directly.
- The visitor is never shown success unless the lead was actually captured, and is
  never shown failure when it was.
- No new paid service, no DNS work in this pass.

## Approach

A Next.js Server Action posts the lead to a Google Apps Script Web App, which appends a
row and sends the notification.

```
<form action={formAction}>       components/Contact.tsx      client, useActionState
      |
      v
submitContact(prev, formData)    app/actions/contact.ts      "use server"
      |  honeypot filled  -> silent ok, nothing recorded
      |  faster than 3s   -> silent ok, nothing recorded
      |  >3 per IP/10min  -> rate_limit
      |  invalid fields    -> validation
      v
appendLead(lead)                 lib/leads-sheet.ts          secret, 6s timeout, 2 attempts
      |
      v
Apps Script Web App              the owner's Google account
      |-- appendRow  -> Sheet: תאריך · שם · אימייל · טלפון · נושא · הודעה
      +-- MailApp    -> tai.atar22@gmail.com, replyTo = visitor
```

### Why a Server Action

- **No CORS.** The POST is same-origin. The Apps Script endpoint answers with a
  cross-origin redirect to `script.googleusercontent.com` and sends no CORS headers — a
  browser `fetch` cannot follow that. This is the same class of bug that broke
  FormSubmit. From the server, redirects simply work.
- **A real result.** The action reads the webhook's JSON body and knows whether the row
  was written.
- **The secret stays server-side.** A browser-side call would have to ship it.

### Why Apps Script rather than the Sheets API

The Sheets API needs a Google Cloud project, a service account, a private-key JSON to
store and rotate, and the sheet shared with a robot address. Apps Script runs as the
owner inside her own sheet: one URL, one shared secret, and `MailApp` gives the email
notification for free with no domain verification and no sending quota worth worrying
about at this volume.

### Capture before notify

The row is appended first, and a `MailApp` failure is caught inside the script so it
can never fail the request. The lead is durable before anything else is attempted.

### Spam handling

- **Honeypot** — a real `<input name="company">`, visually hidden off-screen with
  `tabIndex={-1}` and `aria-hidden`. Not `type="hidden"`, which bots skip.
- **Time-trap** — the client stamps elapsed milliseconds since mount; under 3000ms is a
  bot.
- **Rate limit** — 3 submissions per IP per 10 minutes.

Honeypot and time-trap hits return **success** and record nothing, so a bot learns
nothing about why it failed.

### Failure semantics

| Outcome | Visitor sees |
|---|---|
| Row appended | `success_message` |
| Honeypot / time-trap | `success_message`, nothing recorded |
| Validation rejected the input | `validation_message` |
| Rate limited | `rate_limit_message` |
| Webhook unreachable after 2 attempts | `error_message` + the email address already on the page |

The last row is the only path that loses a lead, and it tells the visitor so. That is
the honest floor for a single-sink design; today's code fails that case silently.

## Trade-offs accepted

- **Rate limiting is in-memory**, so it resets on cold start and is not shared across
  Vercel instances. It throttles a single attacker against a warm instance. The
  honeypot and time-trap carry the real load. Upstash Redis is the upgrade if spam
  arrives.
- **Submitting requires JavaScript.** The time-trap needs the client to compute elapsed
  time at submit, which means wrapping the server action and giving up React's
  pre-hydration progressive enhancement. `Contact` is already a client component that
  depends on JS for the workshop reserve integration, and the form sits far down a
  marketing page, so hydration has long since happened. Documented rather than hidden.
- **Google is a single point of failure** for both sink and notification. Accepted
  deliberately: see below.

## Deferred: Resend

The owner chose to skip domain verification for now. Resend drops in later as a second,
independent sink — a `lib/email.ts` behind the same interface the action already calls,
with no change to the action's shape. That would decouple notification from Google and
add delivery logs. Requires DKIM, SPF, DMARC and MX records on `taiatar.com` at GoDaddy.

## Newsletter

Out of scope. `newsletter.form_action` stays empty and the section stays hidden. It
still carries the old browser-relay pattern and must be migrated to this action before
it is ever switched on.

## Removed

The relay approach and the mailto fallback go entirely:

- `lib/forms.ts`: `wasAccepted()`, `rejectedDespiteOk()`
- `lib/content.test.ts`: the suites covering both
- `components/Contact.tsx`: the `fetch` with `redirect: "manual"`, the mailto fallback
  branch, `canPost`, the `"handed-off"` status
- `content/site.yaml` and the `SiteContent` type: `contact.form_action`,
  `contact.mailto_fallback_note`, `contact.mailto_opened_message`
- `app/globals.css`: `.contact-fallback-note`

`isConfiguredEndpoint()` and `mailto()` stay — the footer, legal links, the newsletter
guard and the contact email link all use them.

## Verification

Not considered done until a real submission on the deployed site produces a row in the
sheet and a notification in the Gmail inbox. That check is written down in
`docs/contact-form.md` so it can be rerun after any change to the form.
