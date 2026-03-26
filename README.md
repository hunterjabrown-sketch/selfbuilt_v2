# SelfBuilt

### What it’s for

Most people who want to **do** a home project don’t fail because they’re lazy—they fail because the path from “I have an idea” to “I know what to buy and in what order” is a mess: scattered articles, videos that don’t match your space, and advice that isn’t written for your skill level. **SelfBuilt is built to close that gap:** you describe what you want to build, answer a short set of questions, optionally show the space in a photo, and get a **single, structured guide**—materials, tools, numbered steps—and a way to save it and ask follow-ups in context. It’s not a demo of a chat box; it’s a **working app** with auth, saved projects, and generation tuned for DIY (scope, clarity, follow-through).

Stack: React (Vite), Firebase (sign-in + Firestore), Anthropic for the guide and project assistant. `server/` for local API, `api/` for Vercel.

---

### Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Configure `.env` using the keys in `.env.example`. Vite + API default setup is in `package.json`.

---

### Where things live

`src/` — app and guide flow · `api/` — production handlers · `server/` — local Express · Firebase rules/indexes are in-repo for deploying your own Firestore project.
