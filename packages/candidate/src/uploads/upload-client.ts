// modules/candidate/lib/uploads/upload-client.ts
//
// Browser-side helper that POSTs a File to /api/candidate/cv-upload.
// Extracted from the React component so the submit flow is unit-testable
// without a DOM test harness.

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
  /** API endpoint — defaults to /api/candidate/cv-upload. */
  endpoint?: string
}

export async function uploadCv(
  file: File,
  deps: UploadCvDeps = {},
): Promise<UploadCvResult> {
  const doFetch = deps.fetch ?? globalThis.fetch
  const endpoint = deps.endpoint ?? '/api/candidate/cv-upload'

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
