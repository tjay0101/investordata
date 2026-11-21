# Aquaminder Investor Card Scanner

Live app: https://tjay0101.github.io/investordata/

Scan an investor's visiting card with your phone → **Gemini AI** reads it → check/edit → **Save** → stored in **Firebase Firestore**.
If the AI is unavailable, the app falls back to a free in-browser text reader (less accurate).

## One-time Firebase setup (project `investor-data-d3a33`)

1. **Turn on the AI card reader:** Firebase console → **Build → AI Logic** → **Get started** → choose **Gemini Developer API** (free tier) → enable.
2. **Create the database:** **Build → Firestore Database → Create database** → pick a location near you (e.g. `asia-south1` Mumbai) → **Start in production mode**.
3. **Set the rules:** Firestore → **Rules** tab → paste the contents of [`firestore.rules`](firestore.rules) → **Publish**.

## Where to see the data

Firebase console → **Firestore Database → Data → `investors`**. Each scanned card is one document.

## Files

| File | What |
|---|---|
| `index.html` | The app (scan, edit, save) |
| `firestore.rules` | Database security rules: website can add records, never read/edit/delete them |
| `parse.js` | Backup field picker used when AI is unavailable |
| `parse.test.js` | Quick check: `node parse.test.js` |

## Notes

- The Firebase config in `index.html` is meant to be public; security comes from `firestore.rules`.
- Anyone who finds the site URL can add records and use the AI reader. Fine for internal use; add Firebase App Check or a login if the URL gets shared widely.
