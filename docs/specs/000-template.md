# <Module name>

**Status:** Draft | Approved | In progress | Implemented
**Spec number:** 00X
**Related FRD sections:** FR-X

## Problem

What real hostel-management pain does this solve? Who hits it, and how do they work around it
today without this feature?

## Scope

- In scope: ...
- Out of scope (explicitly deferred, and to *where*): ...

## Roles & permissions

Who can do what — be explicit per role (Admin / Manager / Resident), not just "authenticated
users."

## Data model

Entities, key fields, relationships to existing models (`User`, and any prior modules). Note
anything that must cascade or be blocked (e.g. "a Room cannot be deleted while it has an
occupied Bed").

## User flows

Numbered, concrete, one sentence per step:

1. Manager opens Rooms → clicks "Add room" → fills form (number, floor, bed count) → room
   appears in the list with N vacant beds.
2. ...

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## Edge cases & rules

The stuff that bites you later if it's not decided up front:
- What happens to in-progress records when a parent is deleted/deactivated?
- Duplicate/conflicting assignments — allowed, blocked, or requires confirmation?
- What's the empty state when nothing exists yet?

## Acceptance criteria

- [ ] ...
- [ ] ...

Becomes the manual verification checklist when the module is built.

## Open questions

Anything unresolved — get these answered (via a direct question, not an assumption) before the
spec moves from `Draft` to `Approved`.
