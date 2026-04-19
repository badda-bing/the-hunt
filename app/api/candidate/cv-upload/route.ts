// app/api/candidate/cv-upload/route.ts
//
// TS-1.1.2 route handler, rewritten onto framework.next.wrapRoute (M2/PR 5).
// Body parsing, error translation, ctx injection, and response shaping all
// flow through the framework primitive — this file now carries only the
// file-extraction transform + the acceptUpload call.

import { wrapRoute } from '@baddabing/framework/next'
import { ValidationError } from '@baddabing/framework/errors'
import { acceptUpload } from '@/modules/candidate/lib/uploads/upload-service'
import { createDiskRawFileStore } from '@/modules/candidate/lib/uploads/raw-store'
import { createCvUploadedEmitter } from '@/modules/candidate/lib/uploads/events'
import type { AcceptUploadInput } from '@/modules/candidate/lib/uploads/upload-service'

export const runtime = 'nodejs'

export const POST = wrapRoute<AcceptUploadInput, { uploadId: string }>({
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
    const { uploadId } = await acceptUpload(
      {
        store: ctx.data('candidate'),
        rawStore: createDiskRawFileStore(),
        onSuccess: createCvUploadedEmitter(ctx.bus),
      },
      input,
    )
    return { uploadId }
  },
})
