# Step 1.5 — Tests

---

## User-story tests

### Positive-US-1.5.1 / Negative-US-1.5.1 — Phase 1 complete state

**Positive:** With all Phase 1 criteria met (CV uploaded, intel extracted, timeline confirmed, aspirations captured), navigating to `/candidate` (or `/candidate/phase1-complete`) shows the "Phase 1 complete" state with Phase 2 CTA visible.

**Negative:** If any criterion is missing, the screen shows the prior step instead (upload, timeline review, interview, etc.) with what's still required.

---

### Positive-US-1.5.2 / Negative-US-1.5.2 — Summary view

**Positive:** Summary shows correct counts: number of roles, labelled gaps, aspirations records, next-role records. Click-through on "X aspirations captured" opens the aspirations review.

**Negative:** If a click-through target is empty (shouldn't happen given exit criteria, but guard it), the link is not rendered; instead an empty-state is shown.

---

### Positive-US-1.5.3 / Negative-US-1.5.3 — Proceed or pause

**Positive:** Click "Start deep research" → navigates to Phase 2 entry. Closing the browser and returning later → Phase 1 complete state preserved (no regression).

**Negative:** Clicking "Start deep research" when Phase 2 isn't built yet → graceful "coming soon" message, not a 500 error.

---

### Positive-US-1.5.4 / Negative-US-1.5.4 — No moving goalposts

**Positive:** Once Phase 2 is clicked, the module does NOT raise additional requirements — entry succeeds.

**Negative:** If an exit criterion regresses (e.g., an aspirations record gets deleted), Phase 2 entry does NOT auto-retract; `phase1.complete` is sticky (written marker wins). Aspirations re-capture in Phase 2 is treated as enrichment, not gate-failure.

---

## Tech-story tests

### Positive-TS-1.5.1 / Negative-TS-1.5.1 — Exit-criteria evaluator

**Positive:** `checkPhase1ExitCriteria()` returns `{ready: true, missing: []}` when all five criteria are satisfied.

**Negative:** Missing CV → `{ready: false, missing: ['cv-upload']}`. Missing timeline confirm → `{ready: false, missing: ['timeline-confirmation']}`. Missing aspirations → `{ready: false, missing: ['aspirations']}`. Multiple missing → all named in the list.

---

### Positive-TS-1.5.2 / Negative-TS-1.5.2 — Idempotent phase-complete

**Positive:** First call to `maybeEmitPhase1Complete()` when criteria are met → writes marker + emits `candidate.phase1.complete` exactly once. Payload has the right summary counts.

**Negative:** Second call (marker exists) → no emission, no duplicate marker. Concurrent calls (two subscribers fire at same time) → exactly one emission (race-safety via `framework.data.transaction` around the check+write).

---

### Positive-TS-1.5.3 / Negative-TS-1.5.3 — Phase 2 unlock

**Positive:** `isPhase2Unlocked()` returns true iff the `phase-transitions` marker exists with `phase: 'phase1'`. Route guards on Phase 2 entry points accept the request.

**Negative:** `isPhase2Unlocked()` returns false before the marker is written. A direct POST to a Phase 2 route pre-unlock → rejected with `ValidationError({reason: 'phase-1-not-complete'})`.

---

### Positive-TS-1.5.4 / Negative-TS-1.5.4 — Summary UI

**Positive:** (page test) With seeded phase-1-complete state, the summary page renders with all counts correct; CTA "Start deep research" is enabled; click-throughs navigate correctly.

**Negative:** Rendering the summary page pre-completion → auto-redirects to the correct current-step page instead of rendering a half-broken summary.

---

## Feature tests

(Covered by tech-story tests.)

---

## Cross-cutting checks

- **Provenance (X-US-1):** The `phase-transitions` marker record has a `source` field citing the criteria state at the time of completion (which collections were populated, counts) — for audit.
- **Event discipline (X-TS-3):** `candidate.phase1.complete` follows the standard envelope; includes `correlation.traceId` inherited from whichever event (aspirations.captured or timeline.confirmed) triggered the final check.
- **Idempotency (framework S2):** Exactly-once emission is a hard invariant. Tests verify across race conditions + replays.
- **Framework-default (X-TS-1):** Marker write via `framework.data.put`; race-safety via `framework.data.transaction`; event via `framework.events.bus.emit`. No custom locks.
