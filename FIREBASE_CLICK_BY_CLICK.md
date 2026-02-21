# Firebase setup — click by click

---

## Do I need to change anything in Firebase?

**If you already set up Google sign-in, Firestore rules, and the index:**  
**No.** Nothing to change. Sign in with Google and the app keep working as-is.

**Only if you want “Create account” (email + password) in the sign-in popup:**  
**Yes.** Turn on Email/Password in Firebase (about 30 seconds). See the **Optional** part under section 2 below.

| What you want                         | Change in Firebase? |
|---------------------------------------|---------------------|
| Just Google sign-in (already working) | **No**              |
| Create account with email/password    | **Yes** — enable Email/Password in section 2 |

---

## Full setup (do these if something isn’t working)

Do these steps in order.

---

## 1. Open Firebase and your project

1. Open your browser.
2. Go to: **https://console.firebase.google.com**
3. Sign in with the Google account that owns the project.
4. On the Firebase welcome page, click your project name: **selfbuilt-4984e** (or the project you use for this app).
   - If you don’t see it: click **All projects** or the project dropdown at the top, then click **selfbuilt-4984e**.

---

## 2. Turn on Google Sign-In (Authentication)

1. In the **left sidebar**, click **Build**.
2. Under **Build**, click **Authentication**.
3. Click the **Get started** button (or **Sign-in method** tab if you already started).
4. Click the **Sign-in method** tab at the top.
5. In the list of providers, find **Google**.
6. Click **Google** (the row, not the toggle).
7. Turn **Enable** **ON** (toggle to the right).
8. Under **Project support email**, choose your email from the dropdown (e.g. your Gmail).
9. Click **Save**.
10. Click **Close** (or the X).

**Optional — Email/password (for “Create account” in the app):** In the same **Sign-in method** list, click **Email/Password**, turn **Enable** ON, click **Save**, then **Close**.

---

## 3. Add your app’s domain (so sign-in works)

1. Still in **Authentication** (left: **Build** → **Authentication**).
2. Click the **Settings** tab (top).
3. Click **Authorized domains** in the left list under Settings.
4. You should see **localhost** in the list. If your app runs on another URL (e.g. a hosting URL), click **Add domain**.
5. Type the domain (e.g. **yourapp.web.app** or **localhost** if missing), then click **Add**.
6. Click **Save** if there is a Save button.

---

## 4. Create or open Firestore Database

1. In the **left sidebar**, click **Build**.
2. Under **Build**, click **Firestore Database**.
3. If you see **Create database**:
   - Click **Create database**.
   - Choose **Start in test mode** (we’ll lock it down with rules next), then click **Next**.
   - Leave the location as suggested (e.g. **us-central**), click **Enable**.
4. If you already have a database, you’ll see **Data**, **Rules**, **Indexes** at the top. Skip to step 5.

---

## 5. Paste and publish Firestore Rules

1. You should be in **Firestore Database** (left: **Build** → **Firestore Database**).
2. At the top of the page, click the **Rules** tab.
3. You’ll see a code editor with existing rules. Select **all** the text in the editor (click inside, then Ctrl+A or Cmd+A).
4. Delete it and paste this **exactly**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Click the **Publish** button (top right of the Rules editor).
6. In the confirmation popup, click **Publish** again.

---

## 6. Create the Saved projects index (Firestore Index)

**You do not need a separate database or index for profiles.** Profiles are stored in the same Firestore database, in a collection named `profiles`. The app looks up one document per user by ID, so no index is required for profiles. Only the **projects** collection needs the index below.

1. Still in **Firestore Database**.
2. At the top, click the **Indexes** tab.
3. Click the **Create index** button (or **Add index**).
4. In **Collection ID**, type: **projects**
5. Leave **Collection group** unchecked (use **Collection** scope).
6. Under **Fields to index**:
   - Click **Add field**.
   - **Field path:** type **userId** — **Order:** choose **Ascending**.
   - Click **Add field** again.
   - **Field path:** type **createdAt** — **Order:** choose **Descending**.
7. Click **Create** (or **Create index**).
8. Wait until the index **Status** shows **Enabled** (can take 1–2 minutes). You can leave the page and come back; refresh to check.

---

## 7. (Optional) Get your project config for .env

Only do this if you need to copy the config into `.env` again.

1. In the **left sidebar**, click the **gear icon** next to **Project Overview**.
2. Click **Project settings**.
3. Scroll down to **Your apps**.
4. If you see a web app (</> icon), click it. If not, click **Add app**, choose **Web** (</>), give it a nickname (e.g. **SelfBuilt**), click **Register app**, then copy the config.
5. In the config object, copy each value into your `.env`:
   - **apiKey** → `VITE_FIREBASE_API_KEY=...`
   - **authDomain** → `VITE_FIREBASE_AUTH_DOMAIN=...`
   - **projectId** → `VITE_FIREBASE_PROJECT_ID=...`
   - **storageBucket** → `VITE_FIREBASE_STORAGE_BUCKET=...`
   - **messagingSenderId** → `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
   - **appId** → `VITE_FIREBASE_APP_ID=...`

---

## Done

- **Authentication**: Google is enabled; authorized domains include localhost (and your app’s domain if you added it).
- **Firestore**: Rules are published; the **projects** index is created and **Enabled**.
- Your app can sign in, save projects, and load the Saved projects list.

If sign-in fails, check **Authentication** → **Settings** → **Authorized domains**. If the list is empty or your URL is missing, add it and save.
