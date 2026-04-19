// modules/candidate/lib/uploads/upload-service.test.ts
//
// TS-1.1.2 tests — upload-service validation + storage paths.
// Paired with docs at modules/candidate/.design/phase-1-initialise/step-1.1-upload-cv/tests.md
//   §Positive-TS-1.1.2 / §Negative-TS-1.1.2

import { describe, it, expect } from 'vitest'
import { ValidationError, ExternalServiceError } from '@baddabing/framework/errors'
import { testHarness } from '@baddabing/framework/testing'
import { candidateModule } from '../../manifest'
import { acceptUpload, type UploadServiceDeps } from './upload-service'
import type { RawFileStore } from './raw-store'
import {
  ACCEPTED_CV_MIME_TYPES,
  MAX_CV_BYTES,
  DEFAULT_CANDIDATE_ID,
  type UploadMetadata,
} from './types'

function makeFakeRawStore(): RawFileStore & {
  calls: Array<{ uploadId: string; extension: string; bytes: Uint8Array }>
} {
  const calls: Array<{ uploadId: string; extension: string; bytes: Uint8Array }> = []
  return {
    calls,
    async persist(uploadId, extension, bytes) {
      calls.push({ uploadId, extension, bytes })
      return `/mock/${uploadId}/raw.${extension}`
    },
  }
}

function makeFailingRawStore(): RawFileStore {
  return {
    async persist() {
      throw new Error('disk full')
    },
  }
}

async function deps(opts: Partial<UploadServiceDeps> = {}): Promise<UploadServiceDeps> {
  const h = await testHarness({ modules: [candidateModule] })
  return {
    store: h.store,
    rawStore: makeFakeRawStore(),
    clock: () => new Date('2026-04-19T10:00:00Z'),
    idGen: () => 'upl-test-001',
    ...opts,
  }
}

describe('acceptUpload (TS-1.1.2)', () => {
  describe('positive', () => {
    it('accepts a valid PDF CV: writes raw + metadata, returns uploadId', async () => {
      const rawStore = makeFakeRawStore()
      const d = await deps({ rawStore })
      const result = await acceptUpload(d, {
        filename: 'cv.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
      })

      expect(result.uploadId).toBe('upl-test-001')
      expect(rawStore.calls).toHaveLength(1)
      expect(rawStore.calls[0]).toMatchObject({
        uploadId: 'upl-test-001',
        extension: 'pdf',
      })

      const stored = await d.store.get<UploadMetadata>('uploads', 'upl-test-001')
      expect(stored).toMatchObject({
        uploadId: 'upl-test-001',
        filename: 'cv.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        candidateId: DEFAULT_CANDIDATE_ID,
        source: { kind: 'cv-upload', uploadId: 'upl-test-001' },
      })
    })

    it('accepts DOCX (extension mapping correct)', async () => {
      const rawStore = makeFakeRawStore()
      const d = await deps({ rawStore })
      await acceptUpload(d, {
        filename: 'cv.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
        bytes: new Uint8Array([0x50, 0x4b]), // PK (zip header)
      })
      expect(rawStore.calls[0].extension).toBe('docx')
    })

    it('accepts plain text (extension mapping correct)', async () => {
      const rawStore = makeFakeRawStore()
      const d = await deps({ rawStore })
      await acceptUpload(d, {
        filename: 'cv.txt',
        mimeType: 'text/plain',
        size: 100,
        bytes: new TextEncoder().encode('Jane Doe — Engineer'),
      })
      expect(rawStore.calls[0].extension).toBe('txt')
    })

    it('calls onSuccess hook after metadata is persisted', async () => {
      const received: UploadMetadata[] = []
      const d = await deps({
        onSuccess: (r) => {
          received.push(r)
        },
      })
      await acceptUpload(d, {
        filename: 'cv.pdf',
        mimeType: 'application/pdf',
        size: 500,
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      })
      expect(received).toHaveLength(1)
      expect(received[0].uploadId).toBe('upl-test-001')
    })
  })

  describe('negative', () => {
    it('rejects unsupported MIME type with ValidationError', async () => {
      const d = await deps()
      await expect(
        acceptUpload(d, {
          filename: 'photo.png',
          mimeType: 'image/png',
          size: 500,
          bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
        }),
      ).rejects.toBeInstanceOf(ValidationError)

      // No file written, no metadata persisted.
      const rawStore = d.rawStore as ReturnType<typeof makeFakeRawStore>
      expect(rawStore.calls).toHaveLength(0)
      const ids = await d.store.listIds('uploads')
      expect(ids).toHaveLength(0)
    })

    it('rejects oversize file with ValidationError', async () => {
      const d = await deps()
      await expect(
        acceptUpload(d, {
          filename: 'huge.pdf',
          mimeType: 'application/pdf',
          size: MAX_CV_BYTES + 1,
          bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        }),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('classifies raw-file-write failures as ExternalServiceError + does not persist metadata', async () => {
      const d = await deps({ rawStore: makeFailingRawStore() })
      await expect(
        acceptUpload(d, {
          filename: 'cv.pdf',
          mimeType: 'application/pdf',
          size: 100,
          bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        }),
      ).rejects.toBeInstanceOf(ExternalServiceError)

      const ids = await d.store.listIds('uploads')
      expect(ids).toHaveLength(0)
    })

    it('errors from onSuccess hook do NOT fail the upload', async () => {
      const d = await deps({
        onSuccess: () => {
          throw new Error('subscriber blew up')
        },
      })
      const result = await acceptUpload(d, {
        filename: 'cv.pdf',
        mimeType: 'application/pdf',
        size: 100,
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      })
      expect(result.uploadId).toBe('upl-test-001')
      // Metadata still persisted despite onSuccess failure.
      const stored = await d.store.get('uploads', 'upl-test-001')
      expect(stored).not.toBeNull()
    })

    it('ValidationError messages encode the reason + received value', async () => {
      const d = await deps()
      await expect(
        acceptUpload(d, {
          filename: 'x.png',
          mimeType: 'image/png',
          size: 100,
          bytes: new Uint8Array(),
        }),
      ).rejects.toThrow(/unsupported-format: image\/png/)

      await expect(
        acceptUpload(d, {
          filename: 'x.pdf',
          mimeType: 'application/pdf',
          size: MAX_CV_BYTES + 100,
          bytes: new Uint8Array(),
        }),
      ).rejects.toThrow(/too-large: \d+/)
    })
  })
})
