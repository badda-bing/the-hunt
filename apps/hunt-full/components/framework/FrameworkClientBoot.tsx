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
// `useEffect`. The server SSR renders the sidebar with its menu items
// in the shipped HTML; if the client registers contributions later
// (in useEffect), React's hydration pass reads an empty registry,
// renders nothing, and complains:
//
//     Error: Hydration failed because the initial UI does not match
//     what was rendered on the server.
//
// Module-level execution on the client runs before React's hydrate
// call, so the registry is populated by the time the sidebar's hook
// reads it. The `typeof window !== 'undefined'` guard short-circuits
// the side-effect during SSR (where Next still imports this 'use
// client' module to render descendants, but the server registry is
// already populated by instrumentation.ts). Module code runs once per
// bundle, and every init call is idempotent — safe under React
// StrictMode double-invocation too.
//
// Activities SSE subscription (M7): opens an EventSource against
// /api/activities/stream so server-side activities (CV extraction,
// curator dispatches, agent loops) mirror into the client registry
// and drive DefaultActivityPane.

'use client'

import { registerContributions } from '@baddabing/framework/contributions'
// Leaf subpaths keep Node-only transitive deps out of the browser
// bundle:
//   - lifecycle/context-keys — bypasses data/config plumbing
//   - events/client          — bypasses publish-event (async_hooks)
//                              + nats-event-bus (net / stream/web)
//   - activities/client      — bypasses the server barrel's SSE
//                              handler factory (which pulls in Next's
//                              Response types)
import { setContext } from '@baddabing/framework/lifecycle/context-keys'
import { initClientEvents } from '@baddabing/framework/events/client'
import { subscribeToActivityStream } from '@baddabing/framework/activities/client'
import { candidateModule } from '@the-hunt/candidate/manifest'
import { trackerModule } from '@the-hunt/tracker/manifest'

if (typeof window !== 'undefined') {
  // 1. Client-side event bus — synchronous, no network probe.
  //    Also auto-wires the activities primitive's publisher to this
  //    bus so client-side callers of beginActivity() fire events the
  //    DefaultActivityPane can observe locally.
  initClientEvents()

  // 2. Contributions — same payload the server feeds via activateModules.
  if (candidateModule.contributions) {
    registerContributions(candidateModule.id, candidateModule.contributions)
  }
  if (trackerModule.contributions) {
    registerContributions(trackerModule.id, trackerModule.contributions)
  }

  // 3. Activation context keys — modules in this app activate eagerly
  //    on server boot. Mirror that state on the client so visibility
  //    predicates (`module.<id>.active`) evaluate the same way here.
  setContext(`module.${candidateModule.id}.active`, true)
  setContext(`module.${trackerModule.id}.active`, true)

  // 4. Activities SSE — mirrors server-side activities into the
  //    client registry. Fire-and-forget; the subscribe returns an
  //    unsubscribe but this module lives for the whole tab lifetime.
  subscribeToActivityStream({ url: '/api/activities/stream' })
}

/**
 * Mount point kept for layout.tsx symmetry. All the work is a
 * module-load side effect above — see the header comment for why.
 */
export function FrameworkClientBoot(): null {
  return null
}
