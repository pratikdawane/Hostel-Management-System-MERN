# Hostel Management System — Implementation Plan

| Field | Value |
| --- | --- |
| Document Version | 1.0 |
| Date | 2026-08-30 |
| Status | Active |

## Progress Overview

| Phase | Description | Status | Completion |
| --- | --- | --- | --- |
| Phase 1 | Project Setup + Auth & User Management | ✅ Complete | 100% |
| Phase 2 | Residents | 🔜 Not started | 0% |
| Phase 3 | Rooms & Beds | 🔜 Not started | 0% |
| Phase 4 | Room Allocation | 🔜 Not started | 0% |
| Phase 5 | Check-in / Check-out | 🔜 Not started | 0% |
| Phase 6 | Rent & Payments | 🔜 Not started | 0% |
| Phase 7 | Complaints | 🔜 Not started | 0% |
| Phase 8 | Full Dashboard (real data) | 🔶 Partial | 20% (layout + shell built, no real data sources yet) |
| Phase 9 | Testing, Polish & Deployment | 🔜 Not started | 0% |

## Context

Techonsy is building the **Hostel Management System (HMS)** — a single-hostel operations app for
tracking residents, rooms, beds, rent, and complaints from one place instead of registers and
spreadsheets. It is deliberately **not** a multi-tenant SaaS product — one hostel, one database,
three roles (Admin, Manager, Resident). Built with the MERN stack + TypeScript: React 19 + Vite +
Tailwind on the frontend, Node.js + Express 5 + MongoDB/Mongoose on the backend.

**Reference documents:**

- [`docs/BRD-HMS.md`](./BRD-HMS.md) — Business requirements: why this exists, who uses it, scope
- [`docs/FRD-HMS.md`](./FRD-HMS.md) — Functional requirements: what each feature must do
- [`docs/Architecture.md`](./Architecture.md) — Technical architecture, folder layout, request flow
- [`docs/ENVIRONMENT-SETUP.md`](./ENVIRONMENT-SETUP.md) — Step-by-step local environment setup
- [`docs/specs/`](./specs/) — One detailed spec per feature, written before it's built
- [`docs/plans/`](./plans/) — Technical build plan per feature, kept as a permanent record

This document is the single place that tracks **phase-by-phase build progress**. Each phase maps
to one or more features in `FRD-HMS.md`. A phase only gets checked off once it's been used
end-to-end in a real browser — not just typechecked.

---

## Phase 1: Project Setup + Auth & User Management ✅

**Status:** Complete — monorepo scaffold, backend infrastructure, and a full login/account system
are built and verified live. Spec: [`specs/001-auth.md`](./specs/001-auth.md). Plan:
[`plans/001-auth-plan.md`](./plans/001-auth-plan.md).

### 1.1 Backend setup
- [x] Node.js + TypeScript + Express 5, ESM/NodeNext, `strict: true`
- [x] Folder structure: `src/{config,constants,models,validators,services,controllers,routes,middleware,utils,types}`
- [x] `config/env.ts` — validates every required environment variable with Zod at startup; the
      server refuses to boot with a clear message if anything is missing or invalid
- [x] `config/db.ts` — MongoDB connection via Mongoose
- [x] `constants/roles.ts` — single source of truth for the three roles: `admin`, `manager`, `resident`
- [x] Security: Helmet, CORS scoped to `CLIENT_URL`, request body size limits
- [x] Rate limiting on `/api/auth/login` and `/api/auth/register` (10 requests / 15 min / IP)
- [x] `middleware/validate.middleware.ts` — validates `body`/`params`/`query` against Zod schemas
      before a request reaches its controller
- [x] `middleware/error.middleware.ts` + `notFound.middleware.ts` — centralized error handling,
      consistent `{ success, message, errors? }` shape, no stack traces outside development
- [x] `utils/ApiError.ts` + `utils/ApiResponse.ts` — consistent success/error response helpers

### 1.2 Auth & sessions
- [x] `User` model: `name`, `email` (unique), `password` (bcrypt hash, hidden by default), `role`,
      `phone?`, `isActive`, `tokenVersion` (hidden, drives instant session revocation),
      `passwordChangedAt?` (hidden), `createdBy?`, timestamps
