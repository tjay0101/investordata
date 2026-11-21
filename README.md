# Aquaminder Investor Card Scanner

Live app: https://tjay0101.github.io/investordata/

Scan an investor's visiting card with your phone → the free in-browser text reader (Tesseract) reads it → check/edit → **Save** → stored in **Firebase Firestore**. No AI, no API keys, no cost.

Photo quality matters most: card flat and filling the photo, good light, no shadow. Fancy/handwritten fonts may need typing in by hand.

## One-time Firebase setup (project `investor-data-d3a33`)

1. **Create the database:** **Build → Firestore Database → Create database** → pick a location near you (e.g. `asia-south1` Mumbai) → **Start in production mode**.
2. **Set the rules:** Firestore → **Rules** tab → paste the contents of [`firestore.rules`](firestore.rules) → **Publish**.

## Where to see the data

Firebase console → **Firestore Database → Data → `investors`**. Each scanned card is one document.

## Files

| File | What |
|---|---|
| `index.html` | The app (scan, edit, save) |
| `firestore.rules` | Database security rules: website can add records, never read/edit/delete them |
| `parse.js` | Picks name/company/phone/email/etc. out of the scanned text |
| `parse.test.js` | Quick check: `node parse.test.js` |

## Notes

- The Firebase config in `index.html` is meant to be public; security comes from `firestore.rules`.
- Anyone who finds the site URL can add records (not read them). Fine for internal use; add Firebase App Check or a login if the URL gets shared widely.
