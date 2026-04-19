# Step 1.1 — Features

## F-1.1.1 — Upload dropzone component

Concrete, built UI capability.

### Shape
- React component at `modules/candidate/components/upload/UploadDropzone.tsx`
- Accepts `onUploaded(uploadId)` callback
- Drag-and-drop zone + manual "browse" button
- Shows progress during upload
- Shows success / error state after

### Built from
- Tech stories: TS-1.1.2 (posts to the upload route), TS-1.1.4 (reacts to success event)
- Framework primitives: `framework.ui.Card`, `framework.ui.Button`, `framework.ui.Alert`, `framework.ui.Spinner`

### Tests
see `tests.md` §Positive-F-1.1.1 / §Negative-F-1.1.1

---

## F-1.1.2 — Upload API route

### Shape
- `app/api/candidate/cv-upload/route.ts` — POST handler
- Accepts `multipart/form-data` with a single file field
- Returns `{ uploadId }` on success, classified error JSON on failure
- Wraps `framework.errors.wrap` for consistent error shape

### Built from
- Tech stories: TS-1.1.2 (validation + storage), TS-1.1.4 (event emission)
- Framework primitives: `framework.data.put`, `framework.errors.*`, `framework.events.bus.emit`

### Tests
see `tests.md` §Positive-F-1.1.2 / §Negative-F-1.1.2

---

## F-1.1.3 — Entry-gate render logic

### Shape
- At the top of `app/candidate/page.tsx`: if no upload exists, render only the upload dropzone (F-1.1.1) and a brief explanation
- All other module navigation is hidden until `hasCV()` returns true

### Built from
- Tech story: TS-1.1.3
- Framework primitives: `framework.data.list` (to check uploads), `framework.ui.EmptyState`

### Tests
see `tests.md` §Positive-F-1.1.3 / §Negative-F-1.1.3

---

## F-1.1.4 — Format + size validation

### Shape
- Server-side validation in the upload route (TS-1.1.2)
- Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`
- Max size: 20 MB (20 * 1024 * 1024 bytes)
- Rejection returns `ValidationError` with `details: { reason: 'unsupported-format' | 'too-large', received: <mime or size> }`

### Built from
- Tech story: TS-1.1.2
- Framework primitives: `framework.errors.create('ValidationError', ...)`

### Tests
see `tests.md` §Positive-F-1.1.4 / §Negative-F-1.1.4
