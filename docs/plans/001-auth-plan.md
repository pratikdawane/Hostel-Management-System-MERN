# Plan: Monorepo Foundation + Production Auth Module

**Spec:** [`../specs/001-auth.md`](../specs/001-auth.md)
**Status:** Implemented
**Written retroactively** from the plan actually approved and executed for this module.

## Context

Starting point was a stray, broken `backend/server.ts` (plain `require()` in a `.ts` file,
undefined Swagger references, hardcoded port) and an empty root `index.html` — effectively
greenfield. Goal: a clean monorepo skeleton (`backend/`, `frontend/`, root config) plus a
complete, secure, production-grade auth module — not the full feature set.

Decisions locked in before implementation:
- Public registration only ever creates the *first* Admin; all other accounts are Admin-created.
- Scope = monorepo structure + auth module only; Students/Rooms/Rent/etc. explicitly deferred.
- No automated test suite this pass (fast-follow later).

## Architecture decisions

- **Roles**: single `User` model, `role` enum (`admin`/`manager`/`resident`) — simplest correct
  model for three flat roles.
- **Tokens**: short-lived JWT access token in the response body (frontend keeps it in memory,
  never `localStorage`); longer-lived JWT refresh token in an `httpOnly` cookie scoped to
  `/api/auth`, rotated on refresh. `tokenVersion` on the user enables bulk session revocation
  without a server-side token-store collection.
- **Bootstrap registration**: `/api/auth/register` checks whether any Admin exists; 403 if so.
- **Admin user management**: minimal create/list/status-toggle — enough to make the chosen
  account-creation model actually usable end-to-end, not full CRUD.
- **Backend stack**: Express 5 (native async-error forwarding, no `asyncHandler` needed),
  Mongoose, Zod validation middleware, centralized `ApiError`/error handler, bcrypt (12 rounds),
  helmet, cors (credentials + `CLIENT_URL`), cookie-parser, rate limiting (strict on
  login/register), morgan (dev only). Dropped the old, unused, broken Swagger setup.
- **Frontend stack**: Vite + React + TS, Tailwind, React Router, Axios (interceptor-based
  refresh), React Hook Form + Zod, Lucide, Sonner.

## Execution steps (as run)

1. Design lookup via the `ui-ux-pro-max` skill before any UI work.
2. Root scaffold: `package.json` (npm workspaces), `.gitignore`, root `.env.example`, `README.md`.
3. Backend: real `npm install` for every dependency (never hand-typed version numbers — the
   registry is the source of truth, not guesses), `tsconfig.json` (NodeNext/ESM/strict), full
   `src/` build-out per the layered architecture in `../Architecture.md`.
4. Frontend: Vite scaffold, dependency install, Tailwind tokens, `api.ts` with interceptors,
   `AuthContext`/`useAuth`, route guards, all auth-related pages.
5. Wire + verify: live end-to-end testing — not just typecheck/lint. Backend via `curl` against a
   real MongoDB Atlas connection; frontend via an actual Playwright-driven browser session
   (screenshots reviewed, not just "it compiled").
6. Report scope clearly: what shipped vs. what's still deferred.

## Notes from implementation

Two real bugs were caught only by live verification, not by typecheck/lint — recorded in
[`../specs/001-auth.md`](../specs/001-auth.md#notes-from-implementation):

1. `passwordChangedAt` leaking into API responses (set in-memory during the request, so
   `select: false` didn't hide it — only the `toJSON` transform does).
2. The `User` model never enabled Mongoose's `id` virtual, so responses carried `_id` instead of
   `id` — broke the frontend's `User` type contract and React list keys in Manage Users.

Both are now fixed and covered by the model's `toJSON` transform. Takeaway carried into
[`../Architecture.md`](../Architecture.md) §6: **typecheck-clean is not verified — running the
actual app is.**
