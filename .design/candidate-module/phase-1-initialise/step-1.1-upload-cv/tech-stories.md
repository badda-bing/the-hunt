# Step 1.1 — Tech stories

## TS-1.1.1 — `uploads` collection registered

### Scope
Register the `uploads` collection (kind: `user`, P5-protected) in the candidate module's manifest via `framework.data`. Define the metadata record shape.

### Framework surfaces used
- `framework.data` (`IDataStore`) — collection registration + put/get of upload metadata
- `framework.lifecycle` — manifest registration at boot

### Custom work
- Collection declaration in `modules/candidate/manifest.ts` (add `{ id: 'uploads', kind: 'user' }` to `collections`)
- Upload metadata record TypeScript type: `{ uploadId: string, filename: string, mimeType: string, size: number, uploadedAt: ISODate, candidateId: string }`

### Cherry-pick from old Hunt
- `modules/candidate/manifest.ts` — collections declaration pattern
- `modules/candidate/lib/data.ts` — `getUploadSet()`, `saveUploadSet()` shape (simplified for v2 CV-only)

### Tests
see `tests.md` §Positive-TS-1.1.1 / §Negative-TS-1.1.1

---

## TS-1.1.2 — Upload route + raw file storage + format/size validation

### Scope
POST route that accepts a CV file, validates format + size, persists raw file to disk + metadata to `framework.data`, returns the new `uploadId`. Rejects with classified error on bad input.

### Framework surfaces used
- `framework.data` — metadata write via `put('uploads', uploadId, record)`
- `framework.errors` — `framework.errors.create('ValidationError', ...)` for bad format / bad size; `framework.errors.wrap(fn)` at route boundary
- `framework.events.bus` — (coordinated in TS-1.1.4)

### Custom work
- POST `/api/candidate/cv-upload/route.ts` — thin handler, wraps `framework.errors.wrap`
- Raw file persist to `candidate/uploads/<uploadId>/raw.<ext>` (use `fs/promises` + `framework.utils.json`-style safe-write pattern — the one file-system write in this story)
- Format check: MIME must be `application/pdf` / `application/vnd.openxmlformats-officedocument.wordprocessingml.document` / `text/plain`
- Size check: reject above 20 MB
- Error classification: `ValidationError` for both checks

### Cherry-pick from old Hunt
- `app/api/upload/route.ts` — validation + save pattern (simplify: no classifier, CV only)
- File-path convention `candidate/uploads/<uploadId>/raw.<ext>` — directly from old Hunt

### Tests
see `tests.md` §Positive-TS-1.1.2 / §Negative-TS-1.1.2

---

## TS-1.1.3 — Entry gate: no CV → show only upload door

### Scope
Module navigation is gated on whether any successful CV upload exists. If the `uploads` collection is empty, the dashboard shows only the upload screen; all other navigation surfaces are hidden or disabled.

### Framework surfaces used
- `framework.data` — `list('uploads')` or `exists()` check
- `framework.ui` — conditional layout primitives

### Custom work
- `hasCV()` check helper in module code (reads framework.data)
- Conditional render logic in the candidate dashboard page (`app/candidate/page.tsx`) — early-return the upload screen when `!hasCV()`

### Cherry-pick from old Hunt
- `app/candidate/page.tsx` — the "show upload zone when no profile" pattern (conditional on `!hasProfile`)

### Tests
see `tests.md` §Positive-TS-1.1.3 / §Negative-TS-1.1.3

---

## TS-1.1.4 — Emit `candidate.cv.uploaded` event on success

### Scope
When an upload lands successfully, emit a typed event on `framework.events.bus` with the standard envelope. Downstream subscribers (TS-2 in Step 1.2) react to this event.

### Framework surfaces used
- `framework.events.bus` — `bus.emit(envelope)`
- `framework.observability.span` — correlation for the upload flow

### Custom work
- Event type: `candidate.cv.uploaded`
- Envelope payload: `{ uploadId, size, mimeType, candidateId }`
- Emit at the end of the upload route handler, inside a span

### Cherry-pick from old Hunt
- Old Hunt's upload emissions (loosely) — simplified for v2 envelope shape

### Tests
see `tests.md` §Positive-TS-1.1.4 / §Negative-TS-1.1.4
