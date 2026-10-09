/**
 * AI Hackathon 2026 — Google Sheet backup receiver.
 *
 * Paste this into the Sheet's Apps Script editor (Extensions → Apps Script), set SECRET below,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * The portal sends one row per registration / submission; this appends it to the matching tab.
 * Rows are only ever appended, never edited or deleted, so the sheet is a full history.
 */

// Must match BACKUP_SECRET in Vercel's Environment Variables. Use a long random string.
const SECRET = 'CHANGE-ME-to-a-long-random-string';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json_({ ok: false, error: 'unauthorized' });

    const allowed = ['Registrations', 'Submissions'];
    if (allowed.indexOf(body.sheet) === -1) return json_({ ok: false, error: 'unknown sheet' });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(body.sheet);
      if (!sheet) {
        sheet = ss.insertSheet(body.sheet);
        sheet.appendRow(body.headers);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, body.headers.length).setFontWeight('bold');
      }
      // Prefix values that look like formulas so the sheet never executes submitted text
      const row = body.row.map(function (v) {
        return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
      });
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Lets you open the web app URL in a browser to confirm it's deployed
function doGet() {
  return json_({ ok: true, message: 'Hackathon backup receiver is running.' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