- [x] `POST /api/auth/register` — bootstrap the first Admin only; returns `403` once any Admin exists
- [x] `POST /api/auth/login` — email + password → short-lived access token (body) + long-lived
      refresh token (`httpOnly` cookie scoped to `/api/auth`)
- [x] `POST /api/auth/refresh` — rotates the refresh cookie, issues a new access token
- [x] `POST /api/auth/logout` — clears the refresh cookie
- [x] `GET /api/auth/me` — current logged-in user's profile
- [x] `PUT /api/auth/change-password` — changes password, bumps `tokenVersion` so every *other*
      active session is invalidated immediately (current session stays logged in)
- [x] `middleware/auth.middleware.ts` — `protect` (valid, current session required) and
      `authorize(...roles)` (role check) guards, reusable on any route
- [x] Login to a deactivated account → `403` with a clear message
- [x] An Admin cannot deactivate their own account or the last remaining active Admin

### 1.3 User management (Admin-only)
- [x] `POST /api/users` — create a Manager/Resident/Admin account
- [x] `GET /api/users` — list accounts, paginated and filterable by role
- [x] `PATCH /api/users/:id/status` — activate/deactivate an account (revokes sessions instantly)
- [x] Manager and Resident roles get `403` from every `/api/users` route

### 1.4 Frontend setup & auth UI
- [x] Vite + React 19 + TypeScript + Tailwind CSS v4 scaffold
- [x] `services/api.ts` — Axios instance with request interceptor (attaches access token) and
      response interceptor (auto-refresh on `401`, deduped so it never fires twice at once)
- [x] `services/tokenStore.ts` — access token kept in memory only, never `localStorage`
- [x] `context/AuthContext.tsx` + `hooks/useAuth.ts` — single source of truth for "who's logged in,"
      silently restores a session on page load via the refresh cookie
- [x] Route guards (`routes/AppRoutes.tsx`): `GuestRoute` (Login/Setup, redirects if already
      logged in), `ProtectedRoute` (requires login), `RoleGuard` (requires a specific role)
- [x] Pages: `Login`, `Setup` (first-Admin bootstrap), `ChangePassword`, `Unauthorized`, `NotFound`
- [x] Admin pages: `ManageUsers` + `CreateUserModal`
- [x] Shared UI components: `Button`, `Input`, `PasswordInput`, `Select`, `Card`, `Modal`, `Badge`,
      `Skeleton`, `FullPageLoader`
- [x] Forms built with React Hook Form + Zod (`lib/schemas.ts`), with clear per-field error messages

### 1.5 Dashboard shell (layout only, no real data yet)
- [x] `DashboardLayout` — sidebar + top bar shell for every logged-in page
- [x] `Dashboard` page with stat cards, `MiniCalendar`, and a Recharts-based `RevenueChart`
- [x] Data-honesty rule applied: since Residents/Rooms/Revenue/Complaints don't exist yet, every
      relevant stat card and the revenue chart show an explicit empty/"Soon" state — never a
      fabricated number (see [`Architecture.md`](./Architecture.md) §5)

### Key decisions made
- Public self-registration only ever creates the *first* Admin — every other account is Admin-created.
- Sessions use access + rotating refresh tokens with a `tokenVersion` counter, instead of a
  server-side session table, to allow instant "log out everywhere."
- No automated backend test suite in this phase — deferred to Phase 9.

---

## Phase 2: Residents

**Goal:** maintain a resident's record independently of their login account (FRD Feature 3).
Spec: not written yet — write `specs/002-residents.md` before starting.

- [ ] `Resident` model: name, contact info, gender, date of birth, address, emergency contact,
      college/course/student ID, profile image, status (`ACTIVE` / `INACTIVE` / `CHECKED_OUT`)
- [ ] Optional link from a `Resident` record to a `User` account (role `resident`), added once a
      login is created for them — a Resident can exist before they have login credentials
