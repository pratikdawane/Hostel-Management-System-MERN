# Functional Requirements Document — Hostel Management System

**Status:** Living document
**Last updated:** 2026-08-29

Requirements here are stated at product-decision level (what the system must do and the rules
that govern it). Implementation-ready detail (exact API routes, field lists, UI states) lives in
the corresponding [`specs/`](./specs/) file once a module is scheduled for build.

## FR-1 — Authentication & session management
*Spec: [`specs/001-auth.md`](./specs/001-auth.md) · Status: Implemented*

- FR-1.1 The system SHALL support exactly three roles: Admin, Manager, Resident.
- FR-1.2 The first Admin account SHALL be created via a one-time bootstrap flow; the endpoint
  SHALL refuse to create a second Admin this way once one exists.
- FR-1.3 All non-bootstrap accounts SHALL be created by an Admin, never via public self-registration.
- FR-1.4 Sessions SHALL use a short-lived access token + rotating refresh token, never a
  long-lived token stored in browser `localStorage`.
- FR-1.5 Changing a password SHALL invalidate that account's other active sessions immediately.
- FR-1.6 Deactivating an account SHALL invalidate its sessions immediately, not on next expiry.
- FR-1.7 An Admin SHALL NOT be able to deactivate their own account or the last remaining active Admin.

## FR-2 — User management
*Spec: [`specs/001-auth.md`](./specs/001-auth.md) · Status: Implemented*

- FR-2.1 Admin SHALL be able to create, list (filterable by role, paginated), and
  activate/deactivate Manager/Resident/Admin accounts.
- FR-2.2 Manager and Resident roles SHALL NOT have access to account-management endpoints.

## FR-3 — Students
*Spec: not yet written · Status: Not started*

- FR-3.1 The system SHALL maintain a student/resident record independent of their login account
  (a Resident may exist in the system before they have login credentials, e.g. pending admission).
- FR-3.2 A student record SHALL be linkable to a User account (role `resident`) once one exists.
- FR-3.3 Admin/Manager SHALL be able to create, view, update, and (soft-)delete student records.

## FR-4 — Rooms & Beds
*Spec: not yet written · Status: Not started*

- FR-4.1 The system SHALL track rooms with a bed capacity, and individual beds within each room.
- FR-4.2 Each bed SHALL have a status (vacant / occupied / under maintenance).
- FR-4.3 A room SHALL NOT be deletable while it has an occupied bed.

## FR-5 — Room Allocation
*Spec: not yet written · Status: Not started*

- FR-5.1 The system SHALL allow assigning one resident to one vacant bed at a time.
- FR-5.2 A resident SHALL NOT be assignable to a second bed while already occupying one.
- FR-5.3 Reassignment (moving a resident between beds) SHALL be an explicit, auditable action,
  not a silent overwrite.

## FR-6 — Check-in / Check-out
*Spec: not yet written · Status: Not started*

- FR-6.1 Check-in SHALL require an active room allocation and SHALL record a timestamp + actor.
- FR-6.2 Check-out SHALL free the bed (status returns to vacant) and record a timestamp + actor.
- FR-6.3 The system SHALL define and enforce what happens to unpaid rent on check-out (resolved
  in the FR-7 spec, not assumed here).

## FR-7 — Rent & Payments
*Spec: not yet written · Status: Not started*

- FR-7.1 The system SHALL track expected rent per allocation and recorded payments against it.
- FR-7.2 Payments SHALL be recorded manually (no payment gateway integration — see BRD §4).
- FR-7.3 The system SHALL be able to answer "who owes what, as of today" without manual calculation.

## FR-8 — Complaints
*Spec: not yet written · Status: Not started*

- FR-8.1 A Resident SHALL be able to submit a complaint tied to their own record.
- FR-8.2 Manager/Admin SHALL be able to view, triage, and resolve complaints with a status
  (open / in progress / resolved).
- FR-8.3 A Resident SHALL only ever see their own complaints, never another resident's.

## FR-9 — Dashboard
*Spec: not yet written · Status: Partially implemented (placeholder UI only)*

- FR-9.1 The dashboard SHALL show real, computed figures once the underlying module exists.
- FR-9.2 The dashboard SHALL NEVER display a fabricated/placeholder number as if it were real
  data — a not-yet-available metric shows an explicit "not tracked yet" state instead (this is a
  hard rule, not a style preference — see [`Architecture.md`](./Architecture.md) §"Data honesty").
