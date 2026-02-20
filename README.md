# SelfBuilt

AI-powered DIY home improvement assistant. Describe your project, answer a few questions, optionally upload photos of your space, and get a clear step-by-step builder's guide. Sign in with Google to save your projects and revisit them anytime.

**Repo:** [https://github.com/hunterjabrown-sketch/selfbuilt](https://github.com/hunterjabrown-sketch/selfbuilt)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   - Copy `.env.example` to `.env`
   - Set `ANTHROPIC_API_KEY` to your [Anthropic API key](https://console.anthropic.com/). All API calls use this env variable only — never hardcoded.
   - For Google sign-in and saved projects, set the `VITE_FIREBASE_*` variables (see [Firebase setup](#firebase-google-sign-in--saved-projects) below).

3. **Run**
   - Terminal 1 — API server: `npm run server`
   - Terminal 2 — Frontend: `npm run dev`
   - Open the URL Vite prints (e.g. http://localhost:5173)

## Firebase (Google sign-in + saved projects)

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** → Sign-in method → **Google**.
3. Create a **Firestore Database** (start in test mode or set rules so only authenticated users can read/write their own `projects` docs).
4. In Project settings → General, copy your app’s config and add to `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN` (e.g. `your-project.firebaseapp.com`)
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET` (e.g. `your-project.appspot.com`)
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. (Optional) Deploy Firestore index for saved projects list:  
   `npx firebase deploy --only firestore:indexes` (requires `firebase.json` and the Firebase CLI). Or when you first open **Saved**, Firestore may show a link in the console to create the index.

## Tech

- **Frontend:** React, Tailwind CSS, Vite, Firebase (Auth + Firestore)
- **Backend:** Node (Express) with Claude API (vision) for generating the guide

The app proxies `/api` to the server so the frontend calls the same origin in development.

## Connecting GitHub and Vercel (or your v0 project)

Your **source of truth** is the GitHub repo: [github.com/hunterjabrown-sketch/selfbuilt](https://github.com/hunterjabrown-sketch/selfbuilt). The app we built lives there. Vercel (and v0, which runs on Vercel) just **deploys** that repo—they don’t hold a separate copy of the app.

**How to connect them:**

1. **Push your code to GitHub** (if you haven’t):
   ```bash
   git remote add origin https://github.com/hunterjabrown-sketch/selfbuilt.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
   (Use `master` instead of `main` if that’s your default branch.)

2. **In Vercel:** Go to [vercel.com](https://vercel.com) and sign in (same account you use for v0).

3. **Import the GitHub repo:**
   - Click **Add New…** → **Project**.
   - Under “Import Git Repository”, find **hunterjabrown-sketch/selfbuilt** (or paste the repo URL). If you don’t see it, click **Configure** and grant Vercel access to your GitHub account/repos.
   - Click **Import** next to that repo.

4. **Configure the project:**
   - **Framework Preset:** Vite (or leave as auto-detected).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Root Directory:** leave blank unless the app is in a subfolder.
   - Add **Environment Variables** (same as in your `.env`): `ANTHROPIC_API_KEY` and all `VITE_FIREBASE_*` keys.

5. **Deploy:** Click **Deploy**. Vercel will build from your GitHub repo and give you a URL (e.g. `selfbuilt.vercel.app`).

After that, **every push to the repo** can auto-deploy (if you left “Deploy on push” on). You don’t “connect” v0 and GitHub as two separate apps—you connect **one** GitHub repo to **one** Vercel project; that project is your live SelfBuilt app. If you created a separate “SelfBuilt v0 project” in the v0 UI, you can either use that same project and point it at this repo (if v0 lets you set the repo), or create a new Vercel project and import `hunterjabrown-sketch/selfbuilt` as above.

## Deploy to Vercel (short version)

1. **Push the project to GitHub** (see “Connecting GitHub and Vercel” above).

2. **Import the repo in Vercel**  
   Add New → Project → select **hunterjabrown-sketch/selfbuilt**. Use Build Command `npm run build`, Output Directory `dist`.

3. **Environment variables**  
   In the Vercel project: Settings → Environment Variables. Add `ANTHROPIC_API_KEY` and all `VITE_FIREBASE_*` from your Firebase project.

4. **Deploy**  
   The frontend is served from `dist`, and `/api/generate` runs as a serverless function.

Your generated guide is kept in the browser tab (sessionStorage) so it stays when you switch tabs or refresh.
