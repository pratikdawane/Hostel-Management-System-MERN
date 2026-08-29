# Architecture — How the System Is Built

**Status:** Living document — describes the system exactly as it exists in the code today.
**Last updated:** 2026-08-30

This document explains, in plain language, how the app is put together technically. For *why*
the project exists, see [`BRD-HMS.md`](./BRD-HMS.md). For *what* it must do, see
[`FRD-HMS.md`](./FRD-HMS.md).

## 1. The technology used

| Part | What's used |
| --- | --- |
| Frontend (browser app) | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, React Hook Form + Zod, Lucide icons, Sonner (toasts), Recharts (charts) |
| Backend (server) | Node.js, Express 5, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Zod |
| Project setup | One repository, two npm "workspaces": `backend` and `frontend` |

For how to install and configure all of this on your own machine, step by step, see
[`ENVIRONMENT-SETUP.md`](./ENVIRONMENT-SETUP.md).

## 2. How the folders are organized

```
backend/src/
├── config/       reads and checks the .env settings; connects to MongoDB
├── constants/    the list of the 3 roles (admin, manager, resident) — defined once, used everywhere
├── models/       the shape of the data stored in MongoDB (currently: User)
├── validators/   rules that check incoming data is valid, before anything else touches it
├── services/     the actual business logic (e.g. "how login works") — kept separate from the web layer
├── controllers/  thin layer: reads the incoming request, calls a service, sends back a response
├── routes/       lists the API addresses (e.g. /api/auth/login) and which checks apply to each
├── middleware/   reusable checks that run before a request reaches its controller (login check,
│                 permission check, error handling, spam/rate limiting)
├── utils/        small shared helpers for building consistent success/error responses
├── types/        shared TypeScript type definitions
├── app.ts        assembles the whole backend app (security headers, CORS, routes, error handler)
└── server.ts     starts everything up: connects to the database, then starts listening

frontend/src/
├── components/ui/        shared building blocks used across the whole app (Button, Input, Card, ...)
├── components/dashboard/ pieces used only on the Dashboard page
├── pages/                one file per screen; pages/admin/ holds Admin-only screens
├── layouts/              the page "frame" — one for login-type pages, one for the logged-in app
├── context/ + hooks/     keeps track of "who is currently logged in," shared across the whole app
├── services/             where all the calls to the backend live (never called directly from a page)
├── routes/               the map of URL → page, plus the rules for who can see which page
├── styles/               shared visual styling helpers
└── lib/                  small shared utilities (e.g. shared form validation rules)
```

## 3. What happens when the backend gets a request, step by step

1. The request passes through security checks first: basic security headers, then a check on
   which websites are allowed to call this API, then a check that this visitor/IP hasn't made too
   many requests too quickly (this mainly protects the login page from being spammed).
2. The incoming data is validated. If it's invalid (e.g. a missing field, a badly formatted
   email), the request stops here and an error is sent back — it never reaches step 3.
3. If the route requires being logged in, the system checks that the request has a valid,
   current login pass. If not, it's rejected here.
4. If the route requires a specific role (e.g. Admin-only), that's checked next. Wrong role means
   rejected here.
5. Only now does the request reach its controller, which reads what was asked for and hands it to
   the right service.
6. The service does the actual work (talks to the database, applies business rules) and returns
   a result.
7. The controller wraps that result in a consistent response shape and sends it back.
8. If anything at any step throws an error, one central error-handler catches it and turns it
   into a clean, safe error message — no technical details ever leak to the person using the app.

### How data validation works

Each incoming request's body, URL parameters, or search/query parameters get checked against a
strict set of rules before anything else happens. If something doesn't match — wrong type, missing
required field, invalid format — the request is rejected immediately with a clear message
describing exactly what was wrong, per field.

### How login sessions work (the important security design)

- **Access pass**: expires quickly (15 minutes, by default). It's given back in the login
  response and is kept only in the browser's memory — never written to disk, and never sent as a
  cookie. This is what gets attached to every API call the browser makes.
