# Aquaminder Investor Card Scanner

Live app: https://tjay0101.github.io/investordata/

Scan an investor's visiting card with your phone → **Gemini AI** reads it (or the free in-browser reader as a backup) → check/edit → **Save** → stored in **Firebase Firestore**.

## Turn on the AI reader (once per phone)

The AI reader is much more accurate. Its key is **not** in this public code; each phone saves it once:

- In the app, tap **"Turn it on"** under the scan button and paste the Gemini key, **or**
- Send the person this link privately (WhatsApp/email) and have them open it once:
  `https://tjay0101.github.io/investordata/#key=YOUR_GEMINI_KEY`

Without the key (or if the AI is busy) the app uses the free reader automatically and says so.
Key and credits: [Google AI Studio](https://aistudio.google.com/apikey). Restrict the key to websites `tjay0101.github.io/*`.

Photo tips: card flat and filling the photo, good light, no shadow.

## One-time Firebase setup (project `investor-data-d3a33`)

1. **Create the database:** **Build → Firestore Database → Create database** → pick a location near you (e.g. `asia-south1` Mumbai) → **Start in production mode**.
2. **Set the rules:** Firestore → **Rules** tab → paste the contents of [`firestore.rules`](firestore.rules) → **Publish**.

## Admin panel (see all saved cards)

Open the **🔒 Admin login** link at the bottom of the scanner (or `/admin.html`). Admins see every saved card with its front/back photos, can search, and can download a CSV.

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
