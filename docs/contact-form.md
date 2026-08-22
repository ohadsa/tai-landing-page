# The contact form

A submission travels: the form in `components/Contact.tsx` → `submitContact` in
`app/actions/contact.ts` (a Server Action) → `appendLead` in `lib/leads-sheet.ts`
→ a Google Apps Script Web App, which appends a row to the leads spreadsheet and
emails `tai.atar22@gmail.com`.

The browser never talks to Google directly. It cannot: Apps Script answers a POST
with a redirect to `script.googleusercontent.com` and sends no CORS headers, so a
browser could not read the result — and the shared secret would have to ship to
the page. Both problems disappear when the call is made from the server.

## Configuration

Two environment variables, set in the Vercel project under
**Settings → Environment Variables**, for Production, Preview and Development.
See `.env.example` for a local copy.

| Variable | Where the value comes from |
| --- | --- |
| `LEADS_SHEET_WEBHOOK_URL` | Apps Script editor → **Deploy → Manage deployments** → the Web app URL, ending in `/exec` |
| `LEADS_SHEET_SECRET` | Must equal `SECRET` in the deployed Apps Script exactly |

Enter both **without surrounding quotes**. A `.env` file is parsed by dotenv,
which strips them; the Vercel field stores exactly what you type, so a value
pasted straight from `.env.example` keeps its quotes — the secret then contains
quote characters and is refused as `unauthorized`, and the URL fails to parse.
Because dotenv strips the quotes locally, this breaks in production only.
`lib/leads-sheet.ts` strips stray quotes and whitespace defensively, but the
value should still be clean.

Environment variables are read at runtime, but an existing deployment will not
pick up new ones. Redeploy after changing either.

## Changing the Apps Script

`apps-script/Code.gs` is the repo's copy of record, carrying a placeholder
secret. It is not deployed from here. To change the live script:

1. Edit in the Apps Script editor (open the spreadsheet → **Extensions → Apps Script**)
2. `Cmd+S`
3. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**

**Saving is not deploying.** A saved-but-not-redeployed change leaves the old
code serving `/exec`, which looks exactly like the change not working.

Then mirror the edit back into `apps-script/Code.gs`, keeping the placeholder
secret.

## Reading a failure

Every server-side failure logs to the Vercel runtime logs on a line beginning
`[contact]`. The Apps Script side logs to its own execution log, in the editor
under **Executions**.

| What the visitor sees | What happened |
| --- | --- |
| `success_message` | The row was written. Also shown to bots, deliberately — see below |
| `validation_message` | A field failed server-side validation in `lib/lead.ts` |
| `rate_limit_message` | More than 10 submissions from one address inside 10 minutes |
| `error_message` | The webhook failed twice. The lead was lost, and the visitor was told so |

Honeypot and time-trap hits are answered with the success message and recorded
nowhere, so a bot cannot learn what tripped it. They spend no rate-limit budget,
so a bot cannot lock out a real visitor sharing its address.

## Verifying delivery

Run this after any change to the form, the action, or the Apps Script. The bug
this replaced went unnoticed for months precisely because nobody could check.

1. Open https://www.taiatar.com/#contact
2. Submit a real message, taking more than three seconds over it
3. Confirm the page shows the success message
4. Confirm a new row in the leads spreadsheet, with all six columns filled
5. Confirm the notification arrived in the `tai.atar22@gmail.com` **inbox**, not Spam
6. Press Reply and confirm it addresses the visitor, not yourself

If step 3 shows an error, the Vercel runtime logs carry the reason on a
`[contact]` line. If 3 and 4 pass but 5 fails, the lead is safe and only the
notification failed — check the Apps Script execution log.

## Known limits

- **The rate limit is per instance.** It lives in memory, so it resets on cold
  start and is not shared across Vercel instances. The honeypot and time-trap do
  the real work; swap `lib/rate-limit.ts` for Upstash Redis if spam arrives.
- **Google is a single point of failure** for both the record and the
  notification. Adding Resend as a second, independent sink is the upgrade —
  `lib/email.ts` alongside `lib/leads-sheet.ts`, with no change to the action.
  It needs DKIM, SPF, DMARC and MX records for `taiatar.com` at GoDaddy.
- **Submitting requires JavaScript.** The time-trap is measured on the client, so
  the action is wrapped and React's pre-hydration progressive enhancement does
  not apply.
- **The newsletter section is not wired to any of this.** It stays hidden while
  `newsletter.form_action` is empty, and still carries the old browser-relay
  pattern. Migrate it to a Server Action before ever switching it on.
