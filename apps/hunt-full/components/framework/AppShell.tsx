// apps/hunt-full/components/framework/AppShell.tsx
//
// hunt-full's default wrapper shell. Composes the framework's
// M5 default-wrapper primitives around the page's children:
//   - DefaultSidebar     — reads contributions.menu from every module
//   - DefaultToastHost   — bottom-right; point-in-time notifications
//   - DefaultActivityPane — top-right; long-standing activity cards
//                          (M7 — SSE-fed from the server event bus)
//
// Client component because the pane + toast host + sidebar use React
// hooks (useSyncExternalStore, useEffect) to reactively read the
// framework registries.

'use client'

import type { ReactNode } from 'react'
import {
  DefaultSidebar,
  DefaultToastHost,
  DefaultActivityPane,
} from '@baddabing/framework/default-wrapper'

export interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="fwd-shell">
      <DefaultSidebar />
      <main className="fwd-main">{children}</main>
      <DefaultActivityPane />
      <DefaultToastHost />
    </div>
  )
}
