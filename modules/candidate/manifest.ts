// modules/candidate/manifest.ts
//
// Module manifest for the Candidate module. Declares the module's data
// collections, agents, personas, and lifecycle hooks. Hand-edited as the
// module evolves (collections added as new tech stories land).

import type { CollectionMetadata } from '@baddabing/framework/data'

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
  schemaVersion?: number
  dependencies?: { modules?: string[] }
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
  schemaVersion: 1,
  dependencies: { modules: [] },
}
