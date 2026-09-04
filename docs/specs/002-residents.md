# Residents

**Status:** Draft
**Spec number:** 002
**Related FRD sections:** FR-3

## Problem

The hostel needs to track a resident's personal and admission record — name, contact details,
emergency contact, college/course, status — independently of whether that resident has a login
account yet. Today the only identity record in the system is `User`, which requires an email and
password. Front-desk staff often start a resident's file during admission before any login is
ever created (or the resident never gets one, e.g. a short-stay guest). Feature 3 gives Admin and
Manager a place to create and maintain that record on its own, and to connect it to a `User`
account later once credentials exist.

## Scope

- In scope: `Resident` CRUD (create/list/search/filter/view/update/delete) for Admin and Manager,
  an optional one-to-one link from a `Resident` to a `User` (role `resident`), dashboard "Total
  Residents" / "Active Residents" counts.
- Out of scope (explicitly deferred):
  - Room/bed allocation and check-in/check-out (Feature 4/5/6) — `status` exists on the model now
    so those features have something to drive, but nothing in this phase changes it automatically.
  - Actual file upload/storage for profile pictures (no media/CDN service exists yet) —
    `profileImage` stores a URL string the caller supplies; there is no upload endpoint.
  - A dedicated "link to account" screen/endpoint — linking is done through the existing
    `PUT /api/residents/:id` route (see Data model), not a new one, to keep the API surface to
    what Feature 3 asks for.
  - Self-service: a `resident`-role user viewing their own record (belongs with a future
    "resident portal" pass, not this admin-facing CRUD module).

## Roles & permissions

| Action | Admin | Manager | Resident |
| --- | --- | --- | --- |
| Create/list/search/view/update/delete a resident record | ✅ | ✅ | ❌ |
| See "Total Residents" / "Active Residents" dashboard counts | ✅ | ✅ | ❌ (tile shows "Soon", same as an unbuilt module — no route access, so no real number) |

## Data model

`Resident` (`backend/src/models/resident.model.ts`):

- `name` (string, required — the only field guaranteed to exist at intake time)
- `email?`, `phone?` (strings, indexed, lowercased/trimmed — the resident's own contact info, kept
  separate from `emergencyContact`)
- `gender?` (`male` \| `female` \| `other`)
- `dateOfBirth?` (Date, must be in the past)
- `address?` (free-text string — a hostel intake form doesn't need structured
  street/city/postal fields, and it keeps the form simple)
- `emergencyContact?` (subdocument: `name`, `phone` both required together, `relation?`)
- `college?`, `course?`, `studentId?` (strings)
- `profileImage?` (string URL — see Scope; no server-side upload in this phase)
- `status` (`ACTIVE` \| `INACTIVE` \| `CHECKED_OUT`, default `ACTIVE`)
- `user?` (ref `User`, optional, unique when set — the login-account link. Set/cleared via
  `PUT /api/residents/:id` with a `userId` field; the service validates the target `User` exists,
  has `role: resident`, and isn't already linked to a different resident)
- `createdBy` (ref `User`, the Admin/Manager who created the record)
- timestamps

Relationship to `User`: independent, optional 1:1. A `Resident` can exist with `user: undefined`
indefinitely (pending admission / never got a login). A `User` with `role: resident` can likewise
exist without any `Resident` pointing at it (not expected in normal flow, but not blocked either —
account creation stays exactly as Feature 2 built it).

Indexes: `email` and `studentId` are sparse + unique (an email or college ID belongs to one
resident record at most, but both fields are optional so `sparse` keeps documents without them
from colliding on `null`). `phone` is a plain (non-unique) index — shared family phones are
common enough during intake that hard-blocking on it would get in the way, but it still needs to
be indexed for the search endpoint. `user` is a sparse + unique index for the same reason as
`email`/`studentId`: at most one `Resident` per `User`.

## User flows

1. Manager opens Residents → "Add resident" → fills in at least a name → resident appears in the
   list immediately with status Active and no linked account.
2. Admin/Manager → Residents → searches "Rahul" → list filters to residents whose name, phone,
   email, or student ID matches, across all statuses unless a status filter is also applied.
3. Front desk creates a login for a resident later (Feature 2's "Add user" screen, role Resident)
   → returns to that resident's record → Edit → pastes the new account's ID (or a future picker)
   into the link field → record now shows "Linked account" instead of "No login yet."
4. Resident checks out → Admin/Manager opens their record → Edit → status → Checked out → list
   and dashboard counts reflect it immediately.
5. A resident record created by mistake → Admin/Manager → Residents → open record → Delete →
   confirms → record is gone from the list and counts.

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/residents` | Admin, Manager | Create a resident record |
| GET | `/api/residents` | Admin, Manager | List residents — `q` (search name/phone/email/studentId), `status`, `page`, `limit` |
| GET | `/api/residents/stats` | Admin, Manager | `{ total, active }` counts for the dashboard cards |
| GET | `/api/residents/:id` | Admin, Manager | Fetch one resident |
| PUT | `/api/residents/:id` | Admin, Manager | Update a resident (including status and the `userId` link) |
| DELETE | `/api/residents/:id` | Admin, Manager | Remove a resident record |

## Edge cases & rules

- `email`, `studentId` duplicates → `409` with a specific message, checked in the service before
  insert/update, backstopped by the schema's unique index (same pattern as `User.email`).
- Linking (`userId` on update): target `User` must exist and have `role: resident` → `400`
  otherwise; target `User` already linked to a different resident → `409`; `userId: null` clears
  an existing link.
- Search (`q`) matches are case-insensitive partial matches on `name`, and case-insensitive partial
  matches on `phone`/`email`/`studentId`; empty/whitespace-only `q` is treated as "no search."
- Deleting a resident does not touch a linked `User` account (or vice versa) — the two records
  stay independently governed by their own modules, per Scope.
- Empty state: zero residents (fresh install) and zero search results are both handled — the list
  says "No residents found" either way, with "Add resident" still available in the first case.
- `/api/residents/stats` never returns fabricated numbers — it always reflects
  `Resident.countDocuments`, same honesty rule as the rest of the dashboard.

## Acceptance criteria

- [ ] Admin and Manager can create a resident with only a name, and separately with the full
      field set.
- [ ] `GET /api/residents` search matches on name, phone, email, and student ID; status filter and
      pagination both work and can be combined.
- [ ] Duplicate email or student ID on create/update returns `409`, not a raw Mongo error.
- [ ] Linking a resident to a `User` via `PUT` enforces role `resident` and one-resident-per-user.
- [ ] Resident role gets `403` from every `/api/residents` route.
- [ ] `/residents`, `/residents/new`, `/residents/:id`, `/residents/:id/edit` all work end-to-end
      in the browser, including empty state, search, filter, pagination, and mobile layout.
- [ ] Dashboard "Total Residents" / "Active Residents" tiles show real counts for Admin/Manager
      and never show a fabricated number.

## Open questions

None — the checklist this spec was written from was explicit enough to resolve every design
choice above without needing sign-off; decisions and their reasoning are recorded inline so they
can be revisited if wrong.
