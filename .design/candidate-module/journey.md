# Candidate Module — Journey

> The candidate's journey across three phases. Phase structure is semantic; step numbering carries the phase ID (1.x, 2.x, 3.x). Each step is detailed in its own directory under the phase folder.

---

## The arc, in one sentence

From a single uploaded CV, through dynamic research and deep conversation, to a complete and current picture of the candidate — usable by downstream modules, never closed.

---

## Phase 1 — Initialise

**Goal:** Starting material captured and parsed; pre-research anchors (complete timeline + forward direction) locked.

**Entry:** A candidate arrives with nothing captured yet.

**Exit criteria** (all must hold):
- ≥1 uploaded CV retained
- `intel/career/*` populated with source-cited records from CV
- Timeline continuous (no unexplained gaps); every gap labelled
- Aspirations + next-role expectations captured from interview
- `candidate.phase1.complete` event emitted exactly once

**Steps:**
- [1.1 — Upload CV](phase-1-initialise/step-1.1-upload-cv/) — Hard gate. PDF / DOCX / plain text.
- [1.2 — Extract to intel](phase-1-initialise/step-1.2-extract-to-intel/) — CV → structured intel, every record cited.
- [1.3 — Close timeline gaps](phase-1-initialise/step-1.3-label-timeline/) — Self-service labelling; continuous start-to-end; overlaps permitted.
- [1.4 — Aspirations interview (Oprah)](phase-1-initialise/step-1.4-aspirations-interview/) — 30-min 2-part interview; post-interview extraction.
- [1.5 — Phase 1 complete](phase-1-initialise/step-1.5-phase1-complete/) — Transition signal; Phase 2 unlocks.

---

## Phase 2 — Deep Research

**Goal:** Rich, full-spectrum picture tailored to this candidate — researchers, curators, rubric, and advice all dynamically determined.

**Entry criteria:** Phase 1 complete (`candidate.phase1.complete` event fired).

**Exit criteria:** Rubric floor met on every dimension ∧ timeline continuous ∧ aspirations defined ∧ picture fresh.

**Steps:**
- 2.1 — Identify required expertise domains *(meta-research; detail TBD)*
- 2.2 — Conduct research & propose dimensions *(TBD)*
- 2.3 — Architect curators for orphaned dimensions *(TBD)*
- 2.4 — Curators extract *(TBD)*
- 2.5 — Evaluator scores the rubric *(TBD)*
- 2.6 — Advisor reviews & suggests interviews *(TBD — deep-dive vs breadth-pass)*
- 2.7 — Deep conversation on chosen gap *(TBD)*
- 2.8 — Re-research gate *(TBD)*
- 2.9 — Session close & progress *(TBD)*

*(Full Phase 2 design drafted in a separate planning session after Phase 1 ships.)*

---

## Phase 3 — Steady State

**Goal:** Picture complete and announced; living asset; responsive to other modules.

**Entry criteria:** Phase 2 exit criteria met.

**Exit criteria:** None — Phase 3 is ongoing.

**Steps:**
- 3.1 — Announce completion — `"Your profile is complete."` Downstream modules notified.
- 3.2 (DEFERRED) — Ongoing maintenance & cross-module responsiveness (staleness, rubric evolution, ingestion of tracker/Scribe events). Full design deferred until other modules exist.

---

## Cross-phase invariants

These hold at every step in every phase:

- **Provenance** — every intel record, rubric dimension, and score cites its source.
- **No re-asking** — any topic with a cited intel record is never asked again.
- **Event-emitted transitions** — every phase and step transition fires a typed event.
- **Framework-first** — every technical work item defaults to framework surfaces; custom work is explicit and justified.
- **Testable** — every behaviour has a positive and a negative test.

See [vision.md](vision.md) for the vision commitments and cross-cutting stories these invariants derive from.
