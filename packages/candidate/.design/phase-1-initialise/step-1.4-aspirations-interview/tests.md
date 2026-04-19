# Step 1.4 — Tests

---

## User-story tests

### Positive-US-1.4.1 / Negative-US-1.4.1 — Start interview

**Positive:** After Step 1.3 confirm, the CTA "Start aspirations interview" is visible. Clicking it POSTs to start route, returns `sessionId`, navigates to live page, and the first Oprah greeting streams in.

**Negative:** Trying to start before Step 1.3 is confirmed → CTA is not visible (timeline gate blocks). Trying to call the start route directly (bypassing UI) → rejected with `ValidationError({ reason: 'timeline-not-confirmed' })`.

---

### Positive-US-1.4.2 / Negative-US-1.4.2 — 2-part coverage

**Positive:** Over a simulated interview transcript (mockLLMClient responses), Part 1 covers vision topics (role/org type, sectors, 5-year/10-year, decline-dream-role, building-toward-vs-away-from) before the session transitions to Part 2. Part 2 covers next-role specifics (title, seniority, engagement, compensation, sector, size, location, deal-breakers).

**Negative:** If Part 1 is cut short (fewer than N vision topics covered) and the user tries to force advance → rejected. If Part 2 signals sufficiency but Part 1 didn't actually cover its required dimensions → the dispatch phase exists (completes) but a warning event `candidate.interview.part1-thin` is emitted for later review.

---

### Positive-US-1.4.3 / Negative-US-1.4.3 — Pause/resume

**Positive:** Candidate clicks Pause mid-interview → session state persists; closing and reopening the page and hitting Resume picks up from the same context. No repeat question.

**Negative:** Resume after a very long idle (>30 days stub threshold) → session is still resumable; a per-turn context cue reminds Oprah it's been a while but doesn't re-ask anything captured.

---

### Positive-US-1.4.4 / Negative-US-1.4.4 — Citations to answers

**Positive:** After the interview ends and curators run, every aspirations and next-role-expectation record has `source.kind === 'chat-turn'` with a valid `sessionId`, `turnId`, and `quote` that exactly matches the candidate's words in the transcript.

**Negative:** A curator that produces a record with source `kind: 'chat-turn'` but a `turnId` that doesn't exist in the transcript → write rejected at schema validation. Record not persisted.

---

### Positive-US-1.4.5 / Negative-US-1.4.5 — Completion signal

**Positive:** When Oprah signals completion + both aspirations and next-role collections have ≥1 record, the live page renders a completion summary + "Proceed to Phase 1 complete" CTA. `candidate.aspirations.captured` event fires.

**Negative:** If dispatch fails for (e.g.) the next-role curator (LLM error), event `candidate.aspirations.partial` fires instead — with recovery options (retry dispatch). Phase 1 does NOT advance until both collections are populated.

---

## Tech-story tests

### Positive-TS-1.4.1 / Negative-TS-1.4.1 — Oprah persona

**Positive:** At module boot, `framework.chat.ChatPersonaRegistry.forModule('candidate')` contains an entry with `id: 'oprah'`, `name: 'Oprah Winfrey'`, `body` non-empty, `defaultModel: 'claude-sonnet-4-6'`.

**Negative:** Attempt to register a second persona with `id: 'oprah'` in the same module → framework rejects with `IntegrityError`.

---

### Positive-TS-1.4.2 / Negative-TS-1.4.2 — Session lifecycle

**Positive:** Start → 200 with `sessionId`. Send a turn → streams tokens. Pause → session `status: 'paused'`. Resume → `status: 'active'` and next turn works. End → status `completed`, transcript saved.

**Negative:** Send turn to a session in `status: 'completed'` → rejected (`chat.send` throws per framework contract). Send to non-existent sessionId → `NotFoundError`.

---

### Positive-TS-1.4.3 / Negative-TS-1.4.3 — Phase tracking

**Positive:** Simulated interview where Part 1 covers its 5 vision dimensions → session metadata `interviewPhase` transitions from `part1` → `part2`. Continuing Part 2 covers its dimensions → `interviewPhase` → `complete` → session ends.

**Negative:** Interview where the candidate gives brief/unrelated answers and Part 1 doesn't cover any of the 5 dimensions → phase stays `part1`; session can be paused but not force-advanced; after N turns with no progress, Oprah adapts (emits a `follow-up-probe` signal — out of scope for Phase 1 spec, but test that it doesn't hard-fail).

---

### Positive-TS-1.4.4 / Negative-TS-1.4.4 — Curator dispatch

**Positive:** `candidate.interview.completed` with `personaId: 'oprah'` triggers dispatch. All 8 applicable curators run in parallel. `intel/career/aspirations` and `intel/career/next-role-expectations` both receive ≥1 record with valid `source`.

**Negative:** `candidate.interview.completed` with `personaId !== 'oprah'` → aspirations/next-role dispatch does NOT run. (Those curators are Oprah-interview-specific in Phase 1.)

---

### Positive-TS-1.4.5 / Negative-TS-1.4.5 — Aspirations-captured event

**Positive:** After successful dispatch, `candidate.aspirations.captured` emits exactly once with `{ aspirationCount, nextRoleCount }`. Both counts > 0.

**Negative:** If either collection is empty post-dispatch, event is NOT emitted. Instead `candidate.aspirations.partial` fires with details.

---

## Feature tests

(Covered by tech-story tests; feature tests verify the UX wiring holds end-to-end.)

---

## Cross-cutting checks

- **Provenance (X-US-1):** Every intel record from step 1.4 cites a chat-turn in the Oprah session transcript.
- **No re-asking (X-US-2):** During the interview, Oprah does not ask about the candidate's career history (that's covered by the CV in Step 1.2). The `modulePulls` in Oprah's persona surface the CV context; Oprah uses it without re-probing.
- **Framework-default (X-TS-1):** Chat uses `framework.chat` throughout; no custom chat runner. Curators use `framework.agents.runAgent`.
- **Event discipline (X-TS-3):** Session lifecycle events (`candidate.chat.session.started`, `.turn.completed`, `.session.ended`) emit automatically. Interview-specific events (`candidate.interview.completed`, `candidate.aspirations.captured`) follow envelope schema.
