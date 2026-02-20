# Fix "auth/api-key-not-valid" on localhost

The sign-in **popup works on localhost** once Firebase has a valid API key. The error means the key in your `.env` is wrong or missing.

## 1. Use the correct key in `.env`

- Open [Firebase Console](https://console.firebase.google.com/) → your project → **Project settings** (gear) → **General**.
- Under **Your apps**, select your **Web app** (or add one).
- In the config you’ll see something like:
  ```js
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  ```
- In your project’s **`.env`**, set:
  ```
  VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```
  Paste **only** the value (starts with `AIzaSy`, ~39 characters). No quotes, no spaces.  
  **Do not** use a “key pair” or “private key” from Service accounts—that’s for server-only use.

## 2. Restart the dev server

After changing `.env`, restart Vite so it picks up the new value:

- Stop the dev server (Ctrl+C), then run `npm run dev` again.

## 3. Allow localhost in Firebase

- Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
- Ensure **localhost** is in the list (it usually is by default).

## 4. If you restricted the API key in Google Cloud

- [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials** → open the **Browser key**.
- If **Application restrictions** is “HTTP referrers”, add:
  - `http://localhost:5173/*`
  - `http://localhost:*` (if you use other ports)
- Save.

After this, the sign-in **popup** should work on localhost the same way as on Vercel.
