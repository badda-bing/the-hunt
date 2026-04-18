# Candidate Module — Vision

> The vision is the standard every feature in this module answers to. Changes rarely. If any feature drifts from a commitment here, either the feature is wrong or the vision needs explicit revision — not silent drift.

---

## Vision

**Know the candidate better than they could describe themselves in a cold moment.**

Not a profile. Not a data record. A whole person — the career they've lived, the journey that shaped them, the preferences they've earned along the way, and the direction they're reaching for. Rich, detailed, honest, kept current.

Expert in whatever the work demands, researching its own required expertise (recruitment, careers, psychological profiling, the candidate's field are plausible starting points, not a closed list). The picture is built through deep, exploratory communication: minimising the candidate's time, refusing to miss the full picture, and never making them cover the same ground twice. Rigorous and measurable throughout.

Every view of the candidate is derivable back to something they said. Nothing appears without provenance.

Every feature in this module answers to this standard.

---

## Vision commitments (what the vision *actually demands*)

Each is a testable constraint. Every feature is checked against these.

1. **Provenance.** Every intel record, every rubric dimension, every score must cite its source — a CV section or a chat-turn id. Nothing that cannot be cited belongs in the module.
2. **Time-respect.** Candidate time is scarce. The module minimises repetition, avoids re-asking, prefers dense over verbose, and surfaces the highest-value next move.
3. **Completeness over convenience.** The picture must not be thin where it can be deep. Gaps that matter are never quietly tolerated; they are surfaced and closed.
4. **Dynamic expertise.** The module determines what it needs to know per candidate. No fixed expertise roster. Researchers, rubric dimensions, and curators grow with what each candidate requires.
5. **Rigor + measurability.** Every behaviour has a test. Every scoring outcome has a reproducible derivation. Every state transition is event-emitted.
6. **Framework-first.** If a capability exists on `framework.*`, we use it. Custom code only where the framework doesn't cover. Custom code earns its existence.

---

## Cross-cutting stories (apply across phases, steps, and features)

### X-US-1 — As the candidate, I can trust that nothing about me is invented.

**Why it matters:** Vision commitment 1 (Provenance).

**Applies to:** every intel write; every rubric dimension; every Evaluator score; every Advisor recommendation.

**Test:** Given any intel record, I can follow its `source` field to a verbatim CV section or chat-turn transcript. A record whose source doesn't resolve is a bug.

---

### X-US-2 — As the candidate, I never answer the same question twice.

**Why it matters:** Vision commitment 2 (Time-respect).

**Applies to:** every conversation; the Advisor's recommendations; curator dispatch.

**Test:** Across all sessions, no two conversation turns ask for information already captured in a cited intel record.

---

### X-TS-1 — Framework-default

**Scope:** Every technical story must first ask "does the framework already provide this?" before proposing custom work.

**Applies to:** all TS files across all steps.

**Framework surfaces to check first:**
- `framework.data` (IDataStore, collections, versioning, soft-delete)
- `framework.events.bus` (envelope emission, subscribers)
- `framework.agents` (AgentDefinition, runAgent, fingerprints)
- `framework.chat` (personas, sessions, four-tier context)
- `framework.knowledge` (RAG with citations)
- `framework.vector` (chunkers, embedders, namespaced vector stores)
- `framework.observability` (spans, correlation)
- `framework.errors` (structured error classes, boundary wrap)
- `framework.ui` (tokens + primitives + composites)
- `framework.testing` (mockDataStore, mockEventBus, mockLLMClient, testHarness)
- `framework.lifecycle` (manifest validation, migrations, health, purge)

**Test:** For every tech story, the `Framework surfaces used` section is non-empty OR the `Custom work` section justifies the absence.

---

### X-TS-2 — Every story tested positive + negative

**Scope:** Per framework rule P3 — every unit isolated-testable with both success and failure paths.

**Applies to:** all tests.md files across all steps.

**Test:** `pnpm test` runs all tests; every story has at least one positive and one negative case. CI fails on any regression.

---

### X-TS-3 — Every state transition is event-emitted

**Scope:** Every meaningful module state change fires a typed event on `framework.events.bus` with the standard envelope.

**Applies to:** all tech stories that write state — CV upload, extraction, timeline confirm, interview end, phase transitions.

**Event name convention:** `candidate.<subject>.<verb>` (matches framework's M2 rule).

**Test:** Subscribers can reconstruct any candidate's current state by replaying the event log.

---

## Known open items

- **"Never cover the same ground twice" dedup guard** is implied by X-US-2 but not yet its own tech story. Phase 2 will name it explicitly.
- **Time-budget metric** — the module's time-respect commitment is qualitative today. Phase 2 may introduce a measurable "cumulative candidate minutes" target per pitchable threshold.
- **Phase 1's Oprah is a fixed persona.** Vision demands dynamic expertise; Phase 1 accepts this simplification. Phase 2's meta-researcher upholds the full dynamic pattern.
