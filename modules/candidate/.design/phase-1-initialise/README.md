# Phase 1 — Initialise

**Goal:** Starting material captured and parsed; pre-research anchors (complete timeline + forward direction) locked.

**Entry:** Candidate arrives with nothing captured.

**Exit criteria** (all must hold for Phase 2 to unlock):
- ≥1 uploaded CV retained
- `intel/career/*` populated with source-cited records from CV
- Timeline continuous — every gap labelled
- Aspirations + next-role expectations captured from interview
- `candidate.phase1.complete` event emitted exactly once

---

## Steps

| # | Step | What the candidate does |
|---|---|---|
| 1.1 | [Upload CV](step-1.1-upload-cv/) | Drops a CV (PDF/DOCX/plain text) on the upload screen |
| 1.2 | [Extract to intel](step-1.2-extract-to-intel/) | Reviews what the module extracted from the CV; corrects / confirms |
| 1.3 | [Label timeline gaps](step-1.3-label-timeline/) | Labels any career/education gaps on a visual timeline; confirms continuity |
| 1.4 | [Aspirations interview (Oprah)](step-1.4-aspirations-interview/) | 30-min 2-part interview covering vision + next-role specifics |
| 1.5 | [Phase 1 complete](step-1.5-phase1-complete/) | Sees "Phase 1 complete — Phase 2 unlocked" |

Each step is a directory with four files: `user-stories.md`, `tech-stories.md`, `features.md`, `tests.md`.

---

## Technical stories map across steps

Per the design plan, Phase 1 has 6 technical stories spanning the 5 steps. Approximate mapping:

| Tech story | Primary step(s) | Spans |
|---|---|---|
| TS-1 Data layer + 20 curator definitions | 1.1, 1.2 | all Phase 1 steps write data |
| TS-2 CV parser + CV-curator dispatch | 1.2 | depends on 1.1 upload |
| TS-3 Timeline gap detection + self-service labelling | 1.3 | consumes Timeline curator output from 1.2 |
| TS-4 Aspirations interview + interview-curator dispatch | 1.4 | uses framework.chat |
| TS-5 Phase 1 gates + transition | 1.1 / 1.3 / 1.4 / 1.5 | cross-cutting; gate logic + `candidate.phase1.complete` |
| TS-6 Minimal Phase 1 UX | 1.1–1.5 | cross-cutting UI shell |

A step's `tech-stories.md` file declares the portion of each TS it owns.

---

## Curators active in Phase 1

All 20 core curators are ported as active (lightweight defs). In Phase 1 they fire on two event types:

- On `candidate.cv.parsed` (Step 1.2) — applicable curators read CV text: Timeline, Skills, Experience, Qualifications, Projects, Achievements, Awards, Company, People, Recommendations, Evidence, Narrative, Positioning, Value
- On `candidate.interview.completed` (Step 1.4) — applicable curators read transcript: Aspirations, Next-Role, Voice, Opinions, Personal Depth, Value, Positioning, Narrative

Curator names are functional (no character names like Grogu / IG-11). Interviewer names (Oprah) are preserved — they're per-session personas via `framework.chat`, not permanent agents.

---

## Reuse from old Hunt

Specific cherry-pick targets are named inside each step's `tech-stories.md`. Summary:

- Coverage-bitmap timeline algorithm (for 1.3) — `timeline-analysis.ts:88-213`
- Timeline gap labels + UI (for 1.3) — `TimelineReview.tsx:43-53`
- Oprah 2-part brief verbatim (for 1.4) — `actions-engine.ts:245-282`
- Aspiration + next-role-expectation schemas (for 1.4) — `.config/schemas/`
- CV extractor pattern (for 1.2) — `extractor.ts`, `routeEntities()`
- File storage convention (for 1.1) — `candidate/uploads/<id>/raw.<ext>`
- Dashboard + interview live screen shells (for 1.5 UX / TS-6) — `app/candidate/page.tsx`, `TimelineReview.tsx`, `app/candidate/interview/live/[sessionId]/page.tsx`