- **Refresh pass**: lasts much longer (7 days, by default). It's stored in a cookie that
  JavaScript cannot read, which greatly reduces the risk of it being stolen. Calling the "refresh"
  endpoint uses this cookie to issue a brand-new access pass, and replaces the refresh cookie with
  a fresh one too.
- **Instantly logging someone out everywhere**: instead of keeping a separate list of valid
  sessions in the database, every user has a hidden counter. Every pass they're given carries a
  copy of that counter's value at the time it was issued. Every request re-checks the user's
  *current* counter value (and whether their account is still active) against what's inside their
  pass. Bumping the counter — which happens when a password changes, or an account is
  deactivated — makes every existing pass for that person invalid immediately, everywhere, with
  no extra bookkeeping needed.
- **First Admin only, once**: the public "register" endpoint checks the database for any existing
  Admin. If one already exists, it refuses. This is the only way an account can ever be
  self-created — every other account must be created by an Admin.

### The shape of every response

- Every successful response looks like: `{ success: true, statusCode, data, message }`.
- Every error response looks like: `{ success: false, message, errors? }`. When the error came
  from a validation check, `errors` breaks down exactly which fields were wrong and why.
- In production, technical error details (stack traces) are never included — only in local
  development, to help with debugging.

## 4. What happens on the frontend, step by step

1. When the app first loads (or the page is refreshed), it silently tries to renew the session
   using the refresh cookie, without asking the user to do anything.
   - If that works, the user's information is loaded and they stay on whatever page they were on.
   - If it fails, they're treated as logged out, and any page that requires login sends them to
     the Login page.
2. From then on, every API call automatically attaches the current access pass.
3. If any call comes back saying "your pass has expired," the app automatically tries to renew it
   once (reusing one shared renewal attempt even if several calls fail at the same moment, so it
   never fires the renewal multiple times at once) and then retries the original call.
4. If the renewal itself fails, the user is signed out and sent back to the Login page.

### Which pages need to be logged in

- Pages like Login and Setup are only for people who are **not** logged in yet — if you're
  already logged in and try to visit them, you're redirected away.
- Most pages require being logged in at all — if you're not, you're sent to Login, and once you
  do log in, you're sent back to the page you originally wanted.
- Some pages additionally require a specific role (for example, Manage Users is Admin-only) — if
  your role doesn't match, you're sent to an "Unauthorized" page instead.

### Visual design

The app uses Tailwind CSS with a shared set of design tokens (colors, spacing) defined once and
reused everywhere, so light/dark and consistent styling stay centralized. The Dashboard uses a
soft, "pressed-in" visual style deliberately scoped to just that section; other pages (Login,
Setup, Change Password) use a simpler flat card style.

## 5. A strict rule: never show fake data

The dashboard must never display a number that wasn't actually calculated from real, current
data. For any feature that doesn't exist yet (Residents, Rooms, Revenue, Complaints, as of this
writing), the screen must say so plainly — for example, showing "—" with a "Soon" label — rather
than a number that only looks real. This is a firm rule, not a style choice; see
[`FRD-HMS.md`](./FRD-HMS.md), Feature 9, for where this is required.

## 6. Rules for building the next features

When a new feature (Residents, Rooms, Payments, etc.) gets built, it should follow the same
pattern already used for Login & Accounts:

- **Backend**: data shape → validation rules → service (business logic) → controller (thin) →
  routes. Reuse existing shared validation helpers instead of writing new ones for the same thing.
- **Frontend**: one dedicated file per feature for talking to the backend, matching the shared
  response-shape types. Each page manages its own loading, error, and empty states (the Manage
  Users page is a good example to copy from).
- New shared visual components go into the shared components folder; anything specific to one
  page/section stays local to that page, so a style change there can't accidentally affect
  unrelated screens.
- Every new feature gets a written spec in [`specs/`](./specs/) *before* it's built — see
  [`docs/README.md`](./README.md) for exactly how that process works.
- Passing the type-checker and linter is not the same as the feature actually working — always
  test the real flow (in a browser, or with real API calls) before calling it done.
