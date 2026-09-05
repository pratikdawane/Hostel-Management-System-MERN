# Room Allocation

**Status:** Draft
**Spec number:** 004
**Related FRD sections:** FR-5

## Problem

Rooms and beds exist (Feature 4), and residents exist (Feature 3), but nothing connects the two.
Today there is no record of who is staying in which bed — Admin/Manager cannot answer "who is in
room 204?" or "which bed is resident X in?", and a bed's `OCCUPIED` status/`residentId` field
(added in Feature 4 but never written to) sits unused. Feature 5 gives Admin and Manager a
deliberate action — assign one resident to one specific vacant bed — with validation that never
trusts the frontend, so the system can never end up with two residents claiming the same bed or
one resident claiming two beds.

## Scope

- In scope: creating a `RoomAllocation` that assigns exactly one resident to exactly one vacant,
  non-maintenance bed (`POST /api/allocations`); listing allocations with filters; cancelling a
  mistaken/ended allocation, which is the only way an occupied bed becomes available again until
  Feature 6 exists (see Edge cases); the dashboard's live "Total beds" occupancy figures and an
  "Occupied vs Available beds" chart.
- Out of scope (explicitly deferred):
  - A real check-in / check-out workflow with its own audit trail (who did it, when, handling of
    unpaid rent at move-out) — that is Feature 6. Cancelling an allocation here is a data-entry
    correction, not a check-out event: it does not set `actualCheckOutDate` (that field is
    reserved for Feature 6) and does not touch the resident's own `status`.
  - Moving a resident directly from one bed to another in a single action. Per FRD Feature 5 rule
    3, that must be a deliberate, visible action, never a silent overwrite — for now, moving a
    resident means cancelling their current allocation and creating a new one as two explicit
    steps.
  - Rent/payment tracking against an allocation (Feature 7) — `monthlyRent` and
    `securityDeposit` are captured here only as the terms agreed at allocation time.

## Roles & permissions

| Action | Admin | Manager | Resident |
| --- | --- | --- | --- |
| Create/list/cancel a room allocation | ✅ | ✅ | ❌ |
| See live bed-occupancy dashboard figures/chart | ✅ | ✅ | ❌ (tile shows "Staff only", same treatment as Residents/Rooms tiles) |

## Data model

`RoomAllocation` (`backend/src/models/allocation.model.ts`):

- `residentId` (ref `Resident`, required)
- `roomId` (ref `Room`, required)
- `bedId` (ref `Bed`, required — must belong to `roomId`)
- `checkInDate` (Date, required)
- `expectedCheckOutDate?` (Date, optional — must be after `checkInDate` when given)
- `actualCheckOutDate?` (Date, optional — unused until Feature 6)
- `monthlyRent` (number, required, ≥ 0 — the agreed rent for this stay; independent of the room's
  current `monthlyRent`, which may change later)
- `securityDeposit` (number, required, ≥ 0)
- `status` (`ACTIVE` \| `COMPLETED` \| `CANCELLED`, default `ACTIVE`)
- `createdBy` (ref `User`, the Admin/Manager who created the record)
- timestamps

Relationship: one `Resident` and one `Bed` can each have at most one `ACTIVE` `RoomAllocation` at
a time (enforced by a partial unique index on each, in addition to the service-level checks below
— a DB-level backstop against a race between two concurrent requests). A resident/bed can have
many historical `COMPLETED`/`CANCELLED` allocations.

Indexes: `{ bedId: 1 }` unique where `status: 'ACTIVE'`; `{ residentId: 1 }` unique where
`status: 'ACTIVE'`; `{ roomId: 1 }` and `{ status: 1 }` for list filters.

## User flows

1. Manager opens Allocations → "New allocation" → searches and picks a resident → searches and
   picks a room → picks one of that room's vacant beds → enters check-in date (and optionally an
   expected check-out date), monthly rent, and security deposit → submits → the bed becomes
   `OCCUPIED`, the resident's status becomes `ACTIVE`, and the allocation appears in the list as
   `ACTIVE`.
2. Manager tries to pick a bed that another request just occupied a second ago → submission is
   rejected with "Bed is already occupied." — the bed list was stale, not authoritative.
3. Manager tries to assign a resident who already has an active allocation elsewhere → rejected
   with a clear message instead of silently moving them.
4. A room's beds are all occupied (room capacity reached) → the room still appears when searching
   rooms, but assigning one more resident to it is rejected rather than silently exceeding
   capacity.
