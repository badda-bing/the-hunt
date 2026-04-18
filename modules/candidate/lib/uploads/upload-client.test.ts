// modules/candidate/lib/uploads/upload-client.test.ts
//
// F-1.1.1 (logic) tests — uploadCv client helper.
// The dropzone React component (UploadDropzone.tsx) is a thin UI layer;
// the POST logic lives here and is fully testable without DOM.

import { describe, it, expect } from 'vitest'
import { uploadCv } from './upload-client'

function makeFile(name = 'cv.pdf', type = 'application/pdf', bytes = 'hi'): File {
  return new File([bytes], name, { type })
}

function makeFetch(handler: (req: { endpoint: string; body: FormData }) => Response | Promise<Response>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const endpoint = typeof input === 'string' ? input : input.toString()
    const body = init!.body as FormData
    return handler({ endpoint, body })
  }) as typeof globalThis.fetch
}

describe('uploadCv (F-1.1.1 logic)', () => {
  describe('positive', () => {
    it('returns { ok: true, uploadId } on 200', async () => {
      const fetch = makeFetch(() =>
        new Response(JSON.stringify({ uploadId: 'upl-abc' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      const result = await uploadCv(makeFile(), { fetch })
      expect(result).toEqual({ ok: true, uploadId: 'upl-abc' })
    })

    it('POSTs multipart/form-data with the file in the `file` field', async () => {
      let received: { endpoint: string; file?: File } = { endpoint: '' }
      const fetch = makeFetch(({ endpoint, body }) => {
        received = { endpoint, file: body.get('file') as File }
        return new Response(JSON.stringify({ uploadId: 'upl-xyz' }), { status: 200 })
      })
      const file = makeFile('resume.pdf')
      await uploadCv(file, { fetch })
      expect(received.endpoint).toBe('/api/candidate/cv-upload')
      expect(received.file?.name).toBe('resume.pdf')
    })

    it('allows overriding the endpoint', async () => {
      let endpoint = ''
      const fetch = makeFetch((r) => {
        endpoint = r.endpoint
        return new Response(JSON.stringify({ uploadId: 'x' }), { status: 200 })
      })
      await uploadCv(makeFile(), { fetch, endpoint: '/alt/endpoint' })
      expect(endpoint).toBe('/alt/endpoint')
    })
  })

  describe('negative', () => {
    it('translates ValidationError (400) to an error result with type + message + recoveryHint', async () => {
      const fetch = makeFetch(() =>
        new Response(
          JSON.stringify({
            type: 'ValidationError',
            message: 'unsupported-format: image/png',
            recoveryHint: 'CV must be PDF, DOCX, or plain text.',
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      )
      const result = await uploadCv(makeFile('photo.png', 'image/png'), { fetch })
      expect(result).toEqual({
        ok: false,
        type: 'ValidationError',
        message: 'unsupported-format: image/png',
        recoveryHint: 'CV must be PDF, DOCX, or plain text.',
      })
    })

    it('returns NetworkError on fetch throw', async () => {
      const fetch = (async () => {
        throw new Error('offline')
      }) as typeof globalThis.fetch
      const result = await uploadCv(makeFile(), { fetch })
      expect(result).toEqual({
        ok: false,
        type: 'NetworkError',
        message: expect.stringContaining('offline'),
      })
    })

    it('handles non-JSON error response (status only)', async () => {
      const fetch = makeFetch(() => new Response('<html>500</html>', { status: 500 }))
      const result = await uploadCv(makeFile(), { fetch })
      expect(result).toEqual({
        ok: false,
        type: 'UnknownError',
        message: 'HTTP 500',
      })
    })
  })
})
