# Aquaminder Investor Card Scanner

Scan an investor's visiting card with your phone camera → details are read automatically (OCR, runs in the browser, free) → check/edit → **Save** → new row in Google Sheets.

## 1. Set up the Google Sheet (database)

1. Create a new Google Sheet, e.g. "Aquaminder Investors".
2. **Extensions → Apps Script**. Delete the sample code, paste in [`apps-script/Code.gs`](apps-script/Code.gs), and save.
3. **Deploy → New deployment** → type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, allow the permissions, and copy the **Web app URL** (ends in `/exec`).
5. In [`index.html`](index.html), paste that URL into `SHEET_URL`.
6. Change `TOKEN` to your own secret word, the same in both `index.html` and `Code.gs`.

Rows are added to a tab named **Investors** (created automatically with headers).

> If you change `Code.gs` later: **Deploy → Manage deployments → Edit → Version: New version**, or the old code keeps running.

## 2. Put the app online (GitHub Pages)

Phone cameras only work on HTTPS, so host it:

1. Push this repo to GitHub.
2. Repo **Settings → Pages** → Source: **Deploy from a branch** → `main` / `root` → Save.
3. Open `https://<your-username>.github.io/investordata/` on your phone. Tip: "Add to Home screen".

## Files

| File | What |
|---|---|
| `index.html` | The app (scan, edit, save) |
| `parse.js` | Picks name/company/phone/email/etc. out of the scanned text |
| `apps-script/Code.gs` | Google Apps Script that writes rows to the sheet |
| `parse.test.js` | Quick check: `node parse.test.js` |

## Notes

- OCR is automatic but not perfect on fancy cards. Always glance over the fields before saving.
- The token keeps random people from writing to your sheet, but it's visible in the page source. Fine for internal use; don't put anything secret in the sheet URL.
