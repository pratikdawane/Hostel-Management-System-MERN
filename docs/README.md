# HMS Documentation

Project documentation for the Hostel Management System, separate from the root
[`README.md`](../README.md) (which covers day-to-day setup/run instructions).

| Doc | Purpose |
| --- | --- |
| [`BRD-HMS.md`](./BRD-HMS.md) | Business Requirements Document — the problem, stakeholders, scope, success criteria |
| [`FRD-HMS.md`](./FRD-HMS.md) | Functional Requirements Document — what the system must do, module by module |
| [`Architecture.md`](./Architecture.md) | Technical architecture — stack, structure, auth design, conventions |
| [`ENVIRONMENT-SETUP.md`](./ENVIRONMENT-SETUP.md) | Step-by-step environment setup, including how to obtain/generate each secret |
| [`specs/`](./specs/) | One spec per module — the source of truth for what a module does, written *before* it's built |
| [`plans/`](./plans/) | Archived implementation plans — the technical "how," derived from an approved spec |

## How these fit together (Spec-Driven Development)

```
BRD / FRD  →  specs/00X-<module>.md  →  plans/00X-<module>-plan.md  →  code  →  spec status: Implemented
(why/what)     (what, precisely)         (how)                        (build)   (record)
```

1. **BRD/FRD** set the overall product intent once, up front — they change rarely.
2. Before building a module, it gets a **spec** in `specs/` (template: [`specs/000-template.md`](./specs/000-template.md)).
   The spec is reviewed and agreed *before* any code is written.
3. An approved spec becomes an **implementation plan** in `plans/` — the concrete technical
   design (data model, routes, components, edge cases handled).
4. The module is built against the plan, then verified live (not just typechecked).
5. The spec's `Status` field flips to `Implemented`. Both files stay in the repo permanently as
   the record of what shipped and why.

## Current module status

| Module | Spec | Status |
| --- | --- | --- |
| Authentication & user management | [`specs/001-auth.md`](./specs/001-auth.md) | Implemented |
| Students | — | Not started |
| Rooms & Beds | — | Not started |
| Room Allocation | — | Not started |
| Check-in / Check-out | — | Not started |
| Rent & Payments | — | Not started |
| Complaints | — | Not started |
