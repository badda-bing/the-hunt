// packages/candidate/src/routes.ts
//
// API route handlers this module exposes. The wrapper's
// generate-routes step reads this map and emits Next.js App Router
// route files at apps/hunt-full/app/candidate/api/<path>/route.ts.
//
// Handlers are built with `wrapRoute` from
// `@baddabing/framework/next` — body parsing, input validation, ctx
// injection, error translation, and correlation headers all flow
// through the primitive.

import { wrapRoute } from '@baddabing/framework/next'
import type { WrappedRoute } from '@baddabing/framework/next'
import { ValidationError } from '@baddabing/framework/errors'
import { withActivity } from '@baddabing/framework/activities'
import { acceptUpload } from './uploads/upload-service.js'
import { createDiskRawFileStore } from './uploads/raw-store.js'
import { createCvUploadedEmitter } from './uploads/events.js'
import type { AcceptUploadInput } from './uploads/upload-service.js'

/**
 * POST /upload — accept a CV file, validate MIME type + size, persist
 * the raw bytes + metadata, emit `candidate.cv.uploaded`. TS-1.1.2
 * end-to-end.
 */
const uploadRoute: WrappedRoute = wrapRoute<AcceptUploadInput, { uploadId: string }>({
  moduleId: 'candidate',
  input: {
    bodyKind: 'form-data',
    transform: async (form): Promise<AcceptUploadInput> => {
      const file = form.get('file')
      if (!file || typeof file === 'string') {
        throw new ValidationError('missing-file-field', {
          source: 'candidate.upload',
          recoveryHint: 'POST multipart/form-data with a `file` field.',
        })
      }
      return {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        bytes: new Uint8Array(await file.arrayBuffer()),
      }
    },
  },
  handler: async (ctx, input) => {
    // Wrap the upload in a framework activity so the
    // DefaultActivityPane can surface the in-flight work. `id` is
    // derived from the request's idempotency key if present, else
    // the correlation id — stable across retries, unique across
    // concurrent uploads. Module-level primitive; the wrapper owns
    // the UI (invariant P1).
    const activityId = `candidate.upload.${ctx.idempotencyKey ?? ctx.requestId}`
    const { uploadId } = await withActivity(
      {
        id: activityId,
        moduleId: 'candidate',
        kind: 'upload',
        label: `Uploading ${input.filename}`,
        estimatedSeconds: 3,
      },
      async (activity) => {
        activity.progress(20, 'Validating')
        const result = await acceptUpload(
          {
            store: ctx.data('candidate'),
            rawStore: createDiskRawFileStore(),
            onSuccess: createCvUploadedEmitter(ctx.bus),
          },
          input,
        )
        activity.progress(90, 'Finalising')
        return result
      },
    )
    return { uploadId }
  },
})

export const routes: Record<string, WrappedRoute> = {
  'POST /upload': uploadRoute,
}
