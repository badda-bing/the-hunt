// apps/hunt-full/components/framework/FrameworkClientBoot.tsx
//
// Client-side mirror of apps/hunt-full/instrumentation.ts. Server-side,
// activateModules() registers contributions, seeds context keys, and
// inits the event bus against the Node process's globalThis. The
// browser gets its own globalThis — so DefaultSidebar / DefaultDashboard
// / DefaultToastHost need equivalent wiring on mount or their registry
// reads return empty arrays.
//
// CRITICAL — the wiring must happen at module-load time, not inside
// `useEffect`. The server SSR runs instrumentation.ts and then renders
// the sidebar with its menu items in the shipped HTML. If the client
// registers contributions later (in useEffect), React's hydration pass
// reads an empty registry, renders nothing, and complains:
//
//     Hydration failed because the initial UI does not match what was
//     rendered on the server.
//
// Module-level execution on the client runs before React's hydrate
// call, so the registry is populated by the time the sidebar's hook
// reads it. The `typeof window !== 'undefined'` guard short-circuits
// the side-effect during SSR (where this 'use client' module is still
// imported to produce the server-rendered HTML of any descendants).
// Module code runs once per bundle, and registerContributions is
// idempotent — safe under React StrictMode double-invocation too.

'use client'

import { registerContributions } from '@baddabing/framework/contributions'
// Leaf subpaths keep Node-only transitive deps out of the browser
// bundle:
//   - lifecycle/context-keys — bypasses data/config plumbing
//   - events/client          — bypasses publish-event (async_hooks)
//                              + nats-event-bus (net / stream/web)
import { setContext } from '@baddabing/framework/lifecycle/context-keys'
import { initClientEvents } from '@baddabing/framework/events/client'
import { candidateModule } from '@the-hunt/candidate/manifest'
import { trackerModule } from '@the-hunt/tracker/manifest'

if (typeof window !== 'undefined') {
  // 1. Client-side event bus — synchronous, no network probe.
  initClientEvents()

  // 2. Contributions — same payload the server feeds via activateModules.
  if (candidateModule.contributions) {
    registerContributions(candidateModule.id, candidateModule.contributions)
  }
  if (trackerModule.contributions) {
    registerContributions(trackerModule.id, trackerModule.contributions)
  }

  // 3. Activation context keys — modules in this app activate eagerly
  // on server boot. Mirror that state on the client so visibility
  // predicates (`module.<id>.active`) evaluate the same way here.
  setContext(`module.${candidateModule.id}.active`, true)
  setContext(`module.${trackerModule.id}.active`, true)
}

/**
 * Mount point kept for layout.tsx symmetry. All the work is a
 * module-load side effect above — see the header comment for why.
 */
export function FrameworkClientBoot(): null {
  return null
}
