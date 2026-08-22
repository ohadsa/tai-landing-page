/**
 * TAI ATAR — קליטת לידים מטופס יצירת הקשר באתר.
 *
 * Deployed as a Web App on the owner's Google account, bound to the leads
 * spreadsheet. This copy exists so the script is reviewable and recoverable;
 * editing it here changes nothing until it is pasted into the Apps Script
 * editor and redeployed as a NEW VERSION. Saving alone leaves the old code
 * serving /exec.
 *
 * SECRET below is a placeholder. The real value lives in exactly two places:
 * the Apps Script editor, and LEADS_SHEET_SECRET in the Vercel project.
 */
const SECRET    = 'REPLACE_WITH_THE_VALUE_IN_VERCEL';
const SHEET_ID  = '12EL3V3_5Xhux6AaydfT5S9jVveg8PnFtaay1CmkrQCY';
const NOTIFY_TO = 'tai.atar22@gmail.com';
const HEADERS   = ['תאריך', 'שם', 'אימייל', 'טלפון', 'נושא', 'הודעה'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return reply({ ok: false, error: 'unauthorized' });

    // First tab, whatever it is named — the Hebrew locale calls it גיליון1.
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setRightToLeft(true);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.email || '',
      data.phone || '',
      data.subject || '',
      data.message || '',
    ]);

    // The row is already saved; a mail failure must not undo it.
    notify(data);
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err) });
  }
}

function notify(data) {
  try {
    const options = {
      to: NOTIFY_TO,
      subject: 'ליד חדש מהאתר: ' + (data.name || ''),
      htmlBody:
        '<div dir="rtl" style="font-size:15px">' +
          '<p><b>שם:</b> ' + esc(data.name) + '</p>' +
          '<p><b>אימייל:</b> ' + esc(data.email) + '</p>' +
          '<p><b>טלפון:</b> ' + esc(data.phone) + '</p>' +
          '<p><b>נושא:</b> ' + esc(data.subject) + '</p>' +
          '<p><b>הודעה:</b><br>' +
            esc(data.message).replace(/\n/g, '<br>') +
          '</p>' +
        '</div>',
    };

    // Reply in Gmail then answers the visitor rather than the owner.
    if (data.email) options.replyTo = data.email;

    MailApp.sendEmail(options);
  } catch (err) {
    console.error('notify failed', err);
  }
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function reply(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
