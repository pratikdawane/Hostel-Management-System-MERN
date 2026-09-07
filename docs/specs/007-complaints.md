# Complaints

**Status:** Implemented
**Spec number:** 007
**Related FRD sections:** Feature 8

## Problem

Residents currently have no way to report a maintenance or service issue (a broken tap, a
non-working socket, an unclean common area, patchy internet) inside the system — it happens by
word of mouth or a phone call to the front desk, and nothing tracks whether it was ever actioned.
Admin/Manager have no queue of open issues, no way to assign a staff member to one, and no record
of when it was resolved. The Dashboard's "Pending Complaints" card (present since the sidebar was
first built) has sat as an honest "Soon" placeholder with no real data behind it.

## Scope

- In scope: a `Complaint` record a Resident can file against their own stay; `POST /api/complaints`
  to file one; `GET /api/complaints` / `GET /api/complaints/:id` to list and inspect them, scoped so
  a Resident only ever sees their own; `PUT /api/complaints/:id` for Admin/Manager to update
  status/priority/assignee as they work the issue; `DELETE /api/complaints/:id` for Admin/Manager;
  `GET /api/complaints/stats` feeding the Dashboard's "Pending Complaints" card with a real count.
- Out of scope (explicitly deferred, and to *where*):
  - Residents editing or withdrawing a complaint after filing it — once filed, only staff can
    change it; revisit if residents need to correct a typo or cancel a filed complaint.
  - Comments/conversation threads on a complaint — the model only tracks a single description plus
    staff-set status/priority/assignee, not back-and-forth messages.
  - Automatic staff assignment or notifications (email/SMS/push) when a complaint is filed or
    resolved — `assignedStaffName` is a plain staff-entered label, not a linked `User`/notification
    trigger.
  - A separate "categories management" screen — the eight categories are fixed constants, matching
    how Room types and Payment methods are fixed enums elsewhere in this codebase.

## Roles & permissions

| Action | Admin | Manager | Resident |
| --- | --- | --- | --- |
| File a complaint | ✅ (on behalf of any resident) | ✅ (on behalf of any resident) | ✅ (only for themselves) |
| List / view complaints | ✅ (all) | ✅ (all) | ✅ (only their own) |
| Update status / priority / assignee | ✅ | ✅ | ❌ |
| Delete a complaint | ✅ | ✅ | ❌ |
| View "Pending Complaints" Dashboard card | ✅ (hostel-wide count) | ✅ (hostel-wide count) | ✅ (their own open count) |

Unlike every prior module (Residents, Rooms, Allocations, Payments — all Admin/Manager-only),
Complaints is the first feature a Resident can use directly. `backend/src/routes/complaint.routes.ts`
applies `protect` to every route (all three roles may authenticate in), then scopes visibility
per-role inside the service layer, and additionally gates `PUT`/`DELETE` with
`authorize('admin', 'manager')`. A Resident is resolved to their own `Complaint` records via the
existing (previously unused) `Resident.user` reference back to their login `User` — the same field
`ResidentDetail.tsx`'s "Link/Unlink account" control already manages.

## Data model

New `Complaint` (`backend/src/models/complaint.model.ts`):

- `residentId` (ref `Resident`, required) — whose issue this is; for a Resident-filed complaint this
  is resolved from their own linked `Resident` record, not taken from client input.
- `title` (String, required, 3–150 chars)
- `description` (String, required, 10–2000 chars)
- `category` (enum `ELECTRICITY | PLUMBING | CLEANING | INTERNET | ROOM | FOOD | SECURITY | OTHER`,
  required)
- `priority` (enum `LOW | MEDIUM | HIGH | URGENT`, default `MEDIUM`)
- `status` (enum `OPEN | IN_PROGRESS | RESOLVED | CLOSED`, default `OPEN`)
- `assignedStaffName` (String, optional) — a plain staff name/label, not a `User` reference (no
  staff-directory model exists yet to point at).
- `resolvedAt` (Date, optional) — set automatically the first time `status` moves to `RESOLVED` or
  `CLOSED`; cleared if a complaint is reopened back to `OPEN`/`IN_PROGRESS`.
- `createdBy` (ref `User`, required) — who filed the record (the resident themselves, or the
  Admin/Manager who logged it on their behalf).

