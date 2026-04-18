// modules/candidate/lib/uploads/raw-store.ts
//
// Abstraction over the file-system write for raw CV files.
// Production: writes to disk at candidate/uploads/<uploadId>/raw.<ext>.
// Tests: inject a mock implementation that captures calls.

import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface RawFileStore {
  /**
   * Persist raw bytes for an upload.
   * Returns the absolute path written, for logging / debugging.
   * Throws `ExternalServiceError` on filesystem failure.
   */
  persist(uploadId: string, extension: string, bytes: Uint8Array): Promise<string>
}

export interface DiskRawFileStoreOptions {
  /**
   * Root directory the store writes under. A full path like
   * `<root>/<uploadId>/raw.<ext>` is produced. Defaults to
   * `<cwd>/candidate/uploads`.
   */
  root?: string
}

/** File-system implementation. Used in production. */
export function createDiskRawFileStore(
  opts: DiskRawFileStoreOptions = {},
): RawFileStore {
  const root = opts.root ?? path.join(process.cwd(), 'candidate', 'uploads')
  return {
    async persist(uploadId, extension, bytes) {
      const dir = path.join(root, uploadId)
      const file = path.join(dir, `raw.${extension}`)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(file, bytes)
      return file
    },
  }
}