- [ ] `POST /api/residents`, `GET /api/residents` (search by name/phone/email/student ID,
      paginated, filterable by status), `GET /api/residents/:id`, `PUT /api/residents/:id`,
      `DELETE /api/residents/:id` — Admin/Manager only
- [ ] Indexes on `email`, `phone`, `studentId`
- [ ] Frontend pages: `/residents` (list + search + filters), `/residents/new`, `/residents/:id`,
      `/residents/:id/edit`
- [ ] Dashboard's "Total Residents" / "Active Residents" cards switch from "Soon" to real numbers

---

## Phase 3: Rooms & Beds

**Goal:** track room inventory and individual beds inside each room (FRD Feature 4).
Spec: not written yet — write `specs/003-rooms-beds.md` before starting.

- [ ] `Room` model: room number, floor, room type (`SINGLE`/`DOUBLE`/`TRIPLE`/`FOUR_SHARING`/`DORMITORY`),
      capacity, monthly rent, status (`AVAILABLE`/`PARTIALLY_OCCUPIED`/`FULL`/`MAINTENANCE`), description
- [ ] `Bed` model: `roomId`, bed number/label, status (`AVAILABLE`/`OCCUPIED`/`MAINTENANCE`), `residentId?`
- [ ] `POST/GET/PUT/DELETE /api/rooms` (search by room number, filter by floor/status) — Admin/Manager
- [ ] `GET/POST /api/rooms/:roomId/beds`, `PUT/DELETE /api/beds/:id` — creating a room lets the
      admin create its beds (e.g. Room 101, capacity 4 → beds A, B, C, D) in the same flow
