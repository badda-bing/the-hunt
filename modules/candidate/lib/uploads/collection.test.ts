// modules/candidate/lib/uploads/collection.test.ts
//
// TS-1.1.1 — tests for the `uploads` collection registration + metadata round-trip.
// Paired with docs at modules/candidate/.design/phase-1-initialise/step-1.1-upload-cv/tests.md
//   §Positive-TS-1.1.1 / §Negative-TS-1.1.1

import { describe, it, expect } from 'vitest'
import { candidateTestHarness } from '../test-helpers.js'
import {
  DEFAULT_CANDIDATE_ID,
  type UploadMetadata,
} from './types.js'

function validMetadata(overrides: Partial<UploadMetadata> = {}): UploadMetadata {
  return {
    uploadId: 'upl-test-001',
    filename: 'cv.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    uploadedAt: '2026-04-19T10:00:00.000Z',
    candidateId: DEFAULT_CANDIDATE_ID,
    source: { kind: 'cv-upload', uploadId: 'upl-test-001' },
    ...overrides,
  }
}

describe('uploads collection (TS-1.1.1)', () => {
  describe('positive', () => {
    it('registers the `uploads` collection with kind: user', async () => {
      const h = await candidateTestHarness()
      const meta = h.store.getCollectionMetadata('uploads')
      expect(meta).not.toBeNull()
      expect(meta?.id).toBe('uploads')
      expect(meta?.kind).toBe('user')
    })

    it('round-trips an UploadMetadata record via framework.data', async () => {
      const h = await candidateTestHarness()
      const record = validMetadata()
      await h.store.put('uploads', record.uploadId, record)

      const got = await h.store.get<UploadMetadata>('uploads', record.uploadId)
      expect(got).toEqual(record)
    })

    it('re-uploads produce new versions (each put advances the version)', async () => {
      const h = await candidateTestHarness()
      // Two uploads for the same candidateId — each gets a distinct uploadId.
      await h.store.put('uploads', 'upl-001', validMetadata({ uploadId: 'upl-001' }))
      await h.store.put('uploads', 'upl-002', validMetadata({ uploadId: 'upl-002' }))

      const ids = await h.store.listIds('uploads')
      expect(ids).toEqual(expect.arrayContaining(['upl-001', 'upl-002']))
      expect(ids).toHaveLength(2)
    })
  })

  describe('negative', () => {
    it('refuses to purge a user-kind uploads record (P5)', async () => {
      const h = await candidateTestHarness()
      await h.store.put('uploads', 'upl-001', validMetadata({ uploadId: 'upl-001' }))
      await h.store.delete('uploads', 'upl-001')

      // P5: user-kind collections cannot be hard-deleted even with force.
      await expect(
        h.store.purge('uploads', 'upl-001', { force: true }),
      ).rejects.toThrow()
    })

    it('soft-deleted uploads do not appear in listIds without includeDeleted', async () => {
      const h = await candidateTestHarness()
      await h.store.put('uploads', 'upl-001', validMetadata({ uploadId: 'upl-001' }))
      await h.store.delete('uploads', 'upl-001')

      const live = await h.store.listIds('uploads')
      expect(live).not.toContain('upl-001')

      const all = await h.store.listIds('uploads', { includeDeleted: true })
      expect(all).toContain('upl-001')
    })
  })
})
