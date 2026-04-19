// packages/candidate/src/client.ts
//
// Browser-safe subset of the candidate module's public surface. Client
// components (UploadDropzone.tsx etc.) import from
// `@the-hunt/candidate/client` rather than the main barrel — avoids
// pulling server-only transitive deps (nats, better-sqlite3) into the
// client bundle.
//
// The full module barrel (`@the-hunt/candidate`) remains the canonical
// import for server components, route handlers, and tests.

export { uploadCv } from './uploads/upload-client.js'
export type { UploadCvResult } from './uploads/upload-client.js'

// Types are pure TS — no runtime code reaches the bundle.
export type {
  UploadMetadata,
  AcceptedCvMimeType,
  CvUploadedEventPayload,
} from './uploads/types.js'
export {
  ACCEPTED_CV_MIME_TYPES,
  MAX_CV_BYTES,
  DEFAULT_CANDIDATE_ID,
  CV_UPLOADED_EVENT_TYPE,
} from './uploads/types.js'
