// modules/candidate/lib/uploads/events.test.ts
//
// TS-1.1.4 tests — candidate.cv.uploaded event emission.
// Paired with docs at modules/candidate/.design/phase-1-initialise/step-1.1-upload-cv/tests.md
//   §Positive-TS-1.1.4 / §Negative-TS-1.1.4

import { describe, it, expect } from 'vitest'
import { ValidationError } from '@baddabing/framework/errors'
import { testHarness } from '@baddabing/framework/testing'
import { candidateModule } from '../../manifest'
import { acceptUpload } from './upload-service'
import { createCvUploadedEmitter } from './events'
import { CV_UPLOADED_EVENT_TYPE, type UploadMetadata } from './types'
import type { RawFileStore } from './raw-store'

function makeFakeRawStore(): RawFileStore {
  return { async persist() { return '/mock/path' } }
}

describe('candidate.cv.uploaded event emission (TS-1.1.4)', () => {
  describe('positive', () => {
    it('emits exactly one candidate.cv.uploaded on successful upload', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await acceptUpload(
        {
          store: h.store,
          rawStore: makeFakeRawStore(),
          clock: () => new Date('2026-04-19T10:00:00Z'),
          idGen: () => 'upl-e-001',
          onSuccess: createCvUploadedEmitter(h.bus),
        },
        {
          filename: 'cv.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        },
      )

      const emissions = h.bus.emissionsOfType(CV_UPLOADED_EVENT_TYPE)
      expect(emissions).toHaveLength(1)
    })

    it('envelope carries the standard fields (id/type/ts/source/payload)', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await acceptUpload(
        {
          store: h.store,
          rawStore: makeFakeRawStore(),
          clock: () => new Date('2026-04-19T10:00:00Z'),
          idGen: () => 'upl-e-002',
          onSuccess: createCvUploadedEmitter(h.bus),
        },
        {
          filename: 'cv.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048,
          bytes: new Uint8Array([0x50, 0x4b]),
        },
      )

      const env = h.bus.emissionsOfType(CV_UPLOADED_EVENT_TYPE)[0]
      expect(env.id).toBeTruthy()
      expect(env.type).toBe(CV_UPLOADED_EVENT_TYPE)
      expect(env.ts).toBeTruthy()
      expect(env.source).toBe('candidate.upload')
      expect(env.payload).toEqual({
        uploadId: 'upl-e-002',
        candidateId: 'cand-default',
        size: 2048,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    })

    it('meta carries filename + uploadedAt for downstream subscribers', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await acceptUpload(
        {
          store: h.store,
          rawStore: makeFakeRawStore(),
          clock: () => new Date('2026-04-19T10:00:00Z'),
          idGen: () => 'upl-e-003',
          onSuccess: createCvUploadedEmitter(h.bus),
        },
        {
          filename: 'jane-cv.pdf',
          mimeType: 'application/pdf',
          size: 100,
          bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        },
      )
      const env = h.bus.emissionsOfType(CV_UPLOADED_EVENT_TYPE)[0]
      expect(env.meta).toMatchObject({
        filename: 'jane-cv.pdf',
        uploadedAt: '2026-04-19T10:00:00.000Z',
      })
    })
  })

  describe('negative', () => {
    it('does NOT emit on validation failure (unsupported format)', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await expect(
        acceptUpload(
          {
            store: h.store,
            rawStore: makeFakeRawStore(),
            clock: () => new Date(),
            idGen: () => 'upl-e-fail',
            onSuccess: createCvUploadedEmitter(h.bus),
          },
          {
            filename: 'photo.png',
            mimeType: 'image/png',
            size: 200,
            bytes: new Uint8Array([0x89, 0x50]),
          },
        ),
      ).rejects.toBeInstanceOf(ValidationError)

      expect(h.bus.emissionsOfType(CV_UPLOADED_EVENT_TYPE)).toHaveLength(0)
    })

    it('does NOT emit on raw-store failure (no metadata persisted)', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await expect(
        acceptUpload(
          {
            store: h.store,
            rawStore: { async persist() { throw new Error('disk full') } },
            clock: () => new Date(),
            idGen: () => 'upl-e-fail-2',
            onSuccess: createCvUploadedEmitter(h.bus),
          },
          {
            filename: 'cv.pdf',
            mimeType: 'application/pdf',
            size: 100,
            bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
          },
        ),
      ).rejects.toThrow()

      expect(h.bus.emissionsOfType(CV_UPLOADED_EVENT_TYPE)).toHaveLength(0)
    })
  })
})
