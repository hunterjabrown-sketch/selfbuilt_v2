# Vercel environment variables — copy these names into your project

**If you see "No Next.js version detected":** This app uses **Vite**, not Next.js. In Vercel go to **Settings → General → Build & Development Settings** and set **Framework Preset** to **Vite**. Set **Build Command** to `npm run build` and **Output Directory** to `dist`, then redeploy.

---

In Vercel: **Project → Settings → Environment Variables**. Add each name below and paste the value from your local `.env` (same value for Production, Preview, and Development if you want).

| Name | Where to get the value |
|------|------------------------|
| `ANTHROPIC_API_KEY` | Your `.env` |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project settings → General → Your apps → Web app → **apiKey** (starts with `AIzaSy...`). Paste the key only, no quotes. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your `.env` |
| `VITE_FIREBASE_PROJECT_ID` | Your `.env` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your `.env` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your `.env` |
| `VITE_FIREBASE_APP_ID` | Your `.env` |

After adding or changing any variable, go to **Deployments** → … on the latest deployment → **Redeploy**.
