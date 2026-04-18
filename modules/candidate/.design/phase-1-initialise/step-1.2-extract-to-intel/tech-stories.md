# Step 1.2 — Tech stories

## TS-1.2.1 — CV text extraction (PDF / DOCX / plain text → text)

### Scope
Turn the raw uploaded file into plain text the curators can read. Handles PDF (via `pdf-parse`), DOCX (via `mammoth`), and plain text (pass-through).

### Framework surfaces used
- None — this is inherently custom third-party glue code

### Custom work
- Text-extraction service at `modules/candidate/lib/cv-text-extractor.ts`
- Dispatch by MIME: PDF → `pdf-parse`; DOCX → `mammoth`; text/plain → read file
- Output: `{ text: string, sections: Array<{ title?, start, end }> }` — sections carry offset ranges so curators can cite "lines 4-12" as the source
- Emit `candidate.cv.parsed` with `{ uploadId, textLength, sectionCount }` (actual text passed to subscribers via a separate data collection to avoid event bloat)

### Cherry-pick from old Hunt
- `modules/candidate/lib/extractor.ts` — extraction service structure
- No OCR in v2 (old Hunt had stub extractor); defer OCR until a real need

### Tests
see `tests.md` §Positive-TS-1.2.1 / §Negative-TS-1.2.1

---

## TS-1.2.2 — Curator dispatch subscriber

### Scope
An event subscriber that listens for `candidate.cv.parsed`, loads the extracted text, and dispatches the CV-applicable curators in parallel.

### Framework surfaces used
- `framework.events.bus` — `bus.subscribe('candidate.cv.parsed', handler)`
- `framework.agents.runAgent` — one run per curator
- `framework.observability.span` — a parent span per dispatch so all curator runs share a trace id

### Custom work
- Dispatch logic: for each of the CV-applicable curators (Timeline, Skills, Experience, Qualifications, Projects, Achievements, Awards, Company, People, Recommendations, Evidence, Narrative, Positioning, Value), invoke `runAgent(curator.def, { prompt, runId })` with the CV text + section info
- Parallel execution via `Promise.all`; tolerant of individual-curator failures (record the error, continue)

### Cherry-pick from old Hunt
- `modules/candidate/lib/pipeline-orchestrator.ts` — parallel-curator dispatch pattern
- `modules/candidate/lib/researcher-runner.ts:282-284` — parallel execution convention

### Tests
see `tests.md` §Positive-TS-1.2.2 / §Negative-TS-1.2.2

---

## TS-1.2.3 — Curator extraction with source provenance

### Scope
Each curator's agent definition + system prompt yields intel records in its territory, each carrying a `source` field that cites the CV section + quote verbatim.

### Framework surfaces used
- `framework.agents.runAgent` — curator agents
- `framework.data.put` — writes into the curator's territory collection
- `framework.data` versioning — every put is a new version (P4)

### Custom work
- Per-curator system prompts (20 of them, but Phase 1 only needs the ~14 CV-applicable ones — the others fire on interview transcript in Step 1.4)
- Intel record shape with `source: { kind: 'cv-section', uploadId, offsetStart, offsetEnd, quote }`
- Schema validation (Zod) enforces `source` field is present on every write

### Cherry-pick from old Hunt
- `curator-registry.ts` — the 20 curator definitions (strip character names; keep territory/schema/curates)
- `prompt-builder.ts` — any shared prompt fragments worth porting (ARMORER_RUBRIC is Phase 2; here we want the per-curator extraction prompts)

### Tests
see `tests.md` §Positive-TS-1.2.3 / §Negative-TS-1.2.3

---

## TS-1.2.4 — Extraction review UI

### Scope
A dashboard page showing extracted intel grouped by curator territory, with each record's source quote visible (inline or on hover).

### Framework surfaces used
- `framework.ui` — Card, Heading, Badge, tooltip-adjacent primitives
- `framework.data.list` — read each territory's records

### Custom work
- `app/candidate/extracted/page.tsx` (or embedded in `app/candidate/page.tsx` when no-timeline-confirmed)
- Territory-grouped render: one section per curator territory
- Source-quote display per record

### Cherry-pick from old Hunt
- `app/candidate/page.tsx` — dashboard layout patterns (KPI strip + lens grid)
- Intel display components (if any survive the rebuild)

### Tests
see `tests.md` §Positive-TS-1.2.4 / §Negative-TS-1.2.4

---

## TS-1.2.5 — Confirm / edit / delete intel actions

### Scope
Routes + UI for the candidate to confirm a record, edit its value, or delete it. Confirmation marks the record as `verified: true`; edits produce a new version with `source: { kind: 'candidate-correction', ... }`.

### Framework surfaces used
- `framework.data.put` (new version for edits), `framework.data.delete` (soft delete)
- `framework.events.bus` — emit `candidate.intel.confirmed` / `.edited` / `.deleted`
- `framework.errors` — route-handler wrap

### Custom work
- POST `/api/candidate/intel/[collection]/[id]/confirm`
- POST `/api/candidate/intel/[collection]/[id]/edit`
- DELETE `/api/candidate/intel/[collection]/[id]`
- UI: confirm-button, edit-in-place, delete-with-undo

### Cherry-pick from old Hunt
- Edit-in-place patterns from `TimelineReview.tsx` (role editing)

### Tests
see `tests.md` §Positive-TS-1.2.5 / §Negative-TS-1.2.5
