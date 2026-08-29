# Architecture & Technical Documentation

| Field | Value |
| --- | --- |
| Document Version | 2.0 |
| Date | 2026-08-30 |
| Platform | Hostel Management System (HMS) — Single-Hostel Operations Web App |
| Status | Living document — describes the system exactly as it exists in the repo today, and clearly marks what's only planned |

This document describes the system the way you'd explain it to a technical stakeholder: what the
pieces are, how they connect, and how data flows through them. For *why* the project exists, see
[`BRD-HMS.md`](./BRD-HMS.md); for *what* it must do, see [`FRD-HMS.md`](./FRD-HMS.md); for
phase-by-phase build status, see [`ImplementationPlan.md`](./ImplementationPlan.md).

**A note on scale, up front:** HMS is intentionally built for **one hostel**, not a multi-tenant
SaaS platform. There is no org/tenant isolation, no message queue, no object storage, no payment
gateway, and no separate worker process — none of that is needed at this scale, and adding it
would be over-engineering (see [`BRD-HMS.md`](./BRD-HMS.md) §4). Every diagram below reflects
that — it is deliberately simple.

## Table of Contents
1. [System Architecture — High Level](#1-system-architecture--high-level)
2. [System Architecture — Low Level](#2-system-architecture--low-level)
3. [Application Workflow Diagrams](#3-application-workflow-diagrams)
4. [Database Architecture](#4-database-architecture)
5. [Development Effort Estimate](#5-development-effort-estimate)
6. [API Architecture](#6-api-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Scalability Notes](#9-scalability-notes)

---

## 1. System Architecture — High Level

### 1.1 Platform overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  Hostel Management System (HMS)                 │
│                                                                   │
│      "One system of record for a single hostel's operations"    │
│                                                                   │
│      ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│      │  Admin   │      │ Manager  │      │ Resident │           │
│      │ (owner)  │      │ (staff)  │      │ (tenant) │           │
│      └────┬─────┘      └────┬─────┘      └────┬─────┘           │
│           │                 │                 │                  │
│      Full control     Day-to-day work:   Views own room,        │
│      accounts,        residents, rooms,  rent, complaints;      │
│      money, final     allocations,       raises complaints      │
│      say on records   check-in/out                               │
│           │                 │                 │                  │
│           └─────────────────┴─────────────────┘                  │
│                             │                                    │
│                   ┌─────────▼──────────┐                         │
│                   │   HMS Web App +    │                         │
│                   │   HMS API Server   │                         │
│                   └─────────┬──────────┘                         │
│                             │                                    │
│                   ┌─────────▼──────────┐                         │
│                   │      MongoDB       │                         │
│                   └────────────────────┘                         │
└───────────────────────────────────────────────────────────────────┘
```

Today, the Manager and Resident roles exist in the account system but their dedicated screens
(residents, rooms, complaints, etc.) aren't built yet — see
[`ImplementationPlan.md`](./ImplementationPlan.md) for what's live now.

### 1.2 High-level request path

```
┌────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │              Browser — React 19 + TypeScript + Vite            │    │
│   │              (responsive; works on phone, tablet, desktop)     │    │
│   └────────────────────────────┬─────────────────────────────────┘    │
└────────────────────────────────┼────────────────────────────────────────┘
                                  │  HTTPS / REST (JSON), Axios
                                  │
┌────────────────────────────────┼────────────────────────────────────────┐
│                        APPLICATION LAYER                                │
│                                 │                                       │
│   ┌─────────────────────────────▼─────────────────────────────────┐    │
│   │              Express.js 5 API Server (TypeScript, strict)       │    │
│   │                                                                  │    │
│   │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐ │    │
│   │  │  Helmet  │→│   CORS   │→│    Rate    │→│  Route + Zod     │ │    │
│   │  │ headers  │ │(CLIENT_  │ │  Limiter   │ │  Validation      │ │    │
│   │  │          │ │  URL)    │ │(auth routes│ │  (body/params/   │ │    │
│   │  │          │ │          │ │   only)    │ │   query)         │ │    │
│   │  └──────────┘ └──────────┘ └────────────┘ └────────┬─────────┘ │    │
│   │                                                     │            │    │
│   │  ┌──────────────────────────────────────────────────▼────────┐ │    │
│   │  │  protect (session check)  →  authorize(...roles) (403)    │ │    │
│   │  └──────────────────────────────┬───────────────────────────┘ │    │
│   │                                 │                              │    │
│   │  ┌──────────────────────────────▼───────────────────────────┐ │    │
│   │  │        Controllers (thin) → Services (business logic)     │ │    │
│   │  │        auth · users  (residents/rooms/etc. — planned)     │ │    │
│   │  └──────────────────────────────┬───────────────────────────┘ │    │
│   │                                 │                              │    │
│   │  ┌──────────────────────────────▼───────────────────────────┐ │    │
│   │  │             Centralized Error Handler (last middleware)    │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────────┘
                                  │  Mongoose
                                  │
┌────────────────────────────────▼────────────────────────────────────────┐
│                              DATA LAYER                                 │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                          MongoDB                                │    │
│   │  Users (built)                                                  │    │
│   │  Residents · Rooms · Beds · Allocations · Payments · Complaints │    │
│   │  (planned — see FRD-HMS.md)                                     │    │
│   └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

There is **no** reverse proxy, load balancer, message queue, cache layer, or object storage in
this system — deliberately. One Node process talks directly to one MongoDB database. See
[§8 Deployment Architecture](#8-deployment-architecture) for what a production setup adds on top
of this without changing the design.

---

## 2. System Architecture — Low Level

### 2.1 Backend — component breakdown

```
backend/src/
│
├── app.ts                     Assembles the Express app: helmet, cors, rate limiter,
│                               cookie parsing, routes, notFound + error handlers
├── server.ts                  Bootstraps: connect to MongoDB, then listen; graceful
│                               shutdown on SIGTERM/SIGINT
│
├── config/
│   ├── env.ts                 Reads process.env, validates it with Zod at startup —
│   │                           the process exits with a clear message if anything's
│   │                           missing or malformed. Nothing downstream ever sees an
│   │                           unvalidated environment variable.
│   └── db.ts                  Mongoose connection to MongoDB
│
├── constants/
│   └── roles.ts                The 3-role enum (admin/manager/resident) — one place,
│                               imported everywhere a role is checked
│
├── models/                     Mongoose schemas — the shape of what's stored
│   └── user.model.ts            Built. (Resident/Room/Bed/Allocation/Payment/Complaint
│                                are planned — see §4 Database Architecture)
│
├── validators/                 Zod schemas — reject bad input before it reaches
│   │                           any business logic
│   ├── common.validator.ts      Shared building blocks (e.g. objectIdSchema, email,
│   │                           password rules) reused by every other validator
│   ├── auth.validator.ts
│   └── user.validator.ts
│
├── services/                   Business logic. Controllers never touch Mongoose
│   │                           directly — only services do.
│   ├── auth.service.ts          Registration, login, refresh, logout, password change
│   ├── token.service.ts         Signing/verifying access + refresh JWTs
│   └── user.service.ts          Create/list/activate/deactivate accounts
│
├── controllers/                 Thin HTTP layer: read the request, call one service
│   ├── auth.controller.ts        method, shape the response — no business rules live
│   └── user.controller.ts        here
│
├── routes/                       Express routers — wire validate() + protect() +
│   ├── index.ts                   authorize() in front of each controller method
│   ├── auth.routes.ts
│   └── user.routes.ts
│
├── middleware/
│   ├── validate.middleware.ts    Validates body/params/query against a Zod schema
│   ├── auth.middleware.ts        protect() (must have a valid session) and
│   │                              authorize(...roles) (must have the right role)
│   ├── rateLimit.middleware.ts   Strict limiter on /auth/login and /auth/register
│   ├── error.middleware.ts       Turns any thrown error into a safe, consistent
│   │                              response — never leaks a stack trace in production
│   └── notFound.middleware.ts    404 for unknown routes
│
├── utils/
│   ├── ApiError.ts               A typed error you can `throw` from a service, with
│   │                              a status code and message baked in
│   └── ApiResponse.ts            Builds the consistent `{ success, data, message }`
│                                  success envelope
│
└── types/
    └── express.d.ts              Adds `req.user` and `req.validatedQuery` to
                                    Express's Request type
```

### 2.2 Frontend — component breakdown

```
frontend/src/
│
├── main.tsx / App.tsx           App entry point and top-level providers
│
├── routes/
│   └── AppRoutes.tsx             The full route table, wrapped in guards:
│                                  GuestRoute · ProtectedRoute · RoleGuard
│
├── context/ + hooks/
│   ├── AuthContext.tsx           The single source of truth for "who is logged in" —
│   │                              restores a session silently on page load
│   └── useAuth.ts                Hook to read that context from any component
│
├── services/                     The ONLY place that calls the backend — pages never
│   │                              call Axios directly
│   ├── api.ts                     Axios instance: request interceptor attaches the
│   │                              access token, response interceptor retries once
│   │                              after a silent refresh on 401
│   ├── tokenStore.ts              Access token held in memory only — never
│   │                              localStorage, never a cookie the app can read
│   ├── authEvents.ts              Fires a "session expired" event the whole app
│   │                              listens for, to force a clean logout
│   ├── authService.ts             login / register / refresh / logout / me / change-password
│   └── userService.ts             create / list / activate / deactivate accounts
│
├── layouts/
│   ├── AuthShell.tsx              Frame around public pages (Login, Setup)
│   └── DashboardLayout.tsx        Frame around every logged-in page (sidebar + top bar)
│
├── pages/                         One file per screen
│   ├── Login.tsx · Setup.tsx · ChangePassword.tsx
│   ├── Unauthorized.tsx · NotFound.tsx
│   ├── Dashboard.tsx              Stat cards + MiniCalendar + RevenueChart
│   └── admin/
│       ├── ManageUsers.tsx        Admin-only account list
│       └── CreateUserModal.tsx
│
├── components/
│   ├── ui/                        Shared building blocks: Button, Input,
│   │                              PasswordInput, Select, Card, Modal, Badge,
│   │                              Skeleton, FullPageLoader
│   ├── dashboard/                 MiniCalendar, RevenueChart — used only on Dashboard
│   ├── ProtectedRoute.tsx / GuestRoute.tsx / RoleGuard.tsx
│
├── types/
│   ├── api.ts                     The shared `ApiEnvelope<T>` response shape
│   └── auth.ts                    User / role / auth request-response types
│
├── lib/
│   ├── schemas.ts                 Shared React Hook Form + Zod validation schemas
│   └── cn.ts                      Classname-join helper
│
├── styles/
│   └── neumorphism.ts             Shadow-style constants, scoped to the Dashboard shell
│
└── utils/
    └── errors.ts                  Turns a raw Axios/API error into a user-facing message
```

---

## 3. Application Workflow Diagrams

### 3.1 First-run bootstrap (Setup → first Admin)

```
Visitor opens the app
        │
        ▼
No Admin exists yet? ──No──▶ "Create the admin account" is hidden; go straight to Login
        │ Yes
        ▼
Setup page: name + email + password
        │
        ▼
POST /api/auth/register
        │
        ▼
User created with role = admin, password hashed with bcrypt
        │
        ▼
Access + refresh tokens issued → logged in immediately → redirected to Dashboard
```

### 3.2 Login + silent session restore

```
User submits email + password
        │
        ▼
POST /api/auth/login
        │
   ┌────┴─────┐
   │ Account   │──inactive──▶ 403 "account is deactivated"
   │ active?   │
   └────┬─────┘
        │ active
        ▼
Password matches (bcrypt.compare)? ──No──▶ 401 "invalid credentials"
        │ Yes
        ▼
Access token (body, 15m) + refresh token (httpOnly cookie, 7d) issued
        │
        ▼
Frontend stores access token in memory, redirects to Dashboard

── Later: user refreshes the browser tab ──

App loads → AuthContext calls POST /api/auth/refresh using the cookie (silent, no user action)
        │
   ┌────┴─────┐
   │ Cookie    │──valid & current──▶ new access token issued → session restored, stays on page
   │ valid?    │──invalid/expired──▶ user = null → protected routes redirect to /login
   └──────────┘
```

### 3.3 Automatic token refresh during normal use

```
Any API call made while using the app
        │
        ▼
Response is 401 (access token expired)?
   │                              │
   No → return response      Yes → is this already a retry, or an auth-bootstrap
                                    call itself? → No → call /api/auth/refresh
                                                           (only ONE refresh in flight
                                                           at a time, shared by every
                                                           call that needs it)
                                                                 │
                                                        ┌────────┴────────┐
                                                        │ succeeded         │ failed
                                                        ▼                   ▼
                                              retry the original     emit "session
                                              request once with      expired" → clear
                                              the new token          auth state → /login
```

### 3.4 Admin creates a Manager/Resident account

```
Admin → Manage Users → "Add user"
        │
        ▼
Fill in name, email, role, initial password
        │
        ▼
POST /api/users  (rejected with 403 if caller isn't Admin)
        │
        ▼
New account created, tokenVersion = 0, isActive = true
        │
        ▼
Appears immediately in the Manage Users list (paginated, filterable by role)
```

### 3.5 Password change → session revocation

```
User → Change Password → current password + new password
        │
        ▼
PUT /api/auth/change-password
        │
   current password correct? ──No──▶ 400 error, nothing changes
        │ Yes
        ▼
New password hashed + saved; tokenVersion += 1
        │
        ▼
Every OTHER access/refresh token for this user now fails its next
tokenVersion check → those sessions are logged out on their next request.
The CURRENT session (this request) is issued a fresh token pair, so it
stays logged in.
```

### 3.6 Planned workflow — Room allocation (Phase 4, not built yet)

```
Admin/Manager → Allocations → New
        │
        ▼
Pick Resident → Pick Room → Pick an AVAILABLE bed in that room → dates → rent/deposit
        │
        ▼
POST /api/allocations
        │
   ┌────┴──────────────────────────────────────────────┐
   │ Bed already OCCUPIED?           ──▶ 400 "Bed is already occupied."      │
   │ Bed under MAINTENANCE?          ──▶ 400 "Bed is currently under        │
   │                                       maintenance."                     │
   │ Resident already has an ACTIVE  ──▶ 400 duplicate-allocation error      │
   │   allocation elsewhere?                                                 │
   │ Room capacity already reached?  ──▶ 400 capacity error                  │
   └────┬────────────────────────────────────────────────────────────────┘
        │ all checks pass
        ▼
Bed → OCCUPIED · Resident → ACTIVE · Allocation → ACTIVE
```

---

## 4. Database Architecture

### 4.1 Built today

**`users` collection**

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | |
| `email` | string | unique, indexed |
| `password` | string | bcrypt hash, hidden from query results by default |
| `role` | enum | `admin` \| `manager` \| `resident` |
| `phone` | string? | optional |
| `isActive` | boolean | deactivation flips this |
| `tokenVersion` | number | hidden; incremented to revoke all existing sessions |
| `passwordChangedAt` | date? | hidden |
| `createdBy` | ObjectId → User | who created this account (null for the bootstrap Admin) |
| `createdAt` / `updatedAt` | date | automatic |

`toJSON` strips `password`, `tokenVersion`, and `passwordChangedAt`, and exposes `id` instead of
Mongo's raw `_id`, so the API never accidentally leaks sensitive internal fields.

### 4.2 Planned collections and how they relate (FRD Features 3–8)

```
                 Admin
                   │
                   │ creates/manages accounts for
                   ▼
                 Users (admin / manager / resident)
                                    │
                                    │ a resident account may link to
                                    ▼
Rooms                          Residents
  │                                 │
  └── Beds                         │
        │                          │
        └───────────┬──────────────┘
                     ▼
              RoomAllocation
              (residentId, roomId, bedId, dates, rent, deposit, status)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
    Payments                 (Check-in/Check-out are actions on
 (residentId,                 an existing allocation, not a
  allocationId,                separate collection)
  amount, method,
  type, status)

Residents
    │
    └── Complaints
         (residentId, category, priority, status, assignedTo)
```

Key rules that shape this design (see [`FRD-HMS.md`](./FRD-HMS.md) for the full list):
- A `Resident` record can exist before that person has a login `User` account (e.g. pending
  admission) — the link is optional, not required.
- `RoomAllocation` is its own collection, not fields bolted onto `Resident` — a resident's stay
  history (past + current allocations) needs to be kept, not overwritten.
- A `Bed`'s status (`AVAILABLE` / `OCCUPIED` / `MAINTENANCE`) is the single source of truth for
  occupancy — `Room.status` is a rollup derived from its beds, not tracked independently.

### 4.3 Indexes

| Collection | Indexed fields | Why |
| --- | --- | --- |
| Users (built) | `email` (unique) | login lookup, uniqueness |
| Residents (planned) | `email`, `phone`, `studentId` | search + duplicate prevention |
| Rooms (planned) | `roomNumber` | search |
| Payments (planned) | `residentId`, `paymentDate` | "who owes what" queries, statements |
| Complaints (planned) | `residentId`, `status`, `createdAt` | resident's own list, staff triage queues |

No indexes exist beyond what's actually queried — extra indexes slow down writes for no benefit
at this scale.

---

## 5. Development Effort Estimate

Rough planning estimate only — for a single developer working through the remaining phases in
[`ImplementationPlan.md`](./ImplementationPlan.md). Not a billing document; re-estimate once a
phase's spec is written, since specs can surface complexity this table can't predict.

| Phase | Description | Estimate |
| --- | --- | --- |
| 1 | Project setup + Auth & user management | Done |
| 2 | Residents | 2–3 days |
| 3 | Rooms & Beds | 2–3 days |
| 4 | Room Allocation (validation-heavy) | 3–4 days |
| 5 | Check-in / Check-out | 1–2 days |
| 6 | Rent & Payments | 2–3 days |
| 7 | Complaints | 2 days |
| 8 | Full dashboard (wiring real data) | 1–2 days |
| 9 | Testing, polish & deployment | 3–5 days |
| **Total remaining** | | **~17–24 working days** |

---

## 6. API Architecture

```
/api
 ├── /auth            Built — register(once) · login · refresh · logout · me · change-password
 ├── /users            Built — Admin-only: create · list · activate/deactivate
 ├── /residents         Planned (Phase 2)
 ├── /rooms             Planned (Phase 3)
 ├── /rooms/:id/beds    Planned (Phase 3)
 ├── /allocations       Planned (Phase 4) — incl. /allocations/:id/checkout (Phase 5)
 ├── /payments          Planned (Phase 6)
 ├── /complaints        Planned (Phase 7)
 └── /dashboard         Planned (Phase 8) — one aggregated summary endpoint,
                          not several small calls
```

Every route follows the same pipeline, regardless of module:

```
route  →  validate(schema, body|params|query)  →  protect()  →  authorize(...roles)?
       →  controller (thin)  →  service (business logic + Mongoose)  →  ApiResponse
```

Express 5 forwards a rejected promise from an `async` route handler straight to the error
handler — there's no `asyncHandler` wrapper anywhere; a service just `throw`s an `ApiError` and
the centralized handler takes it from there.

**Response shape (every endpoint, no exceptions):**
- Success: `{ success: true, statusCode, data, message }`
- Error: `{ success: false, message, errors? }` — `errors` carries per-field validation messages
  when the failure came from Zod.

---

## 7. Security Architecture

```
Request
   │
   ▼
Helmet — sets safe HTTP security headers
   │
   ▼
CORS — only the configured CLIENT_URL origin may call this API, credentials allowed
   │
   ▼
Rate limiter — /auth/login and /auth/register: 10 requests / 15 min / IP
   │
   ▼
Zod validation — bad input rejected before touching any business logic
   │
   ▼
protect() — must present a valid, current access token
   │           (checked against live isActive + tokenVersion on every request —
   │            not just whether the JWT signature is valid)
   ▼
authorize(role) — must have the right role for this route
   │
   ▼
Controller → Service → MongoDB
   │
   ▼
Centralized error handler — production responses never include a stack trace
```

**Password & session security**
- Passwords hashed with bcrypt — never stored or logged in plain text.
- Access tokens: short-lived (15m default), body-only, kept in frontend memory — never
  `localStorage`, never a JS-readable cookie.
- Refresh tokens: longer-lived (7d default), `httpOnly` + `sameSite` cookie, scoped to
  `/api/auth` only.
- `tokenVersion` gives instant "log out everywhere" (password change, deactivation) without a
  server-side session table to maintain and keep in sync.
- The public `register` endpoint is permanently disabled after the first Admin exists — it's not
  a general sign-up route, ever.

**Planned, as later modules are built**
- Resident-scoped access control: a Resident's own complaint/payment/room data must be visible
  only to that Resident (and to Admin/Manager) — enforced in the service layer, not just hidden
  in the UI (see [`FRD-HMS.md`](./FRD-HMS.md) Feature 8.3).

---

## 8. Deployment Architecture

**Nothing is deployed yet — this is local-development only today** (no Dockerfile, no CI/CD
pipeline, and no hosting configured exist in this repository as of this writing). The section
below is a recommendation for when that becomes necessary, matched to this project's actual
scale — not a description of an existing setup.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Recommended minimal setup                    │
│                                                                   │
│   ┌───────────────────┐        ┌────────────────────────────┐   │
│   │  Static hosting     │        │  Single small Node process  │   │
│   │  for the built       │───────▶│  running the Express API    │   │
│   │  frontend            │  HTTPS │  (backend/dist)              │   │
│   │  (e.g. Vercel/       │        │  (e.g. Render/Railway/a      │   │
│   │   Netlify/S3+CDN)    │        │   small VM)                  │   │
│   └───────────────────┘        └───────────────┬────────────┘   │
│                                                    │                │
│                                          ┌─────────▼─────────┐     │
│                                          │  MongoDB Atlas     │     │
│                                          │  (managed, free/   │     │
│                                          │   low tier is       │     │
│                                          │   plenty at this    │     │
│                                          │   scale)            │     │
│                                          └───────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

No load balancer, container orchestration, queue, or CDN-in-front-of-the-API is warranted — a
single hostel's traffic (tens to a few hundred residents, staff-driven usage patterns) doesn't
come close to needing it, and adding it now would be exactly the kind of over-engineering
[`BRD-HMS.md`](./BRD-HMS.md) rules out.

---

## 9. Scalability Notes

- The system is built and indexed for **one hostel** at a time — tens to a few hundred residents,
  a few hundred rooms/beds at most. It is not designed, and should not be extended, for
  multi-hostel/multi-tenant use without a deliberate architecture change (new BRD scope first).
- List endpoints (`/api/users` today; `/api/residents`, `/api/payments`, etc. once built) must
  always be paginated — never return an unbounded result set.
- The dashboard's planned `GET /api/dashboard` is one aggregated query, not several round trips —
  this matters more for keeping the UI simple and fast than for raw scale.
- If a genuine multi-hostel need arises later, that's a new phase with its own BRD/FRD update
  (see [`BRD-HMS.md`](./BRD-HMS.md) §4) — not something to quietly bolt onto this design.

---

## 10. Conventions for building the next module

When a new feature (Residents, Rooms, Payments, etc.) gets built, follow the same pattern already
used for Auth & Users:

- **Backend**: model → validator (Zod) → service → controller → routes, matching the file-per-
  concern layout in §2.1 exactly. Reuse `common.validator.ts`'s shared schemas rather than
  redefining them.
- **Frontend**: one `services/<domain>Service.ts` per backend resource, typed against
  `types/api.ts`'s `ApiEnvelope<T>`; each page owns its own loading/error/empty states (see
  `ManageUsers.tsx` as the reference pattern).
- New shared UI primitives go in `components/ui/`; anything specific to one page/section stays
  local to that page (as `components/dashboard/` does), so a style change can't leak into
  unrelated screens.
- **Data honesty (hard rule):** the dashboard must never show a number that wasn't actually
  computed from real data. Where a module doesn't exist yet, the UI shows an explicit "not
  tracked yet" / empty state — never a plausible-looking fake figure. See
  [`FRD-HMS.md`](./FRD-HMS.md) Feature 9.2.
- Every new module gets a spec in [`specs/`](./specs/) *before* implementation — see
  [`docs/README.md`](./README.md) for the process.
- Passing the type-checker/linter is not verification — the actual flow must be exercised in a
  browser (or via real API calls) before a change is considered done.
