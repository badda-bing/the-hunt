// app/candidate/page.tsx
//
// Candidate module home. Entry-gate branch (TS-1.1.3):
//  - No CV yet → show only the upload door
//  - CV exists → show the (stubbed) dashboard
//
// Server component — reads framework.data directly.

import { getFrameworkData } from '@baddabing/framework/data'
import { hasCV } from '@/modules/candidate/lib/uploads/has-cv'

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

      <section
        style={{
          border: '2px dashed #999',
          padding: 32,
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        <p style={{ marginBottom: 16 }}>
          <strong>Upload your CV</strong>
        </p>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          PDF, DOCX, or plain text. Max 20 MB.
        </p>
        <p style={{ fontSize: 12, color: '#888' }}>
          (Dropzone component F-1.1.1 lands in the next commit.)
        </p>
      </section>
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
