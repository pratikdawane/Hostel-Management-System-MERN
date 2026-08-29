# Business Requirements — Hostel Management System

**Status:** Living document (gets updated as the project evolves)
**Last updated:** 2026-08-30

This document explains, in plain language, *why* this project exists and *what* it needs to
achieve for the business. It doesn't cover technical details — see
[`Architecture.md`](./Architecture.md) for that.

## 1. The problem, explained simply

Right now, a hostel is run using spreadsheets, paper registers, and phone calls to keep track of
who lives where, who has paid rent, and what's broken. This causes real problems:

- Mistakes in tracking which room/bed is occupied.
- Rent collection gets delayed or forgotten.
- No record of who made which change — if something goes wrong, no one can trace it.
- Residents have no way to check their own status — they have to call the office for everything.

This system replaces all of that with one shared, accurate source of information.

## 2. Who uses this system

| Who | What they are | What they mainly need from the system |
| --- | --- | --- |
| **Admin** | The hostel owner | Full control — manage staff accounts, see the money, have final say on every record |
| **Manager** | Hostel staff | Handle residents, rooms, and complaints day-to-day, without bothering the owner for routine work |
| **Resident** | A student or tenant living there | Check their own room, rent, and complaint status, and raise new complaints |

## 3. What success looks like for the business

1. **One place to check anything** — who lives where, what they owe, what's broken — instead of
   asking around or digging through paper.
2. **Fewer mistakes** in tracking who's living where and who has paid.
3. **Accountability** — every action is tied to a real person's account, never a shared login, so
   changes can always be traced back to who did them.
4. **Staff can work independently** — a Manager should be able to do routine work without needing
   the owner in the loop every time, while the owner keeps ultimate control.
5. **Residents can help themselves** — check their own information without a phone call.

## 4. What this project will and won't do

### It will do this (eventually, across all phases):
- Let an Admin log in and manage staff/resident accounts.
- Keep records of residents.
- Track rooms and individual beds.
- Assign a resident to a bed (room allocation).
- Handle a resident moving in (check-in) and moving out (check-out).
- Track rent that's due and record payments made.
- Let residents raise complaints and let staff resolve them.
- Show a dashboard summarizing occupancy, revenue, and open complaints.

### It will deliberately NOT do this, for now:
- Manage more than one hostel/property at a time.
- Take online payments directly (payments are written down in the system after being collected,
  not collected through the app).
- Provide a separate mobile app (the web app works on phones through the browser instead).
- Send automatic SMS/email/push notifications.
- Handle accounting, invoicing, or taxes beyond simple rent and payment records.

If any of these turn out to be needed, that decision gets written into this document first — it's
never assumed just because a feature is being built.

## 5. How we'll know it's working

- An Admin can set up a Manager account and have that Manager working on their own within
  minutes — no hand-holding required.
- For any resident, their room, bed, and rent status can be looked up in the system — never from
  memory or a phone call.
- The system never shows made-up or placeholder numbers as if they were real (see
  [`Architecture.md`](./Architecture.md), section "Data honesty," for how this is enforced in the
  code itself).
- The system stays fast and simple at the size of one hostel — a few hundred residents at most.
  It is deliberately not being built to handle many hostels at once.

## 6. The delivery plan, phase by phase

| Phase | What's included | Status |
| --- | --- | --- |
| 1 | Basic project setup + Login & account management | **Done** |
| 2 | Residents, Rooms & Beds, Room Allocation | Not started |
| 3 | Check-in / Check-out, Rent & Payments | Not started |
| 4 | Complaints, full dashboard | Not started |

The exact boundaries between phases may shift slightly as work progresses. The table in
[`docs/README.md`](./README.md) always reflects the true, current status — treat it as more
up-to-date than this table if the two ever disagree.
