# Rent & Payments

**Status:** Implemented
**Spec number:** 006
**Related FRD sections:** Feature 7

## Problem

Feature 5 (Room Allocation) records what a resident *should* pay — `monthlyRent` and
`securityDeposit` on their `RoomAllocation` — but nothing records what they *have* paid. Rent is
collected by hand (cash, UPI, bank transfer) with no online payment gateway, and today that
collection leaves no trace in the system at all. Admin/Manager cannot answer "who owes what, right
now" without manually cross-checking move-in dates against a paper or spreadsheet ledger, and the
Dashboard's Revenue card and chart (built ahead of this feature, per `005-checkinout.md`) have sat
as an honest empty placeholder rather than fabricate a number.

## Scope

- In scope: a `Payment` record for each rent/deposit/other payment collected, entered by hand;
  `POST /api/payments` to record one; `GET /api/payments` / `GET /api/payments/:id` to list and
  inspect them; a computed "who owes what today" view (`GET /api/payments/dues`) derived from
  `RoomAllocation` + recorded payments, with no manual arithmetic; a `GET /api/payments/stats`
  endpoint feeding the Dashboard's Revenue stat tile and chart with real monthly totals, replacing
  the placeholder from Feature 5/6.
- Out of scope (explicitly deferred, and to *where*):
  - Any online payment gateway or automated collection — Feature 7 rule 2 is explicit that
    payments are entered by hand after being collected elsewhere.
  - Invoicing, receipts, or notifying residents of dues — a future notifications/communication
    feature, not this one.
  - Editing or deleting a recorded payment — a manual data-entry mistake today is corrected by
    recording an offsetting entry (e.g. a `FAILED`-status correction), not by mutating history;
    revisit if a real correction workflow is needed.
  - Recomputing dues for a `COMPLETED` or `CANCELLED` allocation — per `005-checkinout.md`,
    checkout takes no financial action, so a closed allocation's historical balance is not this
    feature's concern going forward.

## Roles & permissions

