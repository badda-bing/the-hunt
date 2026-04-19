// apps/hunt-full/components/framework/FrameworkClientBoot.tsx
//
// Client-side mirror of apps/hunt-full/instrumentation.ts. Server-side,
// activateModules() registers contributions, seeds context keys, and
// inits the event bus against the Node process's globalThis. The
// browser gets its own globalThis — so DefaultSidebar / DefaultDashboard
// / DefaultToastHost need equivalent wiring on mount or their registry
// reads return empty arrays.
//
// This component runs once on first client render:
//   1. InProcess event bus — so UploadDropzone (and future emitters) can
//      publish events that DefaultToastHost subscribes to.
//   2. Every module's `contributions` block is re-registered against the
//      client-side registry.
//   3. `module.<id>.active` context keys seed `true` so visibility
//      predicates resolve the same way they do server-side.
//
// Idempotent — framework init functions guard against double-invocation.

'use client'

import { useEffect } from 'react'
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

export function FrameworkClientBoot(): null {
  useEffect(() => {
    // 1. Client-side event bus — synchronous, no network probe. The
    // server-side NATS/InProcess dance happens in instrumentation.ts;
    // this bus is strictly for wrapper-side UX (toasts, dashboard
    // refresh hints, etc.).
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
  }, [])

  return null
}