- [ ] Rule: a room cannot be deleted while any of its beds are occupied
- [ ] Index on `roomNumber`
- [ ] Frontend: `/rooms` (list + filters), `/rooms/new`, `/rooms/:id` (room details + its beds,
      each bed showing occupied/available and who's in it), `/rooms/:id/edit`
- [ ] Dashboard's "Total Rooms" / "Total Beds" / "Available Beds" cards go live

---

## Phase 4: Room Allocation

**Goal:** assign a resident to a specific vacant bed, with strict backend validation (FRD Feature
5, plus the spec-level rules in the original project brief §12). Spec: not written yet — write
`specs/004-allocation.md` before starting.

- [ ] `RoomAllocation` model: `residentId`, `roomId`, `bedId`, check-in date, expected check-out
      date, actual check-out date, monthly rent, security deposit, status
      (`ACTIVE`/`COMPLETED`/`CANCELLED`)
- [ ] `POST /api/allocations` — on success: bed → `OCCUPIED`, resident → `ACTIVE`, allocation → `ACTIVE`
- [ ] Backend validation (never trust the frontend alone):
  - [ ] Reject assigning an already-occupied bed ("Bed is already occupied.")
  - [ ] Reject assigning a bed under maintenance ("Bed is currently under maintenance.")
  - [ ] Reject assigning a resident who already has an active allocation elsewhere
  - [ ] Reject once room capacity is exceeded
- [ ] Frontend: `/allocations` (list), `/allocations/new` (pick resident → room → an available
      bed only → dates → rent/deposit)
- [ ] Dashboard's occupancy figures and "Occupied vs Available Beds" chart go live

---

## Phase 5: Check-in / Check-out

**Goal:** move a resident in/out safely, without leaving the database in an inconsistent state
(FRD Feature 6). Spec: not written yet — write `specs/005-checkinout.md` before starting.

- [ ] `POST /api/allocations/:id/checkout` — in one safe, atomic operation:
  allocation → `COMPLETED`, bed → `AVAILABLE`, resident → `CHECKED_OUT`, `actualCheckOutDate` set to now
- [ ] Decide and document what happens to any unpaid rent at checkout time (feeds into Phase 6's design)
- [ ] Frontend: checkout action from a resident's or allocation's detail view, with a confirmation
      step before this destructive-feeling action runs
- [ ] Verify: bed shows `AVAILABLE` again and resident shows `CHECKED_OUT` immediately after checkout

---

## Phase 6: Rent & Payments

**Goal:** track expected rent and record payments manually — no online payment gateway (FRD
Feature 7). Spec: not written yet — write `specs/006-payments.md` before starting.

- [ ] `Payment` model: `residentId`, `allocationId`, amount, payment date, method
      (`CASH`/`UPI`/`BANK_TRANSFER`/`CARD`/`OTHER`), transaction ID, type (`RENT`/`SECURITY_DEPOSIT`/`OTHER`),
      status (`PAID`/`PENDING`/`FAILED`), notes
- [ ] `GET /api/payments`, `GET /api/payments/:id`, `POST /api/payments` (manual entry only)
- [ ] Index on `residentId`, `paymentDate`
- [ ] "Who owes what, as of today" is answerable from the system without manual calculation
- [ ] Frontend: `/payments` (list), `/payments/new` (record a manual payment)
- [ ] Dashboard's "Monthly Revenue" card and revenue chart go live with real recorded payments

---

## Phase 7: Complaints

**Goal:** let residents raise issues and staff resolve them (FRD Feature 8). Spec: not written
yet — write `specs/007-complaints.md` before starting.

- [ ] `Complaint` model: `residentId`, title, description, category
      (`ELECTRICITY`/`PLUMBING`/`CLEANING`/`INTERNET`/`ROOM`/`FOOD`/`SECURITY`/`OTHER`), priority
      (`LOW`/`MEDIUM`/`HIGH`/`URGENT`), status (`OPEN`/`IN_PROGRESS`/`RESOLVED`/`CLOSED`), assigned
      staff name, resolved-at timestamp
- [ ] `GET/POST/PUT/DELETE /api/complaints` — a Resident only ever sees their own complaints;
      Admin/Manager see and manage all of them
- [ ] Index on `residentId`, `status`, `createdAt`
- [ ] Frontend: `/complaints` (list, filter by status/priority), `/complaints/:id` (detail, update
      status/priority/assignee)
- [ ] Dashboard's "Pending Complaints" card goes live

---

## Phase 8: Full Dashboard (real data)

**Goal:** one aggregated `GET /api/dashboard` endpoint replacing every "Soon" placeholder with a
real number (FRD Feature 9). This phase finishes naturally as Phases 2–7 land, but is tracked
separately because it touches the dashboard as a whole.

- [x] Dashboard shell, layout, stat card components, empty-state pattern (done in Phase 1)
- [ ] `GET /api/dashboard` — one aggregated endpoint (not many small calls) returning:
      total/active residents, total rooms/beds, occupied/available beds, occupancy rate, pending
      complaints, monthly revenue
- [ ] Dashboard also returns recent residents, recent payments, recent complaints
- [ ] Every stat card and chart reads from real computed data — no fabricated numbers at any point
      (hard rule, see [`Architecture.md`](./Architecture.md) §5)

---

## Phase 9: Testing, Polish & Deployment

**Goal:** confidence and stability before treating HMS as production-ready for real hostel use.

- [ ] Backend tests (Vitest/Jest + Supertest): registration, login, protected routes, resident
      CRUD, room/bed CRUD, allocation, duplicate-bed-allocation prevention, checkout, payment
      creation, complaint creation
- [ ] Seed script: 1 Admin, 10 residents, 5 rooms with beds, some active allocations, some
      payments, some complaints — so the dashboard looks realistic in development
- [ ] Full manual verification pass of the complete business flow end-to-end (login → create room
      → create beds → create resident → allocate → payment → complaint → checkout)
- [ ] Root README + all `docs/` files reviewed for accuracy against the shipped code
- [ ] Production build verified for both `backend` and `frontend`

---

## How to use this document

- Check off an item only after it's been used for real (in a browser or via a real API call) —
  not merely typechecked or linted.
- Before starting a phase, write its spec in [`specs/`](./specs/) first (see
  [`docs/README.md`](./README.md) for the process) — this plan tracks *progress*, the spec is the
  source of truth for *exact behavior*.
- Update the **Progress Overview** table's status/completion whenever a phase's checklist changes
  meaningfully — this table should always match reality.
