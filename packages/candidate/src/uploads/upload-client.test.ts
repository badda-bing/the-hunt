// packages/candidate/src/uploads/upload-client.test.ts
//
// F-1.1.1 (logic) tests — uploadCv client helper.
// The dropzone React component (UploadDropzone.tsx) is a thin UI layer;
// the POST logic lives here and is fully testable without DOM.
//
// Regression guard for Lesson L9 (upload 404): the CONTRACT tests at
// the bottom of this file assert that the client's default endpoint
// matches the server's mounted path derived from the same shared
// source of truth (manifest.basePath + paths.ts constant). Rule R2 —
// test the relationship, not the hand-typed string.

import { describe, it, expect } from 'vitest'
import { uploadCv, DEFAULT_UPLOAD_ENDPOINT } from './upload-client'
import { UPLOAD_ROUTE_PATH } from './paths.js'
import { candidateModule } from '../manifest.js'
import { routes } from '../routes.js'

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
      // Rule R2: assert the endpoint EQUALS THE DERIVED CONSTANT, not a
      // hand-typed string. If this test asserted a literal URL, it
      // could drift with the code silently (L9). Deriving from the
      // manifest + shared constant means any future refactor that
      // changes basePath or UPLOAD_ROUTE_PATH will still pass this
      // test as long as client + server keep agreeing.
      expect(received.endpoint).toBe(DEFAULT_UPLOAD_ENDPOINT)
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

// ---------------------------------------------------------------------
// Contract tests — regression guard for L9 (upload 404)
// ---------------------------------------------------------------------
//
// The bug we shipped: client and server each hand-typed their URL, the
// unit test asserted the client's string against itself, the strings
// were wrong + tests were green. Rule R2 says: test the RELATIONSHIP
// between the two sides, not the string.
//
// These tests assert that the client default endpoint, the shared
// UPLOAD_ROUTE_PATH constant, and the server route registration all
// agree. Any one of them drifting fails the build.

describe('upload URL contract (L9 regression guard)', () => {
  it('DEFAULT_UPLOAD_ENDPOINT is derived from manifest.basePath + UPLOAD_ROUTE_PATH', () => {
    // This is the ONE place where the derivation formula is canonical.
    // A reimplementation of the formula in the test keeps the derivation
    // honest: if someone silently changes upload-client.ts to hard-code a
    // string, this assertion flips red.
    const expected = `${candidateModule.basePath}/api${UPLOAD_ROUTE_PATH}`
    expect(DEFAULT_UPLOAD_ENDPOINT).toBe(expected)
  })

  it('routes.ts exports a POST handler at the shared UPLOAD_ROUTE_PATH key', () => {
    // If routes.ts drifts to a hand-typed key like 'POST /upload' while
    // UPLOAD_ROUTE_PATH changes, this assertion flips red — the two
    // sides must share the constant or the lookup fails.
    const expectedKey = `POST ${UPLOAD_ROUTE_PATH}`
    expect(routes[expectedKey]).toBeDefined()
    expect(typeof routes[expectedKey]).toBe('function')
  })

  it('client default endpoint and server route registration compose to the same full URL', () => {
    // End-to-end contract: given the module's basePath + the route
    // registration, the client default must hit exactly the path the
    // wrapper's generated route handler mounts.
    //   wrapper mounts at: <basePath>/api<routeKeyPath>
    //   client fetches:    DEFAULT_UPLOAD_ENDPOINT
    // These MUST be equal.
    const routeKey = Object.keys(routes).find((k) => k.startsWith('POST '))
    expect(routeKey).toBeDefined()
    const routeKeyPath = routeKey!.replace(/^POST /, '')
    const mountedUrl = `${candidateModule.basePath}/api${routeKeyPath}`
    expect(DEFAULT_UPLOAD_ENDPOINT).toBe(mountedUrl)
  })
})
