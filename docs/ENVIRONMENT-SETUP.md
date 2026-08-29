# Environment Setup

Step-by-step guide to getting HMS running locally, including *how* to obtain each secret — not
just which variables exist (that table is in the root [`README.md`](../README.md)).

No real secrets are ever stored in this repo or in `docs/`. Real values live only in
`backend/.env` and `frontend/.env`, both git-ignored.

## 1. Prerequisites

- Node.js 20+ (`node --version`)
- A MongoDB database — pick one:
  - **Local**: install MongoDB Community Server, or run it via Docker
    (`docker run -d -p 27017:27017 --name hms-mongo mongo:7`)
  - **Atlas** (managed, no local install): create a free cluster at mongodb.com/atlas, create a
    database user, and allow your current IP under Network Access

## 2. Install dependencies

```bash
npm install   # installs both workspaces from the repo root
```

## 3. Backend environment (`backend/.env`)

```bash
cp .env.example backend/.env
```

Then fill in each value:

| Variable | How to get it |
| --- | --- |
| `PORT` | Leave as `5000` unless it conflicts with something else on your machine |
| `NODE_ENV` | `development` locally |
| `MONGODB_URI` | Local: `mongodb://localhost:27017/hostel_management`. Atlas: copy the connection string from Atlas → Database → Connect → Drivers, then add the database name before the `?` — e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hostel_management?appName=Cluster0` |
| `JWT_ACCESS_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_ACCESS_EXPIRES_IN` | Leave as `15m` unless you have a specific reason to change it |
| `JWT_REFRESH_SECRET` | Generate the same way as above — **must be a different value** from `JWT_ACCESS_SECRET` |
| `JWT_REFRESH_EXPIRES_IN` | Leave as `7d` |
| `CLIENT_URL` | `http://localhost:5173` for local dev (must match the frontend's actual origin — used for CORS and cookie scoping) |

The server validates all of this with Zod at startup and refuses to boot with a clear message if
anything is missing or malformed — you cannot accidentally run with a broken config.

## 4. Frontend environment (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` for local dev — must match the backend's `PORT` |

## 5. Run it

```bash
npm run dev
```

This starts the backend (`:5000`) and frontend (`:5173`) together. Individually:
`npm run dev:backend` / `npm run dev:frontend`.

## 6. First-run: create your Admin account

The database starts empty — there is no seed data and no default admin login.

1. Open `http://localhost:5173` — you'll land on **Login**.
2. Click **"Create the admin account"** → fills the Setup form.
3. This calls `POST /api/auth/register`, which only ever works while zero Admins exist. From then
   on it returns 403, and all further accounts (Manager/Resident) are created by that Admin from
   **Manage Users** in the dashboard.

## 7. Verifying it actually works

Typecheck/lint passing is not proof the app works — see
[`Architecture.md`](./Architecture.md) for why. Before calling any change done:

- `npm run lint` at the root (both workspaces)
- Exercise the actual flow in a browser (or `curl`, for API-only changes)
- For anything touching auth: confirm a protected route 401s with no token, 403s with the wrong
  role, and 200s with the right one
