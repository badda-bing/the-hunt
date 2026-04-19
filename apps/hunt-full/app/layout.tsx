// apps/hunt-full/app/layout.tsx
//
// Root layout. Wires the framework's M5 default-wrapper primitives
// (sidebar, toast host) around every page. Sidebar + toasts read from
// the framework's contributions + event registries; FrameworkClientBoot
// mirrors the server-side activation wiring into the browser.
//
// See:
//   - apps/hunt-full/components/framework/FrameworkClientBoot.tsx
//   - apps/hunt-full/components/framework/AppShell.tsx
//   - @baddabing/framework/default-wrapper/baseline.css

import './globals.css'
import '@baddabing/framework/default-wrapper/baseline.css'

import { FrameworkClientBoot } from '@/components/framework/FrameworkClientBoot'
import { AppShell } from '@/components/framework/AppShell'

export const metadata = {
  title: 'the-hunt',
  description: 'Candidate profile building and opportunity tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FrameworkClientBoot />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
