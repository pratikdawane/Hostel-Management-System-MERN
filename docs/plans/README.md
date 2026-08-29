# Implementation plans

One file per module: `00X-<module>-plan.md`, numbered to match its spec in [`../specs/`](../specs/).

A plan is the *technical* translation of an already-**Approved** spec — data model details, file
list, execution order, verification steps. It's written using Claude Code's plan mode
(`EnterPlanMode` → plan file → your approval via `ExitPlanMode`), then a copy is saved here
permanently once approved, since the plan-mode scratch file itself lives outside the repo (in
Claude's local plan history) and isn't something teammates or future-you can see in git.

## Convention

1. Spec in `../specs/00X-<module>.md` reaches `Approved`.
2. Plan mode produces the technical plan; you approve it.
3. Save the approved plan here as `00X-<module>-plan.md` (lightly cleaned up — drop nothing
   substantive, but you can trim exploratory back-and-forth).
4. After the module ships and is verified, add a short **"Notes from implementation"** section
   at the bottom for anything that changed from the plan or was caught during live testing —
   this is the part that's actually valuable to future-you.

Plans are a historical record, not living documents — once a module ships, edit the *spec's*
status, not the plan.
