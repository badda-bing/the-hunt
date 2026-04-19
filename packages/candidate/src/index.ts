// packages/candidate/src/index.ts
//
// Candidate module public barrel. Wrappers import the manifest + any
// helpers the module chooses to expose. The module never renders UI —
// wrappers own presentation via the Contributions it declares.

export { candidateModule } from './manifest.js'
export type { CandidateManifest, CandidateEvents } from './manifest.js'
export { routes } from './routes.js'

// Domain types + utilities from Step 1.1 — re-exported so wrappers
// (and the UploadDropzone component in apps/hunt-full) can consume
// them without reaching into ./uploads/ directly.
export {
  ACCEPTED_CV_MIME_TYPES,
  MAX_CV_BYTES,
  DEFAULT_CANDIDATE_ID,
  CV_UPLOADED_EVENT_TYPE,
} from './uploads/types.js'
export type {
  AcceptedCvMimeType,
  UploadMetadata,
  CvUploadedEventPayload,
} from './uploads/types.js'

export { hasCV } from './uploads/has-cv.js'
export { acceptUpload } from './uploads/upload-service.js'
export type {
  AcceptUploadInput,
  AcceptUploadResult,
  UploadServiceDeps,
} from './uploads/upload-service.js'
export { createCvUploadedEmitter } from './uploads/events.js'
export { createDiskRawFileStore } from './uploads/raw-store.js'
export type { RawFileStore } from './uploads/raw-store.js'
export { uploadCv } from './uploads/upload-client.js'
export type { UploadCvResult } from './uploads/upload-client.js'
