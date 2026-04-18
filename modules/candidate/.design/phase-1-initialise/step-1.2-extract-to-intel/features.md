# Step 1.2 — Features

## F-1.2.1 — CV text-extraction service

### Shape
- `modules/candidate/lib/cv-text-extractor.ts`
- Function `extractCVText(uploadId): Promise<{ text, sections, mimeType }>`
- Dispatches by MIME to pdf-parse / mammoth / passthrough

### Built from
- Tech story: TS-1.2.1
- 3rd-party libs: `pdf-parse`, `mammoth`
- Emits event (via TS-1.2.2 wiring): `candidate.cv.parsed`

### Tests
see `tests.md` §Positive-F-1.2.1 / §Negative-F-1.2.1

---

## F-1.2.2 — Curator dispatch engine

### Shape
- Event subscriber at `modules/candidate/lib/curator-dispatch.ts`
- Subscribes to `candidate.cv.parsed` (CV-applicable curators) and `candidate.interview.completed` (interview-applicable curators — Step 1.4)
- Fans out `runAgent` calls in parallel; aggregates results

### Built from
- Tech story: TS-1.2.2
- Framework primitives: `framework.events.bus.subscribe`, `framework.agents.runAgent`, `framework.observability.span`

### Tests
see `tests.md` §Positive-F-1.2.2 / §Negative-F-1.2.2

---

## F-1.2.3 — Per-curator intel writing with provenance

### Shape
- Each of the 20 curator agents (in `modules/candidate/lib/curators/<name>.ts`) outputs records to its territory
- Every record has required `source` field — schema-enforced via Zod
- Uses `framework.data.put` for versioned writes

### Built from
- Tech story: TS-1.2.3
- Framework primitives: `framework.agents.AgentDefinition`, `framework.data.put`

### Tests
see `tests.md` §Positive-F-1.2.3 / §Negative-F-1.2.3

---

## F-1.2.4 — Extraction review UI

### Shape
- Page at `app/candidate/page.tsx` (conditional on "CV uploaded & timeline not yet confirmed") OR a dedicated `app/candidate/extracted/page.tsx`
- Groups intel records by curator territory
- Shows source quote inline per record
- Indicates confirmation status (unverified / verified / edited / deleted)

### Built from
- Tech story: TS-1.2.4
- Framework primitives: `framework.ui.Card`, `framework.ui.Heading`, `framework.ui.Badge`, `framework.data.list`

### Tests
see `tests.md` §Positive-F-1.2.4 / §Negative-F-1.2.4

---

## F-1.2.5 — Confirm / edit / delete actions

### Shape
- Per-record action buttons in the review UI
- API routes: `POST /api/candidate/intel/[collection]/[id]/{confirm,edit}`; `DELETE /api/candidate/intel/[collection]/[id]`
- Edits create a new version with `source.kind: 'candidate-correction'`
- Deletes are soft (framework.data soft-delete)

### Built from
- Tech story: TS-1.2.5
- Framework primitives: `framework.data.put` (versioning), `framework.data.delete`, `framework.errors.wrap`

### Tests
see `tests.md` §Positive-F-1.2.5 / §Negative-F-1.2.5
