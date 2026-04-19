# Step 1.1 — Tests

Every test has a positive case (happy path) and a negative case (failure mode / edge case). Tests colocate with their implementation files (`*.test.ts`).

---

## User-story tests

### Positive-US-1.1.1 / Negative-US-1.1.1 — Upload accepted

**Positive:** Given a valid PDF CV, when the candidate POSTs to `/api/candidate/cv-upload`, the response is 200 with `{ uploadId }`, the raw file is on disk at `candidate/uploads/<uploadId>/raw.pdf`, and the `uploads` collection has a metadata record with matching `uploadId`.

**Negative:** Given a duplicate upload of the same file in the same session, the second POST still produces a new `uploadId` (versioned, not rejected) — each upload is an independent event.

---

### Positive-US-1.1.2 / Negative-US-1.1.2 — Format rejection is specific

**Positive:** Given a PNG file uploaded to `/api/candidate/cv-upload`, the response is 4xx with a `ValidationError` JSON containing `{ reason: 'unsupported-format', received: 'image/png' }`. No file is written; no metadata record created; no event emitted.

**Negative:** Given a 25 MB PDF (above the 20 MB limit), the response is 4xx with `{ reason: 'too-large', received: 26214400 }`. No file written.

---

### Positive-US-1.1.3 / Negative-US-1.1.3 — Entry gate blocks navigation

**Positive:** Given the `uploads` collection is empty, when the candidate navigates to `/candidate`, the rendered page shows only the upload dropzone + a "please upload your CV to continue" message.

**Negative:** Given at least one successful upload exists, the `/candidate` page shows the full dashboard (not the upload-only gate).

---

## Tech-story tests

### Positive-TS-1.1.1 / Negative-TS-1.1.1 — `uploads` collection

**Positive:** At boot, `framework.data.getCollectionMetadata('uploads')` returns metadata with `kind: 'user'` + `ownerModule: 'candidate'`. `put` + `get` of an upload record round-trips.

**Negative:** Attempting to `purge('uploads', id)` refuses (per P5 — user collections can't be hard-deleted without explicit user-initiated flow). `put` of a record missing `uploadId` or `uploadedAt` rejects with a schema error.

---

### Positive-TS-1.1.2 / Negative-TS-1.1.2 — Upload route + storage + validation

**Positive:** A valid CV POST persists the raw file, writes the metadata record, and returns `{ uploadId }`. Raw file content on disk matches the posted payload byte-for-byte.

**Negative:** A POST with MIME `image/png` returns `framework.errors.ValidationError` with `details.reason === 'unsupported-format'`. A POST with size 25 MB returns `ValidationError` with `details.reason === 'too-large'`. A POST that fails mid-write (simulate fs error) does not leave partial files + does not write metadata.

---

### Positive-TS-1.1.3 / Negative-TS-1.1.3 — Entry gate

**Positive:** `hasCV()` returns `false` when `uploads` is empty; returns `true` after one successful upload. The candidate-page render branches on this.

**Negative:** `hasCV()` returns `false` even if there's an `uploads` record with `deletedAt` set (soft-deleted uploads don't count).

---

### Positive-TS-1.1.4 / Negative-TS-1.1.4 — Event emission

**Positive:** After a successful upload, `framework.events.bus` receives exactly one `candidate.cv.uploaded` event with envelope containing `{ uploadId, size, mimeType, candidateId }` and a valid correlation id (from the enclosing span).

**Negative:** On a validation failure, no `candidate.cv.uploaded` event is emitted. On a mid-write fs error, no event is emitted.

---

## Feature tests

### Positive-F-1.1.1 / Negative-F-1.1.1 — Upload dropzone

**Positive:** (component test) Rendering `<UploadDropzone onUploaded={fn} />` shows the dropzone. Dropping a valid file triggers the upload POST and calls `onUploaded(uploadId)` on 200.

**Negative:** Dropping a PNG shows the "unsupported format" alert; `onUploaded` is NOT called.

---

### Positive-F-1.1.2 / Negative-F-1.1.2 — API route

(Covered by TS-1.1.2 tests — Feature = Tech Story in this case; tests are the same assertions through the route boundary.)

---

### Positive-F-1.1.3 / Negative-F-1.1.3 — Entry gate render

**Positive:** (page test) Rendering `/candidate` with an empty uploads collection shows only the dropzone; no sidebar / no other nav.

**Negative:** After an upload lands, a re-render shows the full dashboard (not the gate).

---

### Positive-F-1.1.4 / Negative-F-1.1.4 — Validation

(Covered by TS-1.1.2 tests.)

---

## Cross-cutting checks

- **Provenance (vision X-US-1):** Every upload-metadata record has a `source` field set to `"cv-upload:<uploadId>"`. Verified in TS-1.1.1 positive tests.
- **Event discipline (vision X-TS-3):** `candidate.cv.uploaded` follows envelope schema with `id`, `type`, `ts`, `source`, `correlation`, `payload`, `meta`. Verified in TS-1.1.4 positive tests.
- **No custom where framework works (vision X-TS-1):** The upload route uses `framework.data.put`, not direct `fs` for metadata. Verified by absence of `fs` import in the route file except for the single raw-file write.