5. An allocation was created by mistake (wrong resident/bed) → Admin/Manager → Allocations →
   Cancel → the allocation becomes `CANCELLED`, the bed returns to `AVAILABLE`, and the room's
   computed status is refreshed.
6. Dashboard → Admin/Manager sees "Occupied vs Available beds" reflecting real, current bed
   statuses — never a fabricated number.

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/allocations` | Admin, Manager | Create an allocation: assigns a resident to a vacant bed |
| GET | `/api/allocations` | Admin, Manager | List allocations — `status`, `roomId`, `page`, `limit`; each row includes populated resident name, room number/floor, and bed label |
| PATCH | `/api/allocations/:id/cancel` | Admin, Manager | Cancel an `ACTIVE` allocation; frees its bed |

## Edge cases & rules

- **Bed already occupied.** `bed.status === 'OCCUPIED'` → `409 "Bed is already occupied."`
- **Bed under maintenance.** `bed.status === 'MAINTENANCE'` → `409 "Bed is currently under
  maintenance."`
- **Resident already allocated elsewhere.** Any existing `RoomAllocation` with
  `status: 'ACTIVE'` for that resident (regardless of bed/room) → `409` with a clear message.
  Backstopped by the partial unique index on `residentId`.
- **Room capacity exceeded.** Capacity (per Feature 4) is a planning number that can diverge from
  the room's actual bed count. Before creating an allocation, the count of that room's currently
  `ACTIVE` allocations is compared against `room.capacity`; at or above it, the request is
  rejected with `409`, even if a technically-vacant bed exists in that room.
- **Bed must belong to the selected room.** If the given `bedId` does not belong to `roomId`, the
  request is rejected with `400` rather than silently using the bed's real room.
- **Atomicity.** Creating the allocation, flipping the bed to `OCCUPIED` (with `residentId` set),
  and setting the resident's `status` to `ACTIVE` happen inside one MongoDB transaction (same
  pattern as Feature 4's room+beds creation) — a failure partway through leaves nothing
  half-applied. The room's computed status is refreshed after the transaction commits.
- **Cancelling only ever applies to an `ACTIVE` allocation** — attempting to cancel a
  `COMPLETED`/`CANCELLED` one returns `409`. Cancelling frees the bed (`AVAILABLE`, `residentId`
  cleared) and refreshes the room's computed status; it does not change the resident's own
  `status` (out of scope — see Scope).
- Empty state: zero allocations (fresh install) is handled — the list says "No allocations yet"
  with "New allocation" still available.
- `/api/rooms/stats`'s existing `totalBeds`/`availableBeds` counts (Feature 4) already reflect
  live bed occupancy once allocations start flipping bed status, so the dashboard's "Occupied vs
  Available beds" chart is derived from them (`occupied = totalBeds - availableBeds`) rather than
  a new endpoint — same honesty rule as every other dashboard figure: never fabricated.

## Acceptance criteria

- [ ] Assigning a resident to a vacant, non-maintenance bed succeeds and sets bed → `OCCUPIED`,
      resident → `ACTIVE`, allocation → `ACTIVE`, all atomically.
- [ ] Assigning to an `OCCUPIED` bed is rejected with `409 "Bed is already occupied."`
- [ ] Assigning to a `MAINTENANCE` bed is rejected with `409 "Bed is currently under
      maintenance."`
- [ ] Assigning a resident who already has an active allocation elsewhere is rejected with `409`.
- [ ] Assigning into a room whose active-allocation count already equals its capacity is rejected
      with `409`, even if the chosen bed shows as vacant.
- [ ] Cancelling an `ACTIVE` allocation frees its bed and is reflected immediately in room
      occupancy and dashboard figures; cancelling a non-`ACTIVE` allocation is rejected with `409`.
- [ ] Resident role gets `403` from every `/api/allocations` route.
- [ ] `/allocations` and `/allocations/new` work end-to-end in the browser, including empty
      state, the resident/room search pickers, the available-beds-only bed picker, and mobile
      layout.
- [ ] Dashboard "Occupied vs Available beds" chart and occupancy figures reflect real data for
      Admin/Manager and never show a fabricated number.

## Open questions

None — scope and rules above were resolved directly from FRD Feature 5 and the existing Feature 4
groundwork (the `Bed.residentId`/`OCCUPIED` fields and the bed-update guard already anticipated
this feature owning them).
