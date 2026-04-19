// packages/tracker/src/manifest.ts
//
// Tracker module manifest. Declares collections, contributions (how the
// wrapper surfaces the module), and module metadata.
//
// Post-M6 refactor: dropped the legacy hand-authored `sidebar: []` field
// in favour of the framework-standard `contributions.menu` declaration —
// DefaultSidebar (or any wrapper-supplied sidebar) reads contributions
// directly and modules don't need to shape the sidebar payload.

import type { CollectionMetadata } from '@baddabing/framework/data'
import type { Contributions } from '@baddabing/framework/contributions'

export interface TrackerManifest {
  id: string
  name: string
  icon: string
  description: string
  basePath: string
  collections?: CollectionMetadata[]
  contributions?: Contributions
  schemaVersion?: number
  dependencies?: { modules?: string[] }
}

export const trackerModule: TrackerManifest = {
  id: 'tracker',
  name: 'Tracker',
  icon: '/icons/tracker.svg',
  description: 'Role evaluations and application materials',
  basePath: '/tracker',
  collections: [],
  contributions: {
    visibility: 'module.tracker.active',
    menu: [
      {
        id: 'home',
        location: 'sidebar/top',
        label: 'Tracker',
        icon: '/icons/tracker.svg',
        target: '/tracker',
        order: 20,
      },
    ],
  },
  schemaVersion: 1,
  dependencies: { modules: [] },
}
