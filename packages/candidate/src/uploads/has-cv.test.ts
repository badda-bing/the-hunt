// modules/candidate/lib/uploads/has-cv.test.ts
//
// TS-1.1.3 tests — entry-gate predicate.
// Paired with docs at modules/candidate/.design/phase-1-initialise/step-1.1-upload-cv/tests.md
//   §Positive-TS-1.1.3 / §Negative-TS-1.1.3

import { describe, it, expect } from 'vitest'
import { testHarness } from '@baddabing/framework/testing'
import { candidateModule } from '../manifest'
import { hasCV } from './has-cv'
import { DEFAULT_CANDIDATE_ID, type UploadMetadata } from './types'

function record(overrides: Partial<UploadMetadata> = {}): UploadMetadata {
  return {
    uploadId: 'upl-001',
    filename: 'cv.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    uploadedAt: '2026-04-19T10:00:00.000Z',
    candidateId: DEFAULT_CANDIDATE_ID,
    source: { kind: 'cv-upload', uploadId: 'upl-001' },
    ...overrides,
  }
}

describe('hasCV (TS-1.1.3)', () => {
  describe('positive', () => {
    it('returns true when at least one upload exists', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await h.store.put('uploads', 'upl-001', record())
      await expect(hasCV(h.store)).resolves.toBe(true)
    })

    it('returns true with multiple uploads from the same candidate', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await h.store.put('uploads', 'upl-001', record({ uploadId: 'upl-001' }))
      await h.store.put('uploads', 'upl-002', record({ uploadId: 'upl-002' }))
      await expect(hasCV(h.store)).resolves.toBe(true)
    })

    it('returns true for the specified candidateId only (not any other candidate)', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await h.store.put('uploads', 'upl-001', record({ candidateId: 'someone-else' }))
      await expect(hasCV(h.store)).resolves.toBe(false)
      await expect(hasCV(h.store, { candidateId: 'someone-else' })).resolves.toBe(true)
    })
  })

  describe('negative', () => {
    it('returns false when uploads collection is empty', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await expect(hasCV(h.store)).resolves.toBe(false)
    })

    it('returns false when the only upload is soft-deleted', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await h.store.put('uploads', 'upl-001', record())
      await h.store.delete('uploads', 'upl-001')
      await expect(hasCV(h.store)).resolves.toBe(false)
    })

    it('returns true if a soft-deleted upload is later restored', async () => {
      const h = await testHarness({ modules: [candidateModule] })
      await h.store.put('uploads', 'upl-001', record())
      await h.store.delete('uploads', 'upl-001')
      await h.store.restore('uploads', 'upl-001')
      await expect(hasCV(h.store)).resolves.toBe(true)
    })
  })
})
