// modules/candidate/lib/uploads/upload-service.ts
//
// TS-1.1.2 — accepts a CV upload. Validates format + size, persists the
// raw file, writes metadata. TS-1.1.4 wires the event emission via the
// `onSuccess` hook.
//
// Pure business logic — no Next.js / HTTP specifics. The route handler
// at app/api/candidate/cv-upload/route.ts is a thin wrapper that parses
// form-data and delegates here.

import { ValidationError, ExternalServiceError } from '@baddabing/framework/errors'
import type { IDataStore } from '@baddabing/framework/data'
import {
  ACCEPTED_CV_MIME_TYPES,
  MAX_CV_BYTES,
  DEFAULT_CANDIDATE_ID,
  type AcceptedCvMimeType,
  type UploadMetadata,
} from './types'
import type { RawFileStore } from './raw-store'

export interface UploadServiceDeps {
  store: IDataStore
  rawStore: RawFileStore
  /** Current time; test-injectable. Defaults to Date.now. */
  clock?: () => Date
  /** Upload id generator; test-injectable. Defaults to crypto.randomUUID. */
  idGen?: () => string
  /**
   * Optional hook called after a successful upload completes (metadata
   * written, raw file on disk). TS-1.1.4 wires the event bus here.
   * Not awaited — keeps the upload path fast; failures are logged but
   * don't fail the upload.
   */
  onSuccess?: (record: UploadMetadata) => void | Promise<void>
}

export interface AcceptUploadInput {
  filename: string
  mimeType: string
  size: number
  bytes: Uint8Array
  candidateId?: string
}

export interface AcceptUploadResult {
  uploadId: string
  record: UploadMetadata
}

export async function acceptUpload(
  deps: UploadServiceDeps,
  input: AcceptUploadInput,
): Promise<AcceptUploadResult> {
  // Format validation
  if (
    !(ACCEPTED_CV_MIME_TYPES as readonly string[]).includes(input.mimeType)
  ) {
    throw new ValidationError(
      `unsupported-format: ${input.mimeType}`,
      {
        source: 'candidate.upload',
        recoveryHint: `CV must be one of: ${ACCEPTED_CV_MIME_TYPES.join(', ')}`,
      },
    )
  }

  // Size validation
  if (input.size > MAX_CV_BYTES) {
    throw new ValidationError(
      `too-large: ${input.size}`,
      {
        source: 'candidate.upload',
        recoveryHint: `CV must be at most ${MAX_CV_BYTES} bytes (${MAX_CV_BYTES / 1024 / 1024} MB)`,
      },
    )
  }

  const clock = deps.clock ?? (() => new Date())
  const idGen = deps.idGen ?? (() => globalThis.crypto.randomUUID())

  const mimeType = input.mimeType as AcceptedCvMimeType
  const uploadId = idGen()
  const extension = extensionFor(mimeType)

  // Persist raw file first — if filesystem fails, nothing is written to
  // the data store, so partial state is impossible.
  try {
    await deps.rawStore.persist(uploadId, extension, input.bytes)
  } catch (cause) {
    throw new ExternalServiceError(
      `raw-file-write-failed: ${uploadId}`,
      { source: 'candidate.upload', causedBy: cause },
    )
  }

  const record: UploadMetadata = {
    uploadId,
    filename: input.filename,
    mimeType,
    size: input.size,
    uploadedAt: clock().toISOString(),
    candidateId: input.candidateId ?? DEFAULT_CANDIDATE_ID,
    source: { kind: 'cv-upload', uploadId },
  }
  await deps.store.put<UploadMetadata>('uploads', uploadId, record)

  if (deps.onSuccess) {
    try {
      await deps.onSuccess(record)
    } catch {
      // Swallow — onSuccess failures (e.g., event bus) should not fail
      // an upload. Upstream subscribers will reconcile on the next event.
    }
  }

  return { uploadId, record }
}

function extensionFor(mimeType: AcceptedCvMimeType): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx'
    case 'text/plain':
      return 'txt'
  }
}
