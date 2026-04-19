// modules/candidate/lib/uploads/has-cv.ts
//
// TS-1.1.3 — entry-gate predicate.
//
// Returns true iff at least one non-deleted upload exists for the given
// candidate. The candidate dashboard uses this to decide whether to
// show the upload door (only) vs the full module.

import type { IDataStore } from '@baddabing/framework/data'
import { DEFAULT_CANDIDATE_ID, type UploadMetadata } from './types'

export interface HasCvOptions {
  /** Restrict to a specific candidate. Defaults to DEFAULT_CANDIDATE_ID. */
  candidateId?: string
}

export async function hasCV(
  store: IDataStore,
  opts: HasCvOptions = {},
): Promise<boolean> {
  const target = opts.candidateId ?? DEFAULT_CANDIDATE_ID
  const records = await store.list<UploadMetadata>('uploads')
  return records.some((r) => r.candidateId === target)
}