Indexes (per this feature's requirement): `{ residentId: 1 }`, `{ status: 1 }`, `{ createdAt: 1 }`.

No changes to `Resident`, `Room`, `Bed`, `RoomAllocation`, or `Payment`.

## User flows

1. Resident opens Complaints → "Raise complaint" → picks a category, priority, title, description
   → saves → it appears in their own list as `OPEN`, with no resident picker shown (it's always
   filed against themselves).
2. Manager opens Complaints → sees every resident's complaints, filterable by status/priority →
   opens one → sets an assignee and moves it to `IN_PROGRESS`, then later to `RESOLVED` → the
   resident sees the updated status and a resolved timestamp next time they check.
3. Admin opens the Dashboard → the "Pending Complaints" card shows a real count of `OPEN` +
   `IN_PROGRESS` complaints hostel-wide, replacing the "Soon" placeholder.
4. A Resident without a linked login-to-Resident connection (per `ResidentDetail.tsx`'s
   Link/Unlink control) tries to file or view a complaint → blocked with a clear "no resident
   profile linked" message rather than a confusing empty list.
5. A Resident opens `/complaints/:id` for a complaint that belongs to someone else (guessing an id)
   → gets the same `404` as a nonexistent complaint, not a `403` that would confirm it exists.

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/complaints` | Admin, Manager, Resident | File a complaint — Resident always files for themselves; Admin/Manager must supply `residentId` |
| GET | `/api/complaints` | Admin, Manager, Resident | List complaints, filterable by status/priority/category (+ residentId for staff), paginated; a Resident is always scoped to their own |
| GET | `/api/complaints/stats` | Admin, Manager, Resident | Pending (`OPEN`+`IN_PROGRESS`) and total counts — hostel-wide for staff, own-only for a Resident |
| GET | `/api/complaints/:id` | Admin, Manager, Resident (own only) | Fetch one complaint |
| PUT | `/api/complaints/:id` | Admin, Manager | Update `status` / `priority` / `assignedStaffName` |
| DELETE | `/api/complaints/:id` | Admin, Manager | Remove a complaint record |

## Edge cases & rules

- **A Resident can never set `residentId`.** Even if sent in the body, a Resident's own complaint is
  always filed against the `Resident` record linked to their `User` account — the same trust
  boundary already used by `protect`/`authorize` (never trust a client-supplied identity claim).
- **Admin/Manager must name a resident.** `POST /api/complaints` rejects with `400` if `residentId`
  is missing when the caller is staff — there's no "self" to fall back to.
- **No linked Resident profile → `403`, not an empty list.** A Resident login with no matching
  `Resident.user` reference gets a clear "no resident profile linked" error on file/list/view,
  rather than silently returning nothing (matches the existing Link/Unlink feature's assumption
  that a login can exist before or without a linked profile).
- **Cross-resident access looks like "not found."** A Resident requesting another resident's
  complaint by id gets `404`, not `403` — avoids confirming the id belongs to a real complaint.
- **`resolvedAt` is server-computed, never client-set.** It's set the moment `status` first becomes
  `RESOLVED`/`CLOSED`, and cleared if reopened — `PUT` never accepts `resolvedAt` directly.
- **Pending never fabricated.** The Dashboard's "Pending Complaints" tile shows `0` before any
  complaints exist, matching the "never show a number the system can't back up" rule already
  established for Revenue/Occupancy.

## Acceptance criteria

- [x] A Resident filing `POST /api/complaints` always gets their own `residentId`, regardless of
      what (if anything) they send in the body.
- [x] `GET /api/complaints` and `GET /api/complaints/:id` scope a Resident to only their own
      complaints; Admin/Manager see all.
- [x] `PUT`/`DELETE /api/complaints/:id` return `403` for a Resident.
- [x] Moving `status` to `RESOLVED`/`CLOSED` sets `resolvedAt`; moving it back to
      `OPEN`/`IN_PROGRESS` clears it.
- [x] `GET /api/complaints/stats` returns a real pending count, hostel-wide for staff and own-only
      for a Resident.
- [x] `/complaints`, `/complaints/new`, and `/complaints/:id` are reachable from the sidebar
      (replacing the "Coming soon" placeholder) for Admin, Manager, and Resident.
- [x] The Dashboard's "Pending Complaints" stat tile reads from `/api/complaints/stats` instead of
      a hardcoded placeholder.

## Open questions

None — access scoping follows the same trust-boundary pattern already used by `protect`/`authorize`
and the existing `Resident.user` link; resolved/reopened timestamp handling mirrors how
`005-checkinout.md` and `006-payments.md` made their own status-transition decisions.
