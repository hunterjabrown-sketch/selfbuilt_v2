# Vercel environment variables — copy these names into your project

In Vercel: **Project → Settings → Environment Variables**. Add each name below and paste the value from your local `.env` (same value for Production, Preview, and Development if you want).

| Name | Where to get the value |
|------|------------------------|
| `ANTHROPIC_API_KEY` | Your `.env` |
| `VITE_FIREBASE_API_KEY` | Your `.env` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your `.env` |
| `VITE_FIREBASE_PROJECT_ID` | Your `.env` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your `.env` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your `.env` |
| `VITE_FIREBASE_APP_ID` | Your `.env` |

After adding or changing any variable, go to **Deployments** → … on the latest deployment → **Redeploy**.
