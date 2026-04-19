# Run Plan — Step 1.1: Upload CV

> Narrow delivery plan for a single run. Scope, order, verification. The design docs ([step-1.1-upload-cv/](../.design/phase-1-initialise/step-1.1-upload-cv/)) define what this step means; this plan defines what this specific run builds.

## Context

This is the first implementation run after the scaffold + Phase 1 design. We deliver the entry gate for the candidate module: the ability to upload a CV, have it stored, get an event fired, and block other navigation until a CV exists.

**What exists before this run:** scaffolded app, two empty modules (candidate + tracker), framework green (726 tests), design docs for all of Phase 1 (in `modules/candidate/.design/`).

**What exists after this run:** working upload flow end-to-end with positive + negative tests green; the candidate can actually drop a CV into the app and have it stored, though nothing happens with the file yet (extraction is step 1.2 in a later run).

---

## Scope (what this run delivers)

From the design in [step-1.1-upload-cv/](../.design/phase-1-initialise/step-1.1-upload-cv/):

**Tech stories (all 4 in [tech-stories.md](../.design/phase-1-initialise/step-1.1-upload-cv/tech-stories.md)):**
- TS-1.1.1 — Register `uploads` collection (kind: user) in `modules/candidate/manifest.ts`; define metadata record shape
- TS-1.1.2 — POST `/api/candidate/cv-upload/route.ts` — format + size validation, raw file persist, metadata write
- TS-1.1.3 — Entry gate (`hasCV()` helper; conditional render in `app/candidate/page.tsx`)
- TS-1.1.4 — Emit `candidate.cv.uploaded` event on successful upload

**Features (all 4 in [features.md](../.design/phase-1-initialise/step-1.1-upload-cv/features.md)):**
- F-1.1.1 — UploadDropzone React component
- F-1.1.2 — Upload API route
- F-1.1.3 — Entry-gate render logic
- F-1.1.4 — Format + size validation

**Tests (from [tests.md](../.design/phase-1-initialise/step-1.1-upload-cv/tests.md)):** positive + negative tests for every US, TS, and F. All must pass.

---

## Out of scope (explicitly deferred to later runs)

- **CV text extraction** (Step 1.2 — different run)
- **Curator dispatch** (Step 1.2 — different run)
- **Showing the candidate what was extracted** (Step 1.2 UI — different run)
- **Timeline gap detection** (Step 1.3)
- **Aspirations interview** (Step 1.4)
- **`candidate.phase1.complete` emission** (Step 1.5)
- **Module-level admin UI**
- **Multi-upload management UI** (we do support re-uploads by writing new versioned metadata, but there's no UI for browsing upload history in this run)

---

## Order of operations

Feature Definition → failing tests → implementation → tests pass → commit. One commit per tech story (small commits easier to review).

1. **Prerequisites**
   - Wire vitest if not already configured
   - Wire `mockFramework` test harness pattern from `@baddabing/framework/testing`

2. **TS-1.1.1 — `uploads` collection** (commit)
   - Add collection to `modules/candidate/manifest.ts`
   - Write upload metadata TypeScript type
   - Failing tests for collection registration + metadata round-trip
   - Implement
   - Tests pass

3. **TS-1.1.2 — Upload route + storage + validation** (commit)
   - Write failing tests (route contract: happy + unsupported-format + too-large + mid-write-failure)
   - Implement route handler + raw-file write + framework.data.put
   - Wire `framework.errors.wrap`
   - Tests pass

4. **TS-1.1.4 — Event emission** (commit)
   - Failing tests for event emission (exactly once on success; zero on validation failure)
   - Implement emit via `framework.events.bus` inside an `observability.span`
   - Tests pass

5. **TS-1.1.3 — Entry gate** (commit)
   - Failing tests for `hasCV()` + conditional render
   - Implement helper + branch in `app/candidate/page.tsx`
   - Tests pass

6. **F-1.1.1 — UploadDropzone component** (commit)
   - Failing component test (component rendering + upload POST trigger)
   - Implement dropzone using `framework.ui` primitives
   - Tests pass

7. **End-to-end verification** (no commit unless fixing)
   - `pnpm test` — all step-1.1 tests green
   - `pnpm build` — Next.js builds clean
   - `npx tsc --noEmit` — types pass
   - Run the app locally; confirm upload flow works in browser

---

## Vision adherence check (run-plan scan against vision)

Walking each tech story against the candidate module's [vision](../.design/vision.md):

- **TS-1.1.1 (collection)** — serves Vision #1 (Provenance). The upload record is the anchor every later intel record cites.
- **TS-1.1.2 (route + validation)** — serves Vision #2 (Time-respect) via clear format errors. No silent failures.
- **TS-1.1.3 (entry gate)** — serves Vision #3 (Completeness). Without a CV, the module cannot work; don't pretend otherwise.
- **TS-1.1.4 (event emission)** — serves X-TS-3 (event-emitted transitions). Downstream depends on this envelope.
- **Framework default (X-TS-1)** — every tech story uses `framework.data` / `framework.events` / `framework.errors`; custom work is the UI + route handler + file I/O for raw file.
- **Test discipline (X-TS-2)** — every tech story has positive + negative tests before implementation.

No vision drift.

---

## Verification (end-of-run)

Run passes when:

- `pnpm test` — all Step 1.1 tests green (both positive and negative paths)
- `pnpm build` — `next build` compiles clean
- `npx tsc --noEmit` — no type errors
- Manual browser check — dropping a valid PDF on the upload screen succeeds; dropping a PNG is rejected with a clear message
- Git history shows 5–6 small commits (one per TS/F), each with descriptive messages
- [step-1.1 design doc tests.md](../.design/phase-1-initialise/step-1.1-upload-cv/tests.md) — every positive/negative pair has at least one matching test in the implementation

On any regression: stop, diagnose, fix before adding more. No feature-creep into Step 1.2.
