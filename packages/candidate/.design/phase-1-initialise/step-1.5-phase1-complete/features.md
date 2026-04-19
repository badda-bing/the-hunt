# Step 1.5 — Features

## F-1.5.1 — Exit-criteria evaluator

### Shape
- Pure function `checkPhase1ExitCriteria(): { ready, missing: string[] }` in `modules/candidate/lib/phase1-gate.ts`
- Returns structured report; no side effects

### Built from
- Tech story: TS-1.5.1
- Framework primitives: `framework.data.list`, `framework.data.exists`

### Tests
see `tests.md` §Positive-F-1.5.1 / §Negative-F-1.5.1

---

## F-1.5.2 — Phase-complete event (idempotent)

### Shape
- Function `maybeEmitPhase1Complete()` — reads exit criteria + marker state, emits event + writes marker if first time
- Subscribers to `candidate.aspirations.captured` and `candidate.timeline.confirmed` call this
- Event: `candidate.phase1.complete` with summary payload

### Built from
- Tech story: TS-1.5.2
- Framework primitives: `framework.events.bus.emit`, `framework.data.put`

### Tests
see `tests.md` §Positive-F-1.5.2 / §Negative-F-1.5.2

---

## F-1.5.3 — Phase 1 summary screen

### Shape
- Page at `/candidate/phase1-complete` (or conditional on `/candidate` root)
- Renders: KPI strip (roles/skills/gaps/aspirations/next-role counts) + highlights + click-through links

### Built from
- Tech story: TS-1.5.4
- Framework primitives: `framework.ui.Card`, `framework.ui.Heading`, `framework.ui.Badge`, `framework.data.list`

### Tests
see `tests.md` §Positive-F-1.5.3 / §Negative-F-1.5.3

---

## F-1.5.4 — Phase 2 CTA + unlock

### Shape
- "Start deep research (Phase 2)" CTA on the summary screen
- Visible only when `isPhase2Unlocked()` returns true
- Until Phase 2 is built, clicking shows "Phase 2 coming soon — your data is preserved"

### Built from
- Tech story: TS-1.5.3
- Framework primitives: `framework.ui.Button`

### Tests
see `tests.md` §Positive-F-1.5.4 / §Negative-F-1.5.4
