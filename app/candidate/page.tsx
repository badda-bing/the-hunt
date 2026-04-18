// app/candidate/page.tsx
//
// Candidate module home. Entry-gate branch (TS-1.1.3):
//  - No CV yet → show only the upload door
//  - CV exists → show the (stubbed) dashboard
//
// Server component — reads framework.data directly.

import { getFrameworkData } from '@baddabing/framework/data'
import { hasCV } from '@/modules/candidate/lib/uploads/has-cv'
import { UploadDropzone } from '@/modules/candidate/components/upload/UploadDropzone'

export const dynamic = 'force-dynamic'

export default async function CandidatePage() {
  const store = getFrameworkData('candidate')
  const gate = await hasCV(store)

  if (!gate) {
    return <UploadGate />
  }

  return <DashboardStub />
}

function UploadGate() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Candidate</h1>
      <p style={{ color: '#444', marginBottom: 24 }}>
        Upload your CV to begin. Until then, the module can&rsquo;t proceed.
      </p>
      <UploadDropzone />
    </main>
  )
}

function DashboardStub() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Candidate</h1>
      <p>CV received. Full dashboard lands with step 1.2.</p>
    </main>
  )
}
