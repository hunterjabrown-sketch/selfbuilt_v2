# Fix “Couldn’t save” / “Saved projects” list empty — deploy Firestore rules & indexes

- **“Couldn’t save to Saved projects”** → Firestore **rules** are blocking the save. Deploy rules (Option A or B below).
- **Saves work but the list is empty** → The list query needs a **composite index**. Deploy indexes: run `firebase use YOUR_PROJECT_ID` then `firebase deploy --only firestore:indexes` (or `firebase deploy --only firestore` to deploy rules + indexes). Indexes may take a few minutes to build.

---

## Option A: Firebase Console (no terminal)

1. Open **[Firebase Console](https://console.firebase.google.com/)** and select your project.
2. In the left menu go to **Build** → **Firestore Database**.
3. Open the **Rules** tab.
4. Replace everything in the editor with this:

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

5. Click **Publish**.

Done. Try saving a project again in the app.

---

## Option B: Firebase CLI

1. Install the CLI (if needed):  
   `npm install -g firebase-tools`

2. Log in:  
   `firebase login`

3. In your project folder (where `firebase.json` lives), set the project:  
   `firebase use YOUR_PROJECT_ID`  
   (Get **YOUR_PROJECT_ID** from Firebase Console → Project settings → General.)

4. Deploy rules and indexes:  
   `firebase deploy --only firestore`  
   (Or rules only: `firebase deploy --only firestore:rules`; indexes only: `firebase deploy --only firestore:indexes`.)

**Why indexes?** The “Saved projects” list query needs a composite index on `userId` + `createdAt`. Without it, saves work but the list stays empty (or shows an error). After deploying, indexes may take a few minutes to build in the Firebase Console.

After deploying rules (and indexes if the list was empty), “Saved projects” should save and load correctly.

---

## Create the index in Firebase Console (no CLI)

If you don’t use the Firebase CLI, create the index by hand:

1. Open **[Firebase Console](https://console.firebase.google.com/)** → your project (**selfbuilt-4984e**) → **Build** → **Firestore Database**.
2. Open the **Indexes** tab.
3. Click **Create index**.
4. Set:
   - **Collection ID:** `projects`
   - **Fields to index:**  
     - Field: `userId`, Order: **Ascending**  
     - Field: `createdAt`, Order: **Descending**
5. Click **Create**. Wait until the index status is **Enabled** (can take a few minutes).

Then reload the app and open Saved projects; the list should load.