| Action | Admin | Manager | Resident |
| --- | --- | --- | --- |
| Record a payment | ✅ | ✅ | ❌ |
| View payments / dues | ✅ | ✅ | ❌ |
| View Dashboard revenue stat tile & chart | ✅ | ❌ (unchanged from Feature 5/6's existing admin-only gate) | ❌ |

`router.use(protect, authorize('admin', 'manager'))` in `backend/src/routes/payment.routes.ts`
gates every payments route, matching Allocations — managers are the ones physically collecting
rent at the front desk.

## Data model

New `Payment` (`backend/src/models/payment.model.ts`):

- `residentId` (ref `Resident`, required)
- `allocationId` (ref `RoomAllocation`, required) — must belong to `residentId`, checked at
  creation time (mirrors how `createAllocation` checks a bed belongs to its room).
- `amount` (Number, required, > 0)
- `paymentDate` (Date, required) — when the payment was actually collected, not necessarily today.
- `method` (enum `CASH | UPI | BANK_TRANSFER | CARD | OTHER`, required)
- `transactionId` (String, optional) — a UPI/bank reference, if any.
- `type` (enum `RENT | SECURITY_DEPOSIT | OTHER`, required)
- `status` (enum `PAID | PENDING | FAILED`, default `PAID`) — `PAID` covers the normal "cash
  collected" case; `PENDING`/`FAILED` exist for recording a payment that was promised or attempted
  but didn't clear, without pretending it did.
- `notes` (String, optional)
- `createdBy` (ref `User`, required) — who recorded the entry.

Indexes: `{ residentId: 1 }` and `{ paymentDate: 1 }` (per this feature's requirements), plus
`{ allocationId: 1 }` (an FK index, same convention as `roomId` on `RoomAllocation`, needed by the
dues aggregation below).

No changes to `RoomAllocation`, `Resident`, `Room`, or `Bed` — this feature only reads their
existing fields (`monthlyRent`, `securityDeposit`, `checkInDate`, `status`).

## User flows

1. Manager collects rent from a resident in person → opens Payments → "Record payment" → searches
   for the resident → the system shows their current room/bed/monthly rent (looked up from their
   one active allocation) → fills amount, date, method, type → saves → the payment appears in the
   list immediately and the resident's outstanding balance drops by that amount.
2. Manager opens Payments → sees an "Outstanding dues" table of every resident with an active
   allocation, how many rent cycles have elapsed, and how much they owe — computed by the system,
   with a "Record payment" shortcut per row.
3. Admin opens the Dashboard → the Revenue stat tile shows this month's real total collected, and
   the revenue chart shows the last 6 months — both computed from `Payment` records, never
   fabricated.
4. A resident tries to reach `/payments` → blocked by the same role guard as Allocations/Residents.

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/payments` | Admin, Manager | Record a manual payment against a resident's allocation |
| GET | `/api/payments` | Admin, Manager | List payments, filterable by residentId/allocationId/status/type/method, paginated |
| GET | `/api/payments/:id` | Admin, Manager | Fetch one payment |
| GET | `/api/payments/dues` | Admin, Manager | Who owes what, as of today, per active allocation — no client-side math |
| GET | `/api/payments/stats` | Admin, Manager | This month's revenue, last-6-months trend, and total outstanding, for the Dashboard |

`dues` and `stats` are additions beyond the literal CRUD list in the original ask, added because
the FRD explicitly requires "who owes what, as of today" to be answerable without manual
calculation, and because the Dashboard's Revenue card/chart need a real data source.

## Edge cases & rules

- **Rent-due rule.** A resident's rent cycle renews every month on the calendar day of their
  `checkInDate` (checked in on the 15th → a new month's rent becomes due starting the 15th of each
  month). `monthsDue` = how many such cycles have started as of today. `expectedRent = monthsDue ×
  monthlyRent`. `amountDue = expectedRent − sum(amount of PAID, type=RENT payments for that
  allocation)`. A negative `amountDue` means the resident has paid ahead (a credit), not an error.
- **Only `ACTIVE` allocations accrue rent.** A `COMPLETED` or `CANCELLED` allocation never appears
  in `/dues` — per `005-checkinout.md`, checkout intentionally takes no financial action, so this
  feature does not retroactively invent a due amount for a closed stay.
- **Security deposit is tracked, not accrued.** `SECURITY_DEPOSIT` payments are summed per
  allocation and shown alongside the expected `securityDeposit`, but are not part of the recurring
  rent-due formula — a deposit is a one-time expectation, not a monthly one.
- **A payment must belong to the resident's own allocation.** `POST /api/payments` rejects with
  `400` if the given `allocationId` doesn't belong to the given `residentId` — the same validation
  style as `createAllocation`'s bed/room ownership check.
- **`PENDING`/`FAILED` payments never count toward dues or revenue.** Only `status: 'PAID'`
  payments are summed anywhere in `/dues` or `/stats` — an unpaid or failed entry is a record of an
  attempt, not money actually collected.
- **Revenue never fabricated.** The Dashboard's Revenue tile/chart show `0`/an empty state when no
  `PAID` payments exist yet, matching the "never show a number the system can't back up" rule
  already established for occupancy figures.

## Acceptance criteria

- [x] Recording a payment via `POST /api/payments` requires the allocation to belong to the given
      resident, rejecting with `400` otherwise.
- [x] `GET /api/payments/dues` returns every `ACTIVE` allocation's computed amount due with no
      client-side calculation required.
- [x] `GET /api/payments/stats` returns a real monthly revenue figure and 6-month trend once `PAID`
      payments exist, and `0`/empty before any do.
- [x] The Dashboard's Revenue stat tile and chart read from `/api/payments/stats` instead of a
      hardcoded placeholder.
- [x] Resident role gets `403` from every `/api/payments` route, matching Allocations.
- [x] `/payments` and `/payments/new` are reachable from the sidebar (replacing the "Coming soon"
      placeholder) for Admin/Manager only.

## Open questions

None — the rent-due rule above is this feature's own decision, matching how `005-checkinout.md`
made its own "unpaid rent at checkout" decision rather than leaving it to a later feature.
