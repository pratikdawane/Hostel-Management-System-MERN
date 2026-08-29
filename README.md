# Hostel Management System

A MERN + TypeScript monorepo for managing a single hostel. This first phase ships the project
foundation and a complete, production-grade authentication module. Student/room/rent/complaint
management modules will follow in later phases.

## Tech stack

**Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, React Hook Form,
Zod, Lucide React, Sonner (toasts)

**Backend** — Node.js, Express 5, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Zod

## Project structure

```
hostel-management-system/
├── backend/            Express API (backend/src/{config,controllers,middleware,models,routes,services,validators,utils,types})
├── frontend/            React app (frontend/src/{components,pages,layouts,routes,hooks,context,services,types,utils,lib})
├── .env.example         Documents the backend's required environment variables
└── package.json         npm workspaces root (backend, frontend)
```

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB instance (local, Docker, or Atlas)

### Setup

```bash
npm install                          # installs both workspaces
cp .env.example backend/.env         # then fill in real values (see below)
npm run dev                          # runs backend (5000) and frontend (5173) together
```

Or run them individually: `npm run dev:backend` / `npm run dev:frontend`.

The frontend reads its API URL from `frontend/.env` (`VITE_API_URL`, defaults to
`http://localhost:5000/api`).

### Environment variables (`backend/.env`)

| Variable                 | Description                                          |
| ------------------------ | ----------------------------------------------------- |
| `PORT`                   | API server port (default `5000`)                      |
| `NODE_ENV`                | `development` \| `production` \| `test`               |
| `MONGODB_URI`            | MongoDB connection string                              |
| `JWT_ACCESS_SECRET`      | Signing secret for access tokens (32+ chars)           |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime, e.g. `15m`                      |
| `JWT_REFRESH_SECRET`     | Signing secret for refresh tokens (32+ chars, different from the access secret) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime, e.g. `7d`                      |
| `CLIENT_URL`             | Frontend origin, used for CORS + cookie scoping         |

The server validates these at startup with Zod and refuses to start if any are missing or
invalid — check the console output for exactly what's wrong.

## Authentication & roles

There are three roles: **Admin** (hostel owner), **Manager**, and **Resident**.

- The very first Admin account is created once via the **Setup** page (`POST /api/auth/register`).
  This endpoint only ever works when no Admin exists yet — after that it returns 403.
- All Manager and Resident accounts are created **by an Admin** from **Manage Users** in the
  dashboard (`POST /api/users`, Admin-only).

**Tokens**: a short-lived JWT access token (15 min default) is returned in the response body and
kept in memory on the frontend (never `localStorage`), attached as `Authorization: Bearer`. A
longer-lived JWT refresh token (7 days default) is set as an `httpOnly`, `sameSite` cookie scoped
to `/api/auth`. `POST /api/auth/refresh` rotates it and issues a fresh access token; the frontend
does this automatically on a 401 and on app load (to restore a session after a page reload).
Changing your password bumps a `tokenVersion` counter, which immediately invalidates every other
active session.

### API routes

| Method | Route                        | Access        | Description                          |
| ------ | ----------------------------- | ------------- | ------------------------------------- |
| POST   | `/api/auth/register`          | Public (once) | Bootstrap the first Admin account     |
| POST   | `/api/auth/login`             | Public        | Log in                                |
| POST   | `/api/auth/refresh`           | Public (cookie) | Rotate the session                  |
| POST   | `/api/auth/logout`            | Public        | Clear the session cookie              |
| GET    | `/api/auth/me`                | Authenticated | Current user profile                  |
| PUT    | `/api/auth/change-password`   | Authenticated | Change password, revoke other sessions |
| POST   | `/api/users`                  | Admin         | Create a Manager/Resident/Admin account |
| GET    | `/api/users`                  | Admin         | List accounts (paginated, filterable) |
| PATCH  | `/api/users/:id/status`       | Admin         | Activate/deactivate an account        |

## Available scripts (root)

- `npm run dev` — run backend + frontend together
- `npm run build` — build both workspaces
- `npm run lint` — lint both workspaces (ESLint for backend, oxlint for frontend)

## What's next

Students, Rooms, Beds, Room Allocation, Check-in/Check-out, Rent, Payments, and Complaints are
out of scope for this phase and will be added in a follow-up pass.

## Documentation

Deeper project docs — business/functional requirements, architecture, environment setup details,
and per-module specs/plans — live in [`docs/`](./docs/README.md), following a spec-driven
workflow: nothing gets built without a reviewed spec first. Start there for anything beyond
day-to-day setup.
