# Architecture — Hostel Management System

**Status:** Living document, describes the system as it actually exists in the repo.
**Last updated:** 2026-08-29

## 1. Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, React Hook Form + Zod, Lucide React, Sonner, Recharts |
| Backend | Node.js, Express 5, TypeScript (ESM/NodeNext), MongoDB, Mongoose, JWT, bcrypt, Zod |
| Monorepo | npm workspaces (`backend`, `frontend`) |

Full env var reference and setup steps: [`ENVIRONMENT-SETUP.md`](./ENVIRONMENT-SETUP.md).

## 2. Repository layout

```
backend/src/
├── config/       env.ts (Zod-validated env, fails fast), db.ts (Mongoose connection)
├── constants/    roles.ts — the single source of truth for the 3-role enum
├── models/       user.model.ts
├── validators/   Zod schemas per domain (common.validator.ts holds shared email/password/id schemas)
├── services/     business logic (auth, user, token) — controllers never touch Mongoose directly
├── controllers/  thin HTTP layer: parse req → call service → shape response
├── routes/       Express routers, wire validate() + protect()/authorize() per route
├── middleware/   validate, auth (protect/authorize), error handler, notFound, rate limiting
├── utils/        ApiError, ApiResponse
├── types/        express.d.ts (Request augmentation: req.user, req.validatedQuery)
├── app.ts        Express app assembly (helmet, cors, rate limit, routes, error handler)
└── server.ts     bootstrap: connect DB, listen, graceful shutdown on SIGTERM/SIGINT

frontend/src/
├── components/ui/        Shared primitives (Button, Input, Card, Modal, Badge, Skeleton, ...)
├── components/dashboard/ Dashboard-only widgets (MiniCalendar, RevenueChart) — not used elsewhere
├── pages/                One file per route; pages/admin/ for Admin-only pages
├── layouts/              AuthShell (public auth pages), DashboardLayout (protected app shell)
├── context/ + hooks/     AuthContext/useAuth — the single source of truth for "who is logged in"
├── services/             api.ts (Axios instance + refresh interceptor), authService, userService,
│                         tokenStore.ts (in-memory access token), authEvents.ts (session-expired event)
├── routes/               AppRoutes.tsx — route table + guards
├── styles/neumorphism.ts Shadow-utility constants for the dashboard's soft-UI look
└── lib/                  cn.ts (classname join), schemas.ts (shared RHF/Zod form schemas)
```

## 3. Backend request flow

```
Request → helmet/cors → rate limiter → route
  → validate(schema, target)   [400 on bad input, never reaches the controller]
  → protect                    [401 if no/invalid/expired/stale token]
  → authorize(...roles)        [403 if role not permitted]
  → controller                 [thin: extract input, call service, shape ApiResponse]
  → service                    [business rules + Mongoose]
  → errorHandler                [centralized; last middleware, catches everything]
```

Express 5 forwards rejected promises from `async` route handlers to the error handler
automatically — there is no `asyncHandler` wrapper anywhere in this codebase; a service throwing
`ApiError` is enough.

### Validation (`middleware/validate.middleware.ts`)

Validates exactly one of `body` / `params` / `query` per call against a Zod schema. `body` and
`params` are reassigned onto the request after parsing (so defaults/coercions apply); `query`
cannot be reassigned in Express 5 (it's a getter-only property), so validated query data is
stashed on `req.validatedQuery` instead — controllers that need it read from there, not `req.query`.

### Auth design

- **Access token**: short-lived JWT (`JWT_ACCESS_EXPIRES_IN`, default 15m), returned in the
  response body only — never set as a cookie, never written to `localStorage`. The frontend
  holds it in memory (`services/tokenStore.ts`) and attaches it as `Authorization: Bearer`.
- **Refresh token**: longer-lived JWT (`JWT_REFRESH_EXPIRES_IN`, default 7d), set as an
  `httpOnly`, `sameSite=lax` cookie scoped to `/api/auth`. `POST /api/auth/refresh` rotates it.
- **Revocation without a token store**: each user has a `tokenVersion` counter. Both token types
  embed it; `protect` re-fetches the user on every request and compares live `tokenVersion` (and
  `isActive`) against the token's claim. Bumping `tokenVersion` (on password change, or on
  deactivation) invalidates every existing token for that user immediately — no server-side
  session/token table to maintain.
