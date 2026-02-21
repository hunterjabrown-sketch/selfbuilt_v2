# Firestore setup map

What the app uses in Firestore and what you need to do in the Firebase Console (or CLI).

---

## Collections

| Collection  | Document ID     | Fields | Purpose |
|------------|------------------|--------|--------|
| **projects** | Auto-generated | `userId`, `projectIdea`, `guide`, `createdAt` | Saved builder’s guides (one doc per saved project). |
| **profiles**  | User’s Firebase Auth UID | `displayName`, `phone`, `photoURL`, `updatedAt` | One doc per user; editable in Profile (top-right icon). |

---

## Security rules

In **Firebase Console → Firestore Database → Rules**, use rules that:

1. **projects** – Users can create a doc only if `request.resource.data.userId == request.auth.uid`; can read/update/delete only their own docs (`resource.data.userId == request.auth.uid`).
2. **profiles** – Users can read and write only the doc whose ID is their own `request.auth.uid` (`profiles/{userId}`).

Full rules are in **firestore.rules** in this repo. Deploy with:

- **Console:** Copy the contents of `firestore.rules` into the Rules editor and click **Publish**.
- **CLI:** `firebase use YOUR_PROJECT_ID` then `firebase deploy --only firestore:rules`.

---

## Indexes

- **projects** – One composite index is required for the “Saved projects” list:
  - Collection: `projects`
  - Fields: `userId` (Ascending), `createdAt` (Descending)
- **profiles** – No index needed (docs are read/written by document ID only).

Index is defined in **firestore.indexes.json**. Deploy with:

- **CLI:** `firebase deploy --only firestore:indexes`
- **Console:** If the app shows an error with a “create index” link, click it to create the index.

---

## Quick checklist

1. Create a Firebase project and turn on **Authentication** (e.g. Google) and **Firestore Database**.
2. In Firestore, deploy **Rules** from `firestore.rules` (so `projects` and `profiles` are protected).
3. Deploy **Indexes** from `firestore.indexes.json` (or create the composite index in the Console when prompted).
4. Set your app’s `.env` with the same project’s `VITE_FIREBASE_*` variables.

After that, sign-in, saving projects, and profile edits will work.
