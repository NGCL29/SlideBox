# SlideBox (EduVault) – Mobile LMS

Store lecture presentations and exercises. Two parts:

- `server.js` – Node.js server (API + web version). Needs **Node 22.5+**. No `npm install` required.
- `mobile-app/` – the Android/iOS app (Expo / React Native).

## Roles
- **Student**: logs in, views and downloads slides, takes quizzes, submits work.
- **Instructor**: everything above, plus upload slides/exercises, add/remove subjects, delete items.
  To sign up as an instructor, enter the **instructor code** (set with `INSTRUCTOR_CODE`; default `instructor123` – change it!).

## Run on your computer
```
node server.js
```
Open http://localhost:3000.

## Put it online (Render, free)
1. Push this folder to a GitHub repository (the `uploads/` and `node_modules/` folders are not needed).
2. On render.com: New → Blueprint (uses `render.yaml`) or New → Web Service. Build command: none. Start command: `node server.js`.
3. Add environment variables: `INSTRUCTOR_CODE` (your secret code), `ADMIN_EMAIL` and `ADMIN_PASSWORD` (an instructor account created on every start), `AUTH_SECRET` (any long random text).
4. Your site will be at `https://<name>.onrender.com`.

**Free-tier limits** ([Render free tier docs](https://render.com/docs/free)): the server sleeps after ~15 minutes without traffic (first load is slow), and the disk is wiped on restart, so uploaded files and accounts disappear. `ADMIN_EMAIL`/`ADMIN_PASSWORD` keep an instructor login working after a wipe. For permanent storage, use a paid plan with a persistent disk and set `DATA_DIR` to its mount path.

Optional env vars: `PORT`, `DATA_DIR`, `ADMIN_NAME`.

## Build the installable Android app
See `mobile-app/README.md`.
