// modules/candidate/lib/uploads/types.ts
//
// Metadata shape persisted in the `uploads` collection.
// Every successful CV upload creates a record of this shape.
//
// The `uploads` collection is declared `kind: 'user'` (P5 — user data is
// sacrosanct, cannot be auto-purged). The raw CV file lives separately
// on disk at `candidate/uploads/<uploadId>/raw.<ext>`; this record is
// the authoritative metadata pointer.

export interface UploadMetadata {
  /** ULID assigned at upload time; directory name + record key. */
  uploadId: string

  /** Original filename as provided by the client. */
  filename: string

  /** Validated MIME type — must be one of ACCEPTED_CV_MIME_TYPES. */
  mimeType: AcceptedCvMimeType

  /** File size in bytes. Must be <= MAX_CV_BYTES at upload time. */
  size: number

  /** ISO-8601 timestamp of when the upload was accepted. */
  uploadedAt: string

  /** The candidate this upload belongs to. Today: the singleton 'cand-default'. */
  candidateId: string

  /**
   * Provenance marker. Per the vision's provenance commitment, every
   * record in the module cites its source. An upload record's source is
   * itself — the raw CV is the root of provenance, and downstream intel
   * records cite back to sections within this upload.
   */
  source: {
    kind: 'cv-upload'
    uploadId: string
  }
}

/** MIME types accepted by the upload route. */
export const ACCEPTED_CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const

export type AcceptedCvMimeType = (typeof ACCEPTED_CV_MIME_TYPES)[number]

/** Max CV size in bytes (20 MB). */
export const MAX_CV_BYTES = 20 * 1024 * 1024

/** Default candidate id. Phase 1 is single-candidate; multi-candidate is deferred. */
export const DEFAULT_CANDIDATE_ID = 'cand-default'

/**
 * Event type emitted on successful upload (TS-1.1.4).
 * Follows framework's M2 rule: `<module>.<subject>.<verb>`.
 */
export const CV_UPLOADED_EVENT_TYPE = 'candidate.cv.uploaded' as const

export interface CvUploadedEventPayload {
  uploadId: string
  candidateId: string
  size: number
  mimeType: AcceptedCvMimeType
}
