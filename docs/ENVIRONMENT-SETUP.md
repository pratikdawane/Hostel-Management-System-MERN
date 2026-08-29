# Setting Up Your Environment, Step by Step

This guide walks you through getting the Hostel Management System running on your own computer —
including exactly where to get each secret value, not just which ones exist (that quick summary
is in the root [`README.md`](../README.md)).

No real secrets are ever stored in this repository or anywhere in `docs/`. Your real values only
ever live in `backend/.env` and `frontend/.env`, and both files are excluded from git.

## Step 1 — Make sure you have the right tools

- **Node.js version 20 or newer.** Check with `node --version`.
- **A MongoDB database.** Pick whichever is easiest for you:
  - **On your own computer**: install MongoDB Community Server, or run it with Docker:
    ```bash
    docker run -d -p 27017:27017 --name hms-mongo mongo:7
    ```
  - **In the cloud (Atlas)**: no install needed. Go to mongodb.com/atlas, create a free cluster,
    create a database user (with a username and password), and allow your current IP address
    under "Network Access."

## Step 2 — Install the project's dependencies

From the project's root folder:

```bash
npm install
```

This one command installs everything needed for both the backend and the frontend.

## Step 3 — Set up the backend's settings

First, copy the example file:

```bash
cp .env.example backend/.env
```

Then open `backend/.env` and fill in each value:

| Setting | How to fill it in |
| --- | --- |
| `PORT` | Leave it as `5000` unless something else on your computer is already using that port |
| `NODE_ENV` | Set to `development` while working on your own machine |
| `MONGODB_URI` | **Local database**: `mongodb://localhost:27017/hostel_management`. **Atlas**: go to Atlas → Database → Connect → Drivers, copy the connection string it gives you, and add the database name right before the `?`, like: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hostel_management?appName=Cluster0` |
| `JWT_ACCESS_SECRET` | Generate a random value by running: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_ACCESS_EXPIRES_IN` | Leave as `15m` unless you have a specific reason to change it |
| `JWT_REFRESH_SECRET` | Generate the same way as above, but this **must be a different value** from `JWT_ACCESS_SECRET` — never reuse it |
| `JWT_REFRESH_EXPIRES_IN` | Leave as `7d` |
| `CLIENT_URL` | `http://localhost:5173` when running locally — this must exactly match the address the frontend actually runs on |

You don't need to worry about getting this wrong silently — when you start the backend, it checks
every one of these values and refuses to start (with a clear message about what's missing or
invalid) if anything is off.

## Step 4 — Set up the frontend's settings

```bash
cp frontend/.env.example frontend/.env
```

| Setting | Value |
| --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` when running locally — this must match the backend's `PORT` |

## Step 5 — Start everything

```bash
npm run dev
```

This starts the backend on port `5000` and the frontend on port `5173`, together. If you'd rather
run them one at a time: `npm run dev:backend` or `npm run dev:frontend`.

## Step 6 — Create your first Admin account

The database starts completely empty — there's no built-in login and no seed data.

1. Open `http://localhost:5173` in your browser. You'll land on the Login page.
2. Click **"Create the admin account."**
3. Fill in the form and submit. This works exactly once — the very first time, while the database
   has no Admin yet. After that, this option is gone for good, and every future account (Manager,
   Resident, or another Admin) must be created by you, the Admin, from **Manage Users** inside
   the dashboard.

## Step 7 — Confirm it's actually working

Passing the type-checker or linter does **not** prove the app works — see
[`Architecture.md`](./Architecture.md) for why that distinction matters here. Before considering
any change finished, do all of the following:

- Run `npm run lint` from the root (checks both backend and frontend).
- Actually use the feature in a browser (or with `curl`, for backend-only changes).
- For anything touching login/permissions specifically, confirm all three of these:
  - A protected page/route rejects you when you have no login pass at all.
  - It rejects you when you're logged in with the wrong role.
  - It works normally when you're logged in with the right role.
