// modules/candidate/manifest.ts
//
// Module manifest for the Candidate module. Declares the module's data
// collections, agents, personas, and lifecycle hooks. Hand-edited as the
// module evolves (collections added as new tech stories land).

import { z } from 'zod'
import type { CollectionMetadata } from '@baddabing/framework/data'
import type { EventDeclaration } from '@baddabing/framework/events'
import {
  ACCEPTED_CV_MIME_TYPES,
  CV_UPLOADED_EVENT_TYPE,
} from './lib/uploads/types'

export interface SidebarItem {
  id: string
  label: string
  icon: string
  path: string
  title: string
}

export interface CandidateManifest {
  id: string
  name: string
  icon: string
  description: string
  basePath: string
  sidebar: SidebarItem[]
  collections?: CollectionMetadata[]
  emits?: EventDeclaration[]
  schemaVersion?: number
  dependencies?: { modules?: string[] }
}

// --- Event declarations (M2/PR 3) -----------------------------------------
//
// Every event the module publishes is declared here with a Zod schema for
// the payload. The framework's event-schema registry picks these up at
// activation; publishEvent validates payloads against the declared shape
// before handing them to the bus.

const cvUploadedPayloadSchema = z.object({
  uploadId: z.string().min(1),
  candidateId: z.string().min(1),
  size: z.number().int().nonnegative(),
  mimeType: z.enum(ACCEPTED_CV_MIME_TYPES),
})

/**
 * Typed event map for the module — fed to `typedPublishEvent<CandidateEvents>`
 * in emission sites for compile-time type safety on top of the runtime
 * Zod validation.
 */
export type CandidateEvents = {
  [CV_UPLOADED_EVENT_TYPE]: z.infer<typeof cvUploadedPayloadSchema>
}

export const candidateModule: CandidateManifest = {
  id: 'candidate',
  name: 'Candidate',
  icon: '/icons/candidate.svg',
  description: 'Candidate profile, intel, and pipeline state',
  basePath: '/candidate',
  sidebar: [
    { id: 'home', label: 'CAN', icon: '/icons/candidate.svg', path: '/candidate', title: 'Candidate' },
  ],
  collections: [
    // TS-1.1.1 — entry-gate artifact. Raw CV files live on disk; this
    // collection is the authoritative metadata pointer. kind: 'user'
    // (P5-protected, never auto-purged).
    { id: 'uploads', kind: 'user' },
  ],
  emits: [
    {
      type: CV_UPLOADED_EVENT_TYPE,
      payload: cvUploadedPayloadSchema,
      description: 'Emitted after a CV file + metadata have been persisted (TS-1.1.4).',
    },
  ],
  schemaVersion: 1,
  dependencies: { modules: [] },
}
