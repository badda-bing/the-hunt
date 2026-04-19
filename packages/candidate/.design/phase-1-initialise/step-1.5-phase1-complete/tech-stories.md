# Step 1.5 — Tech stories

## TS-1.5.1 — Phase 1 exit-criteria evaluator

### Scope
Pure function that checks all Phase 1 exit criteria and returns a `{ ready, missing: string[] }` report. Used both for UI display and as a precondition for emitting the phase-complete event.

### Framework surfaces used
- `framework.data.list` — read counts from `uploads`, `intel/career/roles`, `timeline-gap-labels`, `intel/career/aspirations`, `intel/career/next-role-expectations`
- `framework.data.exists`

### Custom work
- `modules/candidate/lib/phase1-gate.ts` — exports `checkPhase1ExitCriteria(): { ready, missing }`
- Criteria:
  - `uploads.length >= 1` ("missing: cv-upload")
  - `intel/career/roles.length >= 1` ("missing: cv-extracted")
  - Every gap from `analyzeTimeline()` has a corresponding `timeline-gap-labels` entry OR no gaps exist
  - `candidate.timeline.confirmed` event has fired in this candidate's history ("missing: timeline-confirmation")
  - `intel/career/aspirations.length >= 1` AND `intel/career/next-role-expectations.length >= 1` ("missing: aspirations")

### Cherry-pick from old Hunt
- `pipeline-orchestrator.ts` — exit-criteria pattern
- `workflow-rotator.ts` — phase-transition safety checks

### Tests
see `tests.md` §Positive-TS-1.5.1 / §Negative-TS-1.5.1

---

## TS-1.5.2 — `candidate.phase1.complete` event (idempotent)

### Scope
When all exit criteria pass for the first time, emit `candidate.phase1.complete` exactly once. Further calls are idempotent — event fires only once per candidate.

### Framework surfaces used
- `framework.events.bus` — emit
- `framework.data` — store a marker record `phase-transitions` (kind: 'derived') with `{ phase: 'phase1', completedAt }` to enforce single emission

### Custom work
- `modules/candidate/lib/phase1-gate.ts` — adds `maybeEmitPhase1Complete()` function:
  - Calls `checkPhase1ExitCriteria()`
  - If ready AND no existing phase-transitions record → write marker + emit event
  - If ready AND marker exists → no-op
- Subscriber wiring: `candidate.aspirations.captured` triggers `maybeEmitPhase1Complete()`; same for `candidate.timeline.confirmed`
- Event payload: `{ completedAt, summary: { rolesCount, gapsLabelled, aspirationsCount, nextRoleCount } }`

### Cherry-pick from old Hunt
- `workflow/advance/route.ts` — advance-with-safety pattern

### Tests
see `tests.md` §Positive-TS-1.5.2 / §Negative-TS-1.5.2

---

## TS-1.5.3 — Phase 2 unlock state

### Scope
Module-state helpers that report whether Phase 2 is available. Used by UI + route guards.

### Framework surfaces used
- `framework.data` — read the phase-transitions marker

### Custom work
- `isPhase2Unlocked(): boolean` — reads marker, returns true iff `phase1.complete` has fired
- Route guard for Phase 2 entry points: rejects with `ValidationError({ reason: 'phase-1-not-complete' })` if called prematurely

### Cherry-pick from old Hunt
- Conditional render pattern from `app/candidate/page.tsx`

### Tests
see `tests.md` §Positive-TS-1.5.3 / §Negative-TS-1.5.3

---

## TS-1.5.4 — Phase 1 summary UI

### Scope
Screen rendered when Phase 1 is complete — shows the summary counts + highlights + Phase 2 CTA.

### Framework surfaces used
- `framework.ui` — Card, Heading, Badge
- `framework.data.list` — fetch summary counts

### Custom work
- `app/candidate/phase1-complete/page.tsx` OR conditional render on `/candidate` when Phase 2 unlocked and not yet entered
- Summary display: roles, skills, gaps labelled, aspirations, next-role specifics
- Click-through links to each captured record set (linking back into Step 1.2 / 1.3 / 1.4 review screens)
- "Start deep research (Phase 2)" CTA — disabled-but-shown-as-coming-soon until Phase 2 is built

### Cherry-pick from old Hunt
- KPI strip pattern from `app/candidate/page.tsx`
- Badge + count patterns

### Tests
see `tests.md` §Positive-TS-1.5.4 / §Negative-TS-1.5.4
