# Rooms & Beds

**Status:** Draft
**Spec number:** 003
**Related FRD sections:** FR-4

## Problem

Before any resident can be assigned anywhere (Feature 5), the hostel needs an inventory of its
physical rooms and the individual beds inside them. Today nothing in the system tracks a room,
its type, its rent, or how many beds it has — "how many beds are free right now" has no answer.
Feature 4 gives Admin and Manager a place to register rooms, generate their beds, and see
occupancy at a glance, independently of who (if anyone) is assigned to a bed yet.

## Scope

- In scope: `Room` CRUD (create/list/search/filter/view/update/delete) for Admin and Manager;
  beds are created automatically when a room is created (one per unit of capacity) and can be
  added/edited/removed individually afterward; dashboard "Total Rooms" / "Total Beds" /
  "Available Beds" counts.
- Out of scope (explicitly deferred to Feature 5 — Room Allocation):
  - Assigning a resident to a bed, or moving them between beds. `Bed.residentId` and the
    `OCCUPIED` status exist on the model now (and the read APIs already surface an assigned
    resident's name via population) so Feature 5 has something to drive, but nothing in this
    phase ever sets them — `PUT /api/beds/:id` only accepts `AVAILABLE`/`MAINTENANCE`.
  - Rent collection / payment tracking against a room (Feature 6).
  - A resident-facing view of their own room/bed (belongs with a future "resident portal" pass).

## Roles & permissions

| Action | Admin | Manager | Resident |
| --- | --- | --- | --- |
| Create/list/search/view/update/delete a room, or add/update/delete a bed | ✅ | ✅ | ❌ |
| See "Total Rooms" / "Total Beds" / "Available Beds" dashboard counts | ✅ | ✅ | ❌ (tile shows "Staff only", same treatment as the Residents tiles) |

## Data model

`Room` (`backend/src/models/room.model.ts`):

- `roomNumber` (string, required, unique — e.g. `"101"`)
- `floor` (number, required — can be `0`/negative for ground/basement floors)
- `type` (`SINGLE` \| `DOUBLE` \| `TRIPLE` \| `FOUR_SHARING` \| `DORMITORY`, required)
- `capacity` (number, required, 1–12 — see Edge cases for why beds and capacity can diverge)
- `monthlyRent` (number, required, ≥ 0)
- `status` (`AVAILABLE` \| `PARTIALLY_OCCUPIED` \| `FULL` \| `MAINTENANCE`, default `AVAILABLE` —
  see Edge cases for how this is maintained)
- `description?` (free-text string)
- `createdBy` (ref `User`, the Admin/Manager who created the record)
- timestamps

`Bed` (`backend/src/models/bed.model.ts`):

- `roomId` (ref `Room`, required)
- `label` (string, required — e.g. `"A"`, unique within its room)
- `status` (`AVAILABLE` \| `OCCUPIED` \| `MAINTENANCE`, default `AVAILABLE`)
- `residentId?` (ref `Resident`, optional — set by Feature 5, not by anything in this phase)
- timestamps

Relationship: one `Room` has many `Bed`s (`Bed.roomId`). Deleting a room also deletes its beds
(see Edge cases for when that's blocked). A `Bed` optionally points at one `Resident`; that link
is exclusively written by Feature 5.

Indexes: `roomNumber` is unique (required for the list search and to prevent duplicate room
records). `floor` and `status` are indexed to support list filters. On `Bed`, `{ roomId, label }`
is a compound unique index (two beds in the same room can't share a label) and `status` is
indexed (used by the dashboard "Available Beds" count and the delete-guard check).

## User flows

1. Manager opens Rooms → "Add room" → enters room number, floor, type, capacity (e.g. 4), and
   rent → room is created immediately with 4 beds labeled A, B, C, D, all `AVAILABLE`.
2. Admin/Manager → Rooms → searches "101" → list filters to rooms whose room number contains the
   search text; combined with the floor and status filters if also set.
3. Manager opens a room's detail page → sees the room's info and a grid of its beds, each showing
   its status and (once Feature 5 exists) who's assigned to it → clicks "Add bed" to add one more
   bed beyond the original capacity, or edits/removes an individual bed.
4. A room needs to go offline for repairs → Manager → room → Edit → status → Maintenance → the
   room stops being counted as available anywhere until an Admin/Manager explicitly sets it back.
5. A room was created by mistake and has no occupied beds → Admin/Manager → room → Delete →
   confirms → the room and all its beds are removed together.
6. A room has at least one occupied bed (once Feature 5 exists) → Delete is attempted → the
   request is rejected with a clear reason instead of silently succeeding or partially deleting.

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/rooms` | Admin, Manager | Create a room; auto-creates its beds (`capacity` beds, labeled A, B, C, ...) |
| GET | `/api/rooms` | Admin, Manager | List rooms — `q` (search by room number), `floor`, `status`, `page`, `limit`; each row includes a `bedCounts` summary |
| GET | `/api/rooms/stats` | Admin, Manager | `{ totalRooms, totalBeds, availableBeds }` counts for the dashboard cards |
| GET | `/api/rooms/:id` | Admin, Manager | Fetch one room |
| PUT | `/api/rooms/:id` | Admin, Manager | Update a room's details; `status` may only be set to `AVAILABLE` or `MAINTENANCE` |
| DELETE | `/api/rooms/:id` | Admin, Manager | Remove a room and its beds (blocked if any bed is occupied) |
| GET | `/api/rooms/:roomId/beds` | Admin, Manager | List a room's beds (with the assigned resident's name populated, if any) |
| POST | `/api/rooms/:roomId/beds` | Admin, Manager | Add one more bed to an existing room |
| PUT | `/api/beds/:id` | Admin, Manager | Update a bed's label or status (`AVAILABLE`/`MAINTENANCE` only) |
| DELETE | `/api/beds/:id` | Admin, Manager | Remove a bed (blocked if occupied) |

## Edge cases & rules

- **Room status is mostly computed, not typed in.** `AVAILABLE` / `PARTIALLY_OCCUPIED` / `FULL`
  are derived from the room's actual bed statuses every time a bed is added, edited, or removed
  (0 occupied → `AVAILABLE`; some but not all → `PARTIALLY_OCCUPIED`; all → `FULL`). `MAINTENANCE`
  is the one manual override: an Admin/Manager sets it explicitly via `PUT /api/rooms/:id`, and it
  sticks — bed changes do not clear it — until someone explicitly sets the room back to
  `AVAILABLE`, at which point it's immediately recomputed from real bed occupancy rather than
  blindly trusted.
- **Capacity is a planning number, not a live bed count.** It drives how many beds get created at
  room-creation time, and can be edited later via `PUT /api/rooms/:id`, but editing it never
  auto-adds or auto-removes beds — beds are managed one at a time via the beds endpoints. The room
  detail page always shows the real bed count (and its occupancy breakdown) alongside capacity, so
  any mismatch is visible rather than hidden. Capacity is capped at 12 per room.
- **Bed labels are single letters (A, B, C, ...)**, auto-assigned in order at room creation and
  chosen by the caller for beds added afterward via `POST /api/rooms/:roomId/beds`. Enforced
  unique per room, not globally.
- `roomNumber` duplicates → `409` with a specific message, checked before insert/update,
  backstopped by the schema's unique index (same pattern as `Resident.email`).
- Deleting a room is blocked with `409` while any of its beds has `status: OCCUPIED`. Deleting a
  room that passes that check also deletes all of its beds — there is no orphaned-beds state.
- Deleting or updating a single bed is blocked with `409` while it is `OCCUPIED`, until it's
  unassigned (Feature 5's job) — this only matters once Feature 5 ships, since nothing in this
  phase can ever set a bed to `OCCUPIED`.
- Search (`q`) is a case-insensitive partial match on `roomNumber` only; empty/whitespace-only `q`
  is treated as "no search."
- Empty state: zero rooms (fresh install) and zero search/filter results are both handled — the
  list says "No rooms yet" vs. "No rooms match your search", with "Add room" still available in
  the first case.
- `/api/rooms/stats` never returns fabricated numbers — it always reflects live
  `Room.countDocuments` / `Bed.countDocuments`, same honesty rule as the Residents stats tile.

## Acceptance criteria

- [ ] Creating a room with capacity 4 immediately creates 4 beds labeled A–D, all `AVAILABLE`.
- [ ] `GET /api/rooms` search matches on room number; floor and status filters and pagination all
      work and can be combined.
- [ ] Duplicate room number on create/update returns `409`, not a raw Mongo error.
- [ ] A room's status automatically becomes `PARTIALLY_OCCUPIED`/`FULL`/`AVAILABLE` as its beds'
      statuses change, and stays `MAINTENANCE` until explicitly cleared.
- [ ] Deleting a room with an occupied bed is rejected with `409`; deleting a room with no
      occupied beds removes the room and all of its beds.
- [ ] `PUT /api/beds/:id` rejects any attempt to set `status` to `OCCUPIED` (schema-level, not
      just service-level).
- [ ] Resident role gets `403` from every `/api/rooms` and `/api/beds` route.
- [ ] `/rooms`, `/rooms/new`, `/rooms/:id`, `/rooms/:id/edit` all work end-to-end in the browser,
      including empty state, search, filters, pagination, add/edit/delete bed, and mobile layout.
- [ ] Dashboard "Total Rooms" / "Total Beds" / "Available Beds" tiles show real counts for
      Admin/Manager and never show a fabricated number.

## Open questions

None — the checklist this spec was written from was explicit enough to resolve every design
choice above without needing sign-off; decisions and their reasoning (especially the computed
room-status rule and the capacity-vs-bed-count split) are recorded inline so they can be revisited
if wrong.
