// Paste this into Extensions > Apps Script of your Google Sheet. See README.md.
const TOKEN = 'aquaminder-2026'; // must match TOKEN in index.html
const HEADERS = ['Timestamp', 'Name', 'Designation', 'Company', 'Phone', 'Email', 'Website', 'Address', 'Notes', 'Raw OCR Text'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return reply({ ok: false, error: 'Unauthorized' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Investors')
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Investors');
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    // Leading ' stops Sheets treating "+91..." or "=..." as a formula
    const safe = v => (v ? "'" + String(v).slice(0, 2000) : '');
    sheet.appendRow([new Date(), d.name, d.designation, d.company, d.phone, d.email, d.website, d.address, d.notes, d.rawText].map((v, i) => i ? safe(v) : v));
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
