# Check-in / Check-out

**Status:** Implemented
**Spec number:** 005
**Related FRD sections:** FR-6

## Problem

Feature 5 (Room Allocation) already assigns a resident to a bed and — as part of creating that
allocation — records a `checkInDate`, flips the bed to `OCCUPIED`, and sets the resident to
`ACTIVE`. That already satisfies FRD Feature 6 rule 1 ("checking a resident in requires that they
already have a room allocation, and records when it happened and who did it"): the allocation
itself *is* the check-in record. What's missing is the other half — a deliberate, safe way to end
a stay. Today the only way to free a bed is `PATCH /allocations/:id/cancel`, which the Feature 4
spec explicitly reserved for data-entry corrections (wrong resident/bed), not a real move-out: it
never touches the resident's own `status` and never sets `actualCheckOutDate`. Without a real
check-out action, a resident who has actually left still shows as `ACTIVE`, their bed still shows
`OCCUPIED`, and there is no record of when they left — Admin/Manager cannot trust "who is
currently in the hostel" or "which beds are really free."

## Scope

- In scope: `POST /api/allocations/:id/checkout` — atomically completes an `ACTIVE` allocation,
  frees its bed, and marks the resident `CHECKED_OUT`; recording who performed the checkout
  (`checkedOutBy`) alongside the existing `actualCheckOutDate` field (reserved for this feature
  since Feature 5); a checkout action, with a confirmation step, from the allocation list and from
  a resident's detail page; a small, backward-compatible `residentId` filter on
  `GET /api/allocations` so a resident's detail page can look up their current active allocation
  to check out.
- Out of scope (explicitly deferred, and to *where*):
  - Any rent/payment ledger, invoice, or "amount due" calculation — Feature 7 (Rent & Payments).
    See **Unpaid rent at checkout** below for the decision this feature makes in the meantime.
  - A dedicated allocation-detail page — checkout is exposed from the allocation list (row action)
    and the resident detail page (which already exists), matching how cancel is already exposed.
  - Re-opening/undoing a checkout. A `COMPLETED` allocation is a closed historical record; a
    returning resident gets a brand-new allocation via Feature 5's flow, on a bed chosen fresh
    (never assumed to be their old one, which may no longer be vacant).

## Roles & permissions

| Action | Admin | Manager | Resident |
| --- | --- | --- | --- |
| Check a resident out | ✅ | ✅ | ❌ |
| View who/when a resident was checked out | ✅ | ✅ | ❌ |

Same gate as every other allocation route: `router.use(protect, authorize('admin', 'manager'))`
in `backend/src/routes/allocation.routes.ts` already covers the new route.

## Data model

`RoomAllocation` (`backend/src/models/allocation.model.ts`) gains one field:

- `checkedOutBy?` (ref `User`, optional) — who performed the checkout; set only when `status`
  transitions to `COMPLETED` via this feature. Mirrors the existing `createdBy` field, which
  already answers "who did it" for check-in.

No other schema changes. `actualCheckOutDate` already existed (added in Feature 5, unused until
now) and is set to `new Date()` at checkout time. `status` already had the `COMPLETED` value
(added in Feature 5's enum, unused until now).

`Resident.status` gains real use of its existing `CHECKED_OUT` value (defined in Feature 3,
unused until now): checkout sets it; nothing before this feature ever did.

`Bed` and `Room` are unchanged — checkout reuses exactly the same "free a bed" mechanics
(`status: 'AVAILABLE'`, `$unset residentId`, `refreshRoomStatus`) that cancel already uses.

## User flows

1. Manager opens Allocations (or a resident's detail page, if that resident currently has an
   active allocation) → clicks "Check out" → confirms in a dialog that names the resident and
   states the bed will become available and the resident will show as Checked out → confirms →
   the allocation becomes `COMPLETED` with `actualCheckOutDate` set to now, the bed becomes
   `AVAILABLE`, and the resident becomes `CHECKED_OUT` — all three, or none, immediately.
2. Manager opens a resident's detail page for someone with an active allocation → sees a "Current
   allocation" card (room, bed, check-in date, monthly rent) with its own "Check out" button,
   reusing the same confirm-then-checkout flow as (1).
3. Manager tries to check out an allocation that is already `COMPLETED` or `CANCELLED` (e.g. a
   second click, or two tabs open) → rejected with `409`; nothing changes.
4. Immediately after checkout, the freed bed shows `AVAILABLE` in Rooms/Beds and the resident
   shows `CHECKED_OUT` on their detail page/list — both read from the same collections the
   checkout transaction just wrote, so there is no separate cache to go stale.

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/allocations/:id/checkout` | Admin, Manager | Check a resident out of an `ACTIVE` allocation: allocation → `COMPLETED`, bed → `AVAILABLE`, resident → `CHECKED_OUT`, `actualCheckOutDate`/`checkedOutBy` recorded |
| GET | `/api/allocations?residentId=` | Admin, Manager | (Extended) filter allocations by resident, so a resident's active allocation can be looked up for the checkout UI |

## Edge cases & rules

- **Only an `ACTIVE` allocation can be checked out.** Attempting to check out a `COMPLETED` or
  `CANCELLED` allocation is rejected with `409 "Only an active allocation can be checked out"`.
- **Atomicity.** Exactly like Feature 5's `createAllocation`, the allocation status flip, the bed
  free-up, and the resident status change happen inside one MongoDB transaction
  (`mongoose.startSession()` + `session.withTransaction()`), with the allocation and bed updates
  both using a guarded `updateOne` (matched against their expected current status) rather than a
  blind `.save()` — so a concurrent second checkout/cancel request on the same allocation or a
  stale read never silently double-applies. If the bed somehow isn't `OCCUPIED` when the
  transaction reaches it, the whole transaction rolls back with `409` rather than leaving the
  allocation `COMPLETED` with a bed that was never actually freed. The room's computed status is
  refreshed only after the transaction commits.
- **Unpaid rent at checkout.** No rent/payment ledger exists yet (Feature 7 is not built). Rather
  than leave checkout blocked on a feature that doesn't exist, or invent a fabricated "amount due"
  figure, the decision for this feature is: **checkout never blocks on, computes, or waives unpaid
  rent — it takes no financial action at all.** The `COMPLETED` allocation record itself (with its
  `checkInDate`, `actualCheckOutDate`, `monthlyRent`, and `securityDeposit` all preserved,
  untouched, forever) is the historical source of truth Feature 7 will read from later to work out
  what was owed for the stay and how much of the deposit to return. This keeps the same "never
  show a number the system can't back up" rule already used for the dashboard's occupancy figures
  (Feature 5 spec) and avoids Feature 5 or 6 quietly pre-deciding a rule that belongs to Feature 7.
- **Historical allocations are never deleted or mutated further.** Once `COMPLETED`, an allocation
  is a closed record — the only fields checkout ever writes are `status`, `actualCheckOutDate`,
  and `checkedOutBy`, once, at the moment of checkout.
- Empty state: a resident with no active allocation (never allocated, already checked out, or
  cancelled) simply shows no "Current allocation" card / no checkout row-action — never an error.

## Acceptance criteria

- [x] Checking out an `ACTIVE` allocation succeeds and, atomically: allocation → `COMPLETED` with
      `actualCheckOutDate` set to now and `checkedOutBy` recorded; bed → `AVAILABLE`; resident →
      `CHECKED_OUT`.
- [x] Checking out a `COMPLETED` or `CANCELLED` allocation is rejected with `409`.
- [x] A bed that is unexpectedly not `OCCUPIED` when checkout runs rolls back the whole
      transaction with `409` — no partial state.
- [x] Resident role gets `403` from the checkout route (same guard as the rest of `/allocations`).
- [x] The freed bed shows `AVAILABLE` and the resident shows `CHECKED_OUT` immediately after
      checkout, with no separate refresh step.
- [x] Checkout is reachable, with a confirmation step naming the resident and stating the
      consequence, from both the allocation list and a resident's detail page.
- [x] No unpaid-rent figure is fabricated or computed anywhere in the checkout flow.

## Open questions

None — FRD Feature 6 rule 3 explicitly leaves the unpaid-rent decision to be made when this
feature is built (see **Unpaid rent at checkout** above for that decision) rather than when
Feature 7 is designed; this is a deliberate reading of "not assumed here" as "don't assume a rule
Feature 7 should own," not "leave checkout blocked until Feature 7 exists."
