// apps/hunt-full/components/upload/UploadDropzone.tsx
//
// F-1.1.1 — drag-and-drop CV uploader. Thin UI over uploadCv. Moved
// from modules/candidate/components/upload/ during the post-M6
// restructure: UI-free modules live under packages/, wrapper-side UI
// lives here. The uploadCv fetch helper still ships from the module.
//
// Client component. Browser-side; server validation is the authoritative check.

'use client'

import { useRef, useState } from 'react'
import { uploadCv } from '@the-hunt/candidate/client'
import type { UploadCvResult } from '@the-hunt/candidate/client'

export interface UploadDropzoneProps {
  /** Called with the new uploadId on success. Callers typically refresh the page. */
  onUploaded?: (uploadId: string) => void
}

type State =
  | { kind: 'idle' }
  | { kind: 'uploading'; filename: string }
  | { kind: 'success'; uploadId: string }
  | { kind: 'error'; type: string; message: string; recoveryHint?: string }

export function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [dragActive, setDragActive] = useState(false)

  async function handleFile(file: File) {
    setState({ kind: 'uploading', filename: file.name })
    const result: UploadCvResult = await uploadCv(file)
    if (result.ok) {
      setState({ kind: 'success', uploadId: result.uploadId })
      onUploaded?.(result.uploadId)
    } else {
      setState({
        kind: 'error',
        type: result.type,
        message: result.message,
        recoveryHint: result.recoveryHint,
      })
    }
  }

  return (
    <section
      onDragEnter={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files?.[0]
        if (file) void handleFile(file)
      }}
      style={{
        border: '2px dashed',
        borderColor: dragActive ? '#3a8' : '#999',
        padding: 32,
        borderRadius: 4,
        textAlign: 'center',
        background: dragActive ? '#f4fff9' : 'transparent',
      }}
    >
      {state.kind === 'idle' && (
        <>
          <p style={{ marginBottom: 16 }}>
            <strong>Drop your CV here</strong>
          </p>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            PDF, DOCX, or plain text. Max 20 MB.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Or pick a file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </>
      )}

      {state.kind === 'uploading' && (
        <p>Uploading {state.filename}…</p>
      )}

      {state.kind === 'success' && (
        <>
          <p>Upload accepted.</p>
          <p style={{ fontSize: 12, color: '#666' }}>ID: {state.uploadId}</p>
        </>
      )}

      {state.kind === 'error' && (
        <div role="alert" style={{ color: '#a00' }}>
          <p><strong>Upload failed ({state.type})</strong></p>
          <p>{state.message}</p>
          {state.recoveryHint && <p style={{ fontSize: 13 }}>{state.recoveryHint}</p>}
          <button
            type="button"
            onClick={() => setState({ kind: 'idle' })}
            style={{ marginTop: 8 }}
          >
            Try again
          </button>
        </div>
      )}
    </section>
  )
}
