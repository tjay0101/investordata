# Aquaminder Investor Card Scanner

Live app: https://tjay0101.github.io/investordata/

Scan an investor's visiting card with your phone → **Gemini AI** reads it (or the free in-browser reader as a backup) → check/edit → **Save** → stored in **Firebase Firestore**.

## AI reader

The AI reader is on for everyone automatically: every phone loads the Gemini key from the
Firebase database, so nobody has to paste anything. **Never put the key in the code**: GitHub
blocks it, and once it was published Google disabled the key within minutes.

Set or change the key (Firebase console → **Firestore Database → Data**):
collection `config` → document `ai` → field `geminiKey` (string) = your key from
[Google AI Studio](https://aistudio.google.com/apikey). The latest [`firestore.rules`](firestore.rules)
must be published so the app can read it.

- Anyone using the site could read the key from the database. Credits are prepaid, so the most
  that can be lost is what is left on them.
- If the key is missing, wrong or out of credits, the app keeps working with the free reader and
  says so under the scan button.

Photo tips: card flat and filling the photo, good light, no shadow.

## One-time Firebase setup (project `investor-data-d3a33`)

1. **Create the database:** **Build → Firestore Database → Create database** → pick a location near you (e.g. `asia-south1` Mumbai) → **Start in production mode**.
2. **Set the rules:** Firestore → **Rules** tab → paste the contents of [`firestore.rules`](firestore.rules) → **Publish**.

## Admin panel (see all saved cards)

Open the **🔒 Admin login** link at the bottom of the scanner (or `/admin.html`). Admins see every saved card with its front/back photos (with totals for today and the last 7 days), can search, sort, delete cards, download a CSV, and set the shared AI key (⚙️ AI key). Preview the design with made-up cards: `admin.html#demo`.

One-time setup in the [Firebase console](https://console.firebase.google.com/project/investor-data-d3a33/):

1. **Build → Authentication → Get started → Email/Password → Enable → Save.**
2. **Authentication → Users → Add user**: the admin's email and a strong password. Copy the new user's **User UID**.
3. **Firestore Database → Data → + Start collection**: collection ID `admins`, document ID = the **User UID** from step 2, add any field (e.g. `role` = `admin`) → Save.
4. **Firestore Database → Rules**: paste the latest [`firestore.rules`](firestore.rules) → **Publish**. (Needed for saving card photos and for admin access.)

To add another admin, repeat steps 2–3.

## Files

| File | What |
|---|---|
| `index.html` | The scanner app (scan front/back, edit, save) |
| `admin.html` | Admin panel: login, view/search all saved cards, CSV download |
| `firestore.rules` | Database rules: scanner can only add records; only admins can read them |
| `parse.js` | Finds the card in the photo and picks name/company/phone/email/etc. out of the text |
| `parse.test.js` | Quick check: `node parse.test.js` |

## Notes

- The Firebase config in `index.html` is meant to be public; security comes from `firestore.rules`.
- Anyone who finds the site URL can add records (not read them). Fine for internal use; add Firebase App Check or a login if the URL gets shared widely.
