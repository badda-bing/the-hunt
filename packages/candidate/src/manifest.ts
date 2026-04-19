// packages/candidate/src/manifest.ts
//
// Candidate module manifest. Declares data collections, emitted events,
// wrapper contributions, external-route refs, and activation signals.
// Hand-edited as the module evolves — a scaffold generated the initial
// shape; post-M6 restructure moved it from modules/candidate/manifest.ts
// to here (packages/candidate/src/manifest.ts) as part of the UI-free
// monorepo layout.

import { z } from 'zod'
import type { CollectionMetadata } from '@baddabing/framework/data'
import type { EventDeclaration } from '@baddabing/framework/events'
import type { Contributions } from '@baddabing/framework/contributions'
import type { ExternalRouteDeclaration } from '@baddabing/framework/lifecycle'
import {
  ACCEPTED_CV_MIME_TYPES,
  CV_UPLOADED_EVENT_TYPE,
} from './uploads/types.js'

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
  contributions?: Contributions
  externalRoutes?: Record<string, ExternalRouteDeclaration>
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

  // M3 contributions — declarative UI-composition vocabulary. The wrapper
  // (hunt-full or the framework default) reads these at render time. The
  // candidate module never renders its own UI — wrappers own presentation
  // (per the M0-locked architectural direction).
  contributions: {
    // Top-level visibility: the candidate module only advertises UI once
    // it's completed activation (M2/PR 6 flipped this key at boot for
    // eager modules). The predicate holds even when activationEvents
    // land and modules become gated.
    visibility: 'module.candidate.active',

    menu: [
      {
        id: 'home',
        location: 'sidebar/top',
        label: 'Candidate',
        icon: '/icons/candidate.svg',
        target: 'candidate:home',
        order: 10,
      },
    ],

    // Phase-1 entry-gate conditional (TS-1.1.3). The "has a CV" flag
    // flips via a context key the upload-service / gate-logic will set
    // as Phase 1 matures; for now the widget advertises itself without
    // gating and the wrapper renders a placeholder.
    dashboardWidgets: [
      {
        id: 'pitchability',
        label: 'Pitchability snapshot',
        dataSource: 'candidate.pitchability',
        sizeHint: 'md',
        refreshPolicy: 'event-driven',
        // Not visible until the candidate has uploaded a CV. The context
        // key flips when hasCV() transitions — wiring planned for
        // Step 1.2.
        when: 'collection.uploads.hasRecords',
      },
    ],

    notifications: [
      {
        type: CV_UPLOADED_EVENT_TYPE,
        description: 'CV accepted + metadata persisted',
        severity: 'info',
      },
    ],

    theme: {
      accent: '#4a90e2',
      iconColor: '#2e5a8a',
    },
  },

  // M3/PR 2 — cross-module navigation refs. Candidate declares refs it
  // wants to link to; the wrapper binds abstract → concrete path at
  // composition time. hunt-full's app.config will supply the binding.
  externalRoutes: {
    trackerLinkBack: {
      description: 'Link back to the tracker dashboard from a candidate view',
    },
  },

  schemaVersion: 1,
  dependencies: { modules: [] },
}
