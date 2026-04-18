// app/api/candidate/cv-upload/route.ts
//
// TS-1.1.2 route handler. Thin wrapper over acceptUpload: parses
// multipart/form-data, extracts the file, delegates to the service,
// translates structured errors to HTTP responses.

import { NextResponse } from 'next/server'
import { getFrameworkData } from '@baddabing/framework/data'
import { StructuredError, ValidationError } from '@baddabing/framework/errors'
import { acceptUpload } from '@/modules/candidate/lib/uploads/upload-service'
import { createDiskRawFileStore } from '@/modules/candidate/lib/uploads/raw-store'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      throw new ValidationError('missing-file-field', {
        source: 'candidate.upload',
        recoveryHint: 'POST multipart/form-data with a `file` field.',
      })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const result = await acceptUpload(
      {
        store: getFrameworkData('candidate'),
        rawStore: createDiskRawFileStore(),
      },
      {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        bytes,
      },
    )

    return NextResponse.json({ uploadId: result.uploadId })
  } catch (err) {
    if (err instanceof StructuredError) {
      const status = err.type === 'ValidationError' ? 400 : 500
      return NextResponse.json(err.toJSON(), { status })
    }
    return NextResponse.json(
      { type: 'InternalError', message: String(err) },
      { status: 500 },
    )
  }
}
