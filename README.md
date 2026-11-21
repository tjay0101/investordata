# Aquaminder Investor Card Scanner

Live app: https://tjay0101.github.io/investordata/

Scan an investor's visiting card with your phone → **Gemini AI** reads it → check/edit → **Save** → stored in **Firebase Firestore**.
If the AI is unavailable or not set up on a phone, the app falls back to a free in-browser text reader (less accurate).

## Set up each phone (once)

The Gemini key is **not** in this public code. Send each team member this link privately (WhatsApp/email), with your key filled in:

```
https://tjay0101.github.io/investordata/#key=YOUR_GEMINI_KEY
```

Opening it once saves the key on that phone and removes it from the address bar. Then use the normal link. To change the key, open the link again with the new key.

Gemini key: [AI Studio](https://aistudio.google.com/apikey) (prepaid credits). Restrict it to websites `tjay0101.github.io/*` and to the Generative Language API.

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
| `parse.js` | Backup field picker used when AI is unavailable |
| `parse.test.js` | Quick check: `node parse.test.js` |

## Notes

- The Firebase config in `index.html` is meant to be public; security comes from `firestore.rules`.
- Anyone who finds the site URL can add records (not read them). Fine for internal use; add Firebase App Check or a login if the URL gets shared widely.
