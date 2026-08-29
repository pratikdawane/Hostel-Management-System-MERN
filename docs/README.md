# HMS Documentation — Start Here

This folder holds the full documentation for the Hostel Management System. The root
[`README.md`](../README.md) only covers quick day-to-day setup. This folder explains the *why*,
the *what*, and the *how* in more depth.

## The documents, in the order you'd read them

| Order | Document | What it tells you |
| --- | --- | --- |
| 1 | [`BRD-HMS.md`](./BRD-HMS.md) | Why this project exists, who uses it, and what's in/out of scope |
| 2 | [`FRD-HMS.md`](./FRD-HMS.md) | Exactly what the system must do, feature by feature |
| 3 | [`Architecture.md`](./Architecture.md) | How it's technically built — the stack, the folders, how a request flows through it |
| 4 | [`ENVIRONMENT-SETUP.md`](./ENVIRONMENT-SETUP.md) | Step-by-step: how to get the app running on your own computer, including where to get each secret |
| 5 | [`ImplementationPlan.md`](./ImplementationPlan.md) | Phase-by-phase build progress: what's done, what's next, checklist by checklist |
| 6 | [`specs/`](./specs/) | One detailed write-up per feature, written *before* that feature is built |
| 7 | [`plans/`](./plans/) | The technical build plan for each feature, kept as a permanent record after it ships |

## How a new feature gets built, step by step

This project follows a simple rule: **nothing gets coded before it's written down and agreed on
first.** The steps are:

1. **Business/Functional Requirements** (`BRD-HMS.md` / `FRD-HMS.md`) set the big picture — these
   barely change once written.
2. Before a feature is built, someone writes a **spec** for it in `specs/`, using the
   [`specs/000-template.md`](./specs/000-template.md) template. The spec says exactly what the
   feature does, who can use it, and what the edge cases are. It's reviewed and agreed before any
   code is written.
3. An agreed spec turns into an **implementation plan** in `plans/` — the technical "how":
   which files change, what the data looks like, in what order things get built.
4. The feature is built following that plan, then actually tested by using it — not just checked
   by the compiler.
5. The spec's status is updated to **Implemented**. Both the spec and the plan stay in the
   project forever, as the permanent record of what was built and why.

In short:

```
BRD / FRD  →  a spec (what, precisely)  →  a plan (how)  →  built  →  spec marked "Implemented"
```

## What's built and what isn't, right now

| Feature | Spec | Status |
| --- | --- | --- |
| Login & account management | [`specs/001-auth.md`](./specs/001-auth.md) | Built |
| Residents | — | Not started |
| Rooms & Beds | — | Not started |
| Room Allocation | — | Not started |
| Check-in / Check-out | — | Not started |
| Rent & Payments | — | Not started |
| Complaints | — | Not started |
