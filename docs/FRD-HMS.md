# Functional Requirements — Hostel Management System

**Status:** Living document (gets updated as the project evolves)
**Last updated:** 2026-08-30

This document lists exactly what the system must do, one feature area at a time, in plain
language. Once a feature area is scheduled to be built, it gets its own detailed write-up in
[`specs/`](./specs/) with the exact routes, fields, and screen behavior.

## Feature 1 — Login & Sessions
*Details: [`specs/001-auth.md`](./specs/001-auth.md) · Status: Built*

1. There are exactly three kinds of accounts: Admin, Manager, Resident.
2. The very first Admin account is created through a one-time setup step. That same setup step
   will refuse to create a second Admin once one already exists.
3. No one can sign themselves up after that first Admin exists — every new account must be
   created by an Admin.
4. Logging in gives you a short-lived pass plus a longer-lived, safely-stored renewal pass — never
   a single long-lived pass saved in a place a malicious script could read.
5. Changing your password immediately logs out every other device you were signed into.
6. Turning an account off logs it out immediately — not "the next time its pass expires."
7. An Admin can never turn off their own account, and can never turn off the very last active
   Admin account (so the hostel can never end up with zero working Admins).

## Feature 2 — Managing accounts
*Details: [`specs/001-auth.md`](./specs/001-auth.md) · Status: Built*

1. An Admin can create new accounts, see a list of all accounts (with search/paging), and turn
   any account on or off.
2. Manager and Resident accounts cannot see or use any of the account-management screens or
   routes — those are Admin-only.

## Feature 3 — Residents
*Details: not written yet · Status: Not started*

1. The system keeps a resident's record separately from their login account — a resident can
   exist in the system (e.g. as a pending admission) before they even have a login.
2. A resident's record can later be connected to a login account once one is created for them.
3. Admin and Manager can create, view, update, and remove resident records.

## Feature 4 — Rooms & Beds
*Details: not written yet · Status: Not started*

1. The system tracks rooms, each with a maximum number of beds, and tracks each individual bed
   inside that room.
2. Every bed has a status: vacant, occupied, or under maintenance.
3. A room cannot be deleted while any of its beds are occupied.

## Feature 5 — Room Allocation
*Details: not written yet · Status: Not started*

1. The system can assign one resident to one vacant bed.
2. A resident who already has a bed cannot be assigned a second one.
3. Moving a resident from one bed to another must be a deliberate, visible action — never a silent
   overwrite of their previous assignment.

## Feature 6 — Check-in / Check-out
*Details: not written yet · Status: Not started*

1. Checking a resident in requires that they already have a room allocation, and records when it
   happened and who did it.
2. Checking a resident out frees up their bed (marks it vacant again) and records when it
   happened and who did it.
3. What happens to any unpaid rent at check-out time is a decision that gets made and written
   down when the Rent & Payments feature is designed — it is not assumed here.

## Feature 7 — Rent & Payments
*Details: not written yet · Status: Not started*

1. The system tracks the rent expected for each room allocation, and the payments recorded
   against it.
2. Payments are entered into the system by hand after being collected — there is no online
   payment gateway built in.
3. At any time, the system can answer "who owes what, right now" without anyone doing the math
   by hand.

## Feature 8 — Complaints
*Details: not written yet · Status: Not started*

1. A resident can submit a complaint, tied to their own record.
2. Manager and Admin can view, prioritize, and resolve complaints, moving them through statuses:
   open, in progress, resolved.
3. A resident can only ever see their own complaints — never anyone else's.

## Feature 9 — Dashboard
*Details: not written yet · Status: Partly built (layout only, no real data yet)*

1. The dashboard shows real numbers, calculated from actual data, once each underlying feature
   exists.
2. The dashboard must never show a made-up or placeholder number as if it were real. If a
   feature's data doesn't exist yet, the dashboard says so plainly (e.g. "not tracked yet")
   instead of guessing. This is a strict rule — see [`Architecture.md`](./Architecture.md),
   section "Data honesty," for how it's enforced in the code.
