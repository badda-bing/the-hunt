# Step 1.5 — User stories

## US-1.5.1 — See Phase 1 complete + Phase 2 unlocked

**As a candidate,** once my CV is extracted (Step 1.2), my timeline is continuous (Step 1.3), and my aspirations are captured (Step 1.4), I see a clear "Phase 1 complete — Phase 2 unlocked" state with a summary of what was captured.

**Why it matters:** Vision — *"rigorous and measurable"*. I need an explicit signal of milestone completion.

**Related tech stories:** TS-1.5.1, TS-1.5.2, TS-1.5.4
**Related features:** F-1.5.1, F-1.5.2, F-1.5.3
**Tests:** see `tests.md` §Positive-US-1.5.1 / §Negative-US-1.5.1

---

## US-1.5.2 — See a summary of what was captured in Phase 1

**As a candidate,** on the Phase 1 completion screen, I see counts + highlights: roles extracted, timeline gaps labelled, aspirations captured, next-role specifics captured. I can click into any to see the records.

**Why it matters:** Vision — *"honest"*. I should see what the module has before trusting it to do deeper research.

**Related tech stories:** TS-1.5.4
**Related features:** F-1.5.3
**Tests:** see `tests.md` §Positive-US-1.5.2 / §Negative-US-1.5.2

---

## US-1.5.3 — Choose to proceed to Phase 2 or pause here

**As a candidate,** I see a "Start deep research (Phase 2)" button. I can click it immediately OR close the browser and come back later without losing my Phase 1 state.

**Why it matters:** Vision — *"minimising the candidate's time"*. No forced march; the candidate controls the pace.

**Related tech stories:** TS-1.5.3
**Related features:** F-1.5.4
**Tests:** see `tests.md` §Positive-US-1.5.3 / §Negative-US-1.5.3

---

## US-1.5.4 — Trust that Phase 2 is actually ready

**As a candidate,** when I click "Start deep research", I'm not gated on anything else — the module does not tell me "actually you need to X first." Phase 1 completion means Phase 2 is fully unlocked.

**Why it matters:** Vision — honest, non-surprising transitions. The module doesn't move the goalposts.

**Related tech stories:** TS-1.5.2 (idempotent event emission)
**Related features:** F-1.5.4
**Tests:** see `tests.md` §Positive-US-1.5.4 / §Negative-US-1.5.4
