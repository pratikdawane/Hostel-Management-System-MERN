# Hostel Management System

A web application for running a single hostel — tracking residents, rooms, rent, and complaints
from one place instead of registers and spreadsheets.

This is **Phase 1**. So far, only the foundation and the login/account system are built. The
resident, room, rent, and complaint features come in later phases — see
[`docs/ImplementationPlan.md`](./docs/ImplementationPlan.md) for the full phase-by-phase plan.

## What this project is built with

**Frontend** (what the user sees in the browser)
- React 19 + TypeScript
- Vite (fast dev server/build tool)
- Tailwind CSS v4 (styling)
- React Router (page navigation)
- Axios (talking to the backend)
- React Hook Form + Zod (forms and form validation)
- Lucide React (icons), Sonner (toast notifications), Recharts (charts)

**Backend** (the server and database logic)
- Node.js + Express 5 + TypeScript
- MongoDB + Mongoose (database)
- JWT (login sessions) + bcrypt (password hashing)
- Zod (validating incoming data)

## Folder structure

```
hostel-management-system/
├── backend/     the API server (backend/src/config, controllers, middleware, models,
│                routes, services, validators, utils, types)
├── frontend/    the React app (frontend/src/components, pages, layouts, routes,
│                hooks, context, services, types, utils, lib)
├── .env.example the list of settings the backend needs (no real secrets in here)
└── package.json the root file that ties backend + frontend together as one project
```

## How to run this project, step by step

### Step 1 — Install the tools you need

- Install Node.js version 20 or newer.
- Have a MongoDB database ready. Any of these work:
  - Install MongoDB on your own computer, or
  - Run it with Docker, or
  - Create a free database on MongoDB Atlas (cloud, no install needed)

### Step 2 — Get the code and install dependencies

From the project's root folder, run:

```bash
npm install
```

This single command installs the packages for both `backend/` and `frontend/`.

### Step 3 — Set up the backend's settings file

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in real values. See the table below, or the more detailed
[`docs/ENVIRONMENT-SETUP.md`](./docs/ENVIRONMENT-SETUP.md) for exactly how to get each value.

### Step 4 — Start the app

```bash
npm run dev
```

This starts both the backend (on port `5000`) and the frontend (on port `5173`) at the same time.
If you only want one of them: `npm run dev:backend` or `npm run dev:frontend`.

### Step 5 — Open it in your browser

Go to `http://localhost:5173`. The database is empty at this point — there is no default login.

### Step 6 — Create your first Admin account

1. On the Login page, click **"Create the admin account"**.
2. Fill in your name, email, and password, and submit.
3. This is a one-time action — it only works while the database has zero Admins. After your
   Admin account exists, this option disappears, and every other account (Manager, Resident, or
   another Admin) must be created by you from **Manage Users** inside the dashboard.

### Step 7 — You're in

You'll land on the Dashboard, logged in as Admin.

## Settings the backend needs (`backend/.env`)

| Setting | What it means |
| --- | --- |
| `PORT` | Which port the backend server listens on (default `5000`) |
| `NODE_ENV` | `development`, `production`, or `test` |
| `MONGODB_URI` | The connection address for your MongoDB database |
| `JWT_ACCESS_SECRET` | A long random secret used to sign short-lived login tokens (32+ characters) |
| `JWT_ACCESS_EXPIRES_IN` | How long a login token lasts before it needs refreshing, e.g. `15m` |
| `JWT_REFRESH_SECRET` | A second, different long random secret, for longer-lived session tokens |
| `JWT_REFRESH_EXPIRES_IN` | How long the longer session lasts, e.g. `7d` |
| `CLIENT_URL` | The frontend's web address, so the backend knows which site is allowed to talk to it |

If any of these is missing or wrong, the backend will refuse to start and will print a clear
message telling you exactly what's wrong — it will never start in a half-broken state.

## What's built so far: Login & Accounts

There are three kinds of accounts:
- **Admin** — the hostel owner, full control
- **Manager** — day-to-day staff
- **Resident** — a student/tenant

How accounts get created:
1. The very first Admin account is created once, through the Setup page.
2. Every account after that is created by an Admin, from inside the dashboard. There is no public
   sign-up page.

How login sessions work, in simple terms:
- When you log in, the server hands your browser two things: a short-lived "access" pass (kept in
  memory only, never saved to disk) and a longer-lived "refresh" pass (stored safely in a
  browser cookie the app's JavaScript can't read).
- The access pass expires quickly (15 minutes by default). When it does, the app quietly asks the
  server for a new one using the refresh pass — you don't notice this happening.
- If you change your password, every other device/browser you were logged into is instantly
  logged out. Only the session you used to change the password stays logged in.

### API routes that exist today

| Method | Route | Who can use it | What it does |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Anyone, but only once | Creates the very first Admin account |
| POST | `/api/auth/login` | Anyone | Logs in |
| POST | `/api/auth/refresh` | Anyone with a valid session cookie | Renews the session |
| POST | `/api/auth/logout` | Anyone | Logs out |
| GET | `/api/auth/me` | Logged-in users | Returns your own profile |
| PUT | `/api/auth/change-password` | Logged-in users | Changes your password |
| POST | `/api/users` | Admin only | Creates a Manager/Resident/Admin account |
| GET | `/api/users` | Admin only | Lists accounts (with paging and filters) |
| PATCH | `/api/users/:id/status` | Admin only | Turns an account on or off |

## Useful commands (run from the project root)

- `npm run dev` — run backend + frontend together
- `npm run build` — build both for production
- `npm run lint` — check code quality in both

## What's coming next

These features are planned but not built yet: Residents, Rooms & Beds, Room Allocation,
Check-in/Check-out, Rent & Payments, and Complaints. The full, phase-by-phase checklist for all
of this lives in [`docs/ImplementationPlan.md`](./docs/ImplementationPlan.md).

## Where to read more

The [`docs/`](./docs/README.md) folder has the full, detailed documentation: why the project
exists, exactly what it must do, how it's technically built, the phase-by-phase implementation
plan, and how to set up your environment step by step. Start there for anything beyond the quick
setup above.
