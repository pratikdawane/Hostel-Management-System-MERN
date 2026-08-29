# Business Requirements Document — Hostel Management System

**Status:** Living document
**Last updated:** 2026-08-29

## 1. Problem statement

A single hostel currently manages residents, rooms, rent, and complaints through manual or
ad-hoc means (spreadsheets, registers, phone calls). This creates errors in occupancy tracking,
delayed rent collection, no audit trail for who did what, and no self-service for residents or
staff. HMS replaces that with one system of record for the hostel's day-to-day operations.

## 2. Stakeholders

| Role | Who | Primary need |
| --- | --- | --- |
| **Admin** (hostel owner) | Owns the hostel/business | Full control: staff accounts, financial visibility, final authority on every record |
| **Manager** (hostel staff) | Day-to-day operations | Manage residents, rooms, check-in/out, complaints without needing Admin for routine work |
| **Resident** (student/tenant) | Lives in the hostel | See their own room/rent/complaint status; raise complaints |

## 3. Business goals

1. **Single source of truth** for who lives where, what they owe, and what's broken.
2. **Reduce manual errors** in occupancy and rent tracking.
3. **Accountability** — every action (who created/changed/deleted what) is attributable to a
   real account, not a shared login.
4. **Staff can operate without the owner in the loop** for routine tasks, while the owner keeps
   oversight and final control over accounts and money.
5. **Residents get visibility** into their own status without calling the office.

## 4. Scope

### In scope (full product)
- Admin authentication and staff/resident account management
- Student/resident records
- Room and bed inventory
- Room allocation (assigning a resident to a bed)
- Check-in / check-out workflow
- Rent tracking and payment recording
- Complaint submission and resolution tracking
- Operational dashboard (occupancy, revenue, complaints at a glance)

### Explicitly out of scope (for now)
- Multi-hostel / multi-property support (single hostel only)
- Online payment gateway integration (payments are recorded, not collected in-app)
- Resident-facing mobile app (responsive web only)
- Automated messaging/notifications (SMS/email/push)
- Accounting/invoicing/tax features beyond basic rent + payment records

Anything above stays out of scope unless it gets its own BRD update — it is not implied scope
creep for any individual module spec.

## 5. Success criteria

- An Admin can onboard a Manager and have them operating independently within minutes.
- Every resident's room, bed, and rent status is answerable from the system, not memory.
- No feature ships with fabricated/placeholder data presented as real — see
  [`Architecture.md`](./Architecture.md) for how this is enforced technically.
- The system remains usable and correct at the scale of a single hostel (tens to a few hundred
  residents) — it is explicitly not being built for multi-tenant SaaS scale.

## 6. Delivery phases

| Phase | Contents | Status |
| --- | --- | --- |
| 1 | Monorepo foundation + Auth & user management | **Done** |
| 2 | Students, Rooms & Beds, Room Allocation | Not started |
| 3 | Check-in / Check-out, Rent & Payments | Not started |
| 4 | Complaints, full operational dashboard | Not started |

Phase boundaries may shift — the [`docs/README.md`](./README.md) module status table is the
up-to-date source, not this table.
