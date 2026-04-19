// apps/hunt-full/components/framework/AppShell.tsx
//
// hunt-full's default wrapper shell. Composes the framework's
// M5 default-wrapper primitives (DefaultSidebar + DefaultToastHost)
// around the page's children. The sidebar reads `contributions.menu`
// declarations from every active module; the toast host subscribes to
// the event bus and surfaces every event that matches a declared
// `notifications` contribution.
//
// Client component because DefaultSidebar / DefaultToastHost use React
// hooks (useSyncExternalStore, useEffect) to reactively read the
// framework registries.

'use client'

import type { ReactNode } from 'react'
import {
  DefaultSidebar,
  DefaultToastHost,
} from '@baddabing/framework/default-wrapper'

export interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="fwd-shell">
      <DefaultSidebar />
      <main className="fwd-main">{children}</main>
      <DefaultToastHost />
    </div>
  )
}