- **Bootstrap registration**: `POST /api/auth/register` only succeeds while zero Admins exist.
  After that it's 403 forever — the only way to create further accounts is Admin → Manage Users.

### Response shape

Every successful response is `{ success: true, statusCode, data, message }` (`utils/ApiResponse.ts`).
Every error is `{ success: false, message, errors? }` (`middleware/error.middleware.ts`), with
`errors` carrying Zod's `{ fieldErrors, formErrors }` shape for validation failures, and a `stack`
field included only outside production.

## 4. Frontend request flow

```
AuthContext (on mount)
  → POST /auth/refresh (silent, using the httpOnly cookie)
  → success: user restored, accessToken cached in tokenStore
  → failure: user = null → guarded routes redirect to /login

Every subsequent request (services/api.ts)
  → request interceptor attaches Authorization: Bearer <tokenStore value>
  → response interceptor: on 401 (and not already retried, and not an auth-bootstrap endpoint),
    dedupe concurrent refreshes via a shared in-flight promise, retry the original request once
  → still failing: emitSessionExpired() → AuthContext clears state → redirect to /login
```

### Routing & guards (`routes/AppRoutes.tsx`)

- `GuestRoute` — public auth pages (Login/Setup); redirects away if already authenticated.
- `ProtectedRoute` — requires a session; shows a full-page loader while the initial silent
  refresh is in flight, redirects to `/login` (preserving intended destination) if it fails.
- `RoleGuard` — wraps `ProtectedRoute`'s children to additionally require a specific role
  (e.g. `/admin/users` is Admin-only); redirects to `/unauthorized` otherwise.

### Design system

Tailwind v4, CSS-first tokens in `index.css` (`--color-primary-*`, `--color-neu-*`, etc.), light
and dark handled per the standard token pattern. The dashboard shell (`DashboardLayout` +
`Dashboard` page + `components/dashboard/*`) uses a soft-UI "neumorphic" treatment
(`styles/neumorphism.ts` — `NEU_RAISED` / `NEU_PRESSED` / `NEU_PRESS_ON_ACTIVE`), deliberately
scoped to just that shell; other pages (Login, Setup, Change Password) use the plain flat card
style from `components/ui/Card.tsx` and are not part of that visual system.

## 5. Data honesty (hard rule, not a preference)

The dashboard must never show a number that wasn't actually computed from real data. Where a
module doesn't exist yet (Students, Rooms, Revenue, Complaints as of this writing), the UI shows
an explicit "not tracked yet" / empty state — never a plausible-looking fake figure. This came up
concretely: the stat cards show `—` with a "Soon" badge, and the Revenue chart renders a real
Recharts frame with an empty-state overlay, rather than an invented trend line. Any new
data-bearing UI must follow the same rule — see [`FRD-HMS.md`](./FRD-HMS.md) FR-9.2.

## 6. Conventions for new modules

- Backend: `model → validator (Zod) → service → controller → routes`, matching the auth module's
  file-per-concern layout exactly. Reuse `common.validator.ts`'s `objectIdSchema` etc. rather than
  redefining.
- Frontend: one `services/<domain>Service.ts` per backend resource, typed against
  `types/api.ts`'s `ApiEnvelope<T>`; page-level components own their own loading/error/empty
  states (see `ManageUsers.tsx` for the reference pattern).
- New shared UI primitives go in `components/ui/`; anything specific to one page/section stays
  local to that page or in a page-scoped subfolder (as `components/dashboard/` does) so it can't
  leak style changes into unrelated screens.
- Every new module gets a spec in [`specs/`](./specs/) *before* implementation — see
  [`docs/README.md`](./README.md) for the flow.
