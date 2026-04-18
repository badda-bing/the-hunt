# Step 1.2 — Tests

Every test has a positive and a negative case.

---

## User-story tests

### Positive-US-1.2.1 / Negative-US-1.2.1 — See extraction

**Positive:** Given a CV with 3 roles, 2 qualifications, and 10 skills, after extraction the review UI shows 3 records under "Timeline/Roles", 2 under "Qualifications", 10 under "Skills".

**Negative:** Given a 1-page CV with minimal content (e.g., "John Doe — Engineer — 5 years experience"), the UI still renders without errors; extraction shows whatever it could find; empty territories render with "Nothing found" empty-state (not hidden).

---

### Positive-US-1.2.2 / Negative-US-1.2.2 — Source citation visible

**Positive:** Every intel record displayed in the UI has a `source.quote` visible (inline or on hover). Clicking a record scrolls to / highlights the source CV section.

**Negative:** If any intel record somehow has no source (schema bug), the UI shows a prominent "missing provenance — bug" marker on the record and logs a structured error. The record is NOT silently rendered.

---

### Positive-US-1.2.3 / Negative-US-1.2.3 — Confirm / edit / delete

**Positive:** Candidate confirms a record → record's `verified` flag flips to true; edits a record → new version written with `source.kind: 'candidate-correction'`; deletes a record → soft-deleted, disappears from UI but retrievable via `includeDeleted: true`.

**Negative:** Editing a record with an empty value → rejected at route with `ValidationError`. Deleting a record twice → second delete is a no-op (idempotent).

---

### Positive-US-1.2.4 / Negative-US-1.2.4 — Done signal

**Positive:** After at least the Timeline curator has produced ≥1 record AND the candidate has reviewed it (either confirmed or edited), the UI shows a "Proceed to timeline review" call-to-action linking to Step 1.3.

**Negative:** If Timeline territory is empty (CV had no parseable roles), the UI shows a special empty-state: "No roles found — upload a more complete CV or add roles manually." It does NOT let the candidate proceed to Step 1.3.

---

## Tech-story tests

### Positive-TS-1.2.1 / Negative-TS-1.2.1 — CV text extraction

**Positive:** `extractCVText(uploadId)` on a sample PDF returns `{ text, sections, mimeType: 'application/pdf' }` with `text.length > 0`. Same for a DOCX and a plain-text file.

**Negative:** On a corrupt PDF (truncated), the extractor throws `framework.errors.ExternalServiceError` with a clear cause. No partial state written. `candidate.cv.parsed` event is NOT emitted.

---

### Positive-TS-1.2.2 / Negative-TS-1.2.2 — Curator dispatch

**Positive:** Emitting `candidate.cv.parsed` triggers the subscriber, which invokes `runAgent` for each CV-applicable curator in parallel. All `AgentRunResult.ok === true`. Trace ids propagate; every curator run's span shares the same parent trace id.

**Negative:** If one curator throws mid-run, the other curators' results are still persisted. The failing curator's error is recorded as a structured `framework.errors.ExternalServiceError` + emitted as `candidate.curator.failed` with `{ curatorId, cause }`.

---

### Positive-TS-1.2.3 / Negative-TS-1.2.3 — Curator writes + provenance

**Positive:** A curator run that outputs 3 records → 3 `framework.data.put` calls to its territory collection. Each record has a `source` field with `kind`, `uploadId`, `offsetStart`, `offsetEnd`, `quote`. Retrieving a record via `framework.data.get` returns the full shape.

**Negative:** A curator that tries to write a record without `source` → rejected at schema validation. The write fails and doesn't persist.

---

### Positive-TS-1.2.4 / Negative-TS-1.2.4 — Review UI

**Positive:** (page test) With intel records seeded across Timeline + Skills + Qualifications territories, rendering the extraction-review page groups them by territory with the correct counts. Source quotes are rendered per record.

**Negative:** With empty territories, the page renders with empty-state cards per territory (not crash, not hidden).

---

### Positive-TS-1.2.5 / Negative-TS-1.2.5 — Actions

**Positive:** POST `/api/candidate/intel/timeline/r1/confirm` → record's `verified: true` on next get. POST `/api/candidate/intel/timeline/r1/edit` with new value → new version with `source.kind: 'candidate-correction'`. DELETE → soft-deleted.

**Negative:** POST confirm on non-existent id → 404 with `NotFoundError`. POST edit with empty body → 400 with `ValidationError`. DELETE non-existent → 404 (not silent success).

---

## Feature tests

### Positive-F-1.2.1 / Negative-F-1.2.1 — Text extractor

(Covered by TS-1.2.1 tests.)

### Positive-F-1.2.2 / Negative-F-1.2.2 — Dispatch

(Covered by TS-1.2.2 tests.)

### Positive-F-1.2.3 / Negative-F-1.2.3 — Intel writing

(Covered by TS-1.2.3 tests.)

### Positive-F-1.2.4 / Negative-F-1.2.4 — Review UI

(Covered by TS-1.2.4 tests.)

### Positive-F-1.2.5 / Negative-F-1.2.5 — Actions

(Covered by TS-1.2.5 tests.)

---

## Cross-cutting checks

- **Provenance (X-US-1):** Every intel record in every territory has a valid `source` field with resolvable CV offset (or `kind: 'candidate-correction'` for user-edited records).
- **No re-asking (X-US-2):** Records confirmed in 1.2 are never re-asked; Step 1.4 (Oprah interview) doesn't re-probe topics already captured with high confidence from CV.
- **Framework-default (X-TS-1):** All data writes go through `framework.data.put`; all event emissions through `framework.events.bus.emit`; all agent runs through `framework.agents.runAgent`. No direct SDK calls.
- **Event discipline (X-TS-3):** `candidate.cv.parsed` and `candidate.curator.*` events follow envelope schema.
