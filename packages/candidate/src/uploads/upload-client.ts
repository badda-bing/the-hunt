// packages/candidate/src/uploads/upload-client.ts
//
// Browser-side helper that POSTs a File to the candidate module's
// upload route. Extracted from the React component so the submit
// flow is unit-testable without a DOM test harness.
//
// The default endpoint is DERIVED from the manifest's `basePath` +
// the shared `UPLOAD_ROUTE_PATH` constant, so changing the server-
// side route path automatically updates the client default. This
// closes the bug class where a hand-maintained URL on the client
// drifts out of sync with the server route (cf. the 404 we shipped
// during M6 because client + server were on different strings).
//
// Wrappers that mount the handler elsewhere can still override via
// `{ endpoint: '/…' }`.

export interface UploadCvSuccess {
  ok: true
  uploadId: string
}

export interface UploadCvError {
  ok: false
  type: string
  message: string
  recoveryHint?: string
}

export type UploadCvResult = UploadCvSuccess | UploadCvError

export interface UploadCvDeps {
  /** Injectable fetch — defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch
  /**
   * API endpoint — defaults to the value derived from the candidate
   * manifest's `basePath` + the shared `UPLOAD_ROUTE_PATH` constant.
   * Override only when a wrapper mounts the handler elsewhere.
   */
  endpoint?: string
}

import { candidateModule } from '../manifest.js'
import { UPLOAD_ROUTE_PATH } from './paths.js'

/**
 * Default endpoint computed from the manifest + shared constants.
 * Exported so tests can assert the derivation contract directly
 * (Rule R2: test the contract, not the code you just wrote).
 */
export const DEFAULT_UPLOAD_ENDPOINT: string =
  `${candidateModule.basePath}/api${UPLOAD_ROUTE_PATH}`

export async function uploadCv(
  file: File,
  deps: UploadCvDeps = {},
): Promise<UploadCvResult> {
  const doFetch = deps.fetch ?? globalThis.fetch
  const endpoint = deps.endpoint ?? DEFAULT_UPLOAD_ENDPOINT

  const body = new FormData()
  body.append('file', file)

  let res: Response
  try {
    res = await doFetch(endpoint, { method: 'POST', body })
  } catch (cause) {
    return {
      ok: false,
      type: 'NetworkError',
      message: `upload failed: ${(cause as Error).message}`,
    }
  }

  if (res.ok) {
    const json = (await res.json()) as { uploadId: string }
    return { ok: true, uploadId: json.uploadId }
  }

  try {
    const err = (await res.json()) as {
      type?: string
      message?: string
      recoveryHint?: string
    }
    return {
      ok: false,
      type: err.type ?? 'UnknownError',
      message: err.message ?? `HTTP ${res.status}`,
      recoveryHint: err.recoveryHint,
    }
  } catch {
    return {
      ok: false,
      type: 'UnknownError',
      message: `HTTP ${res.status}`,
    }
  }
}
