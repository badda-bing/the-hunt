// modules/candidate/lib/uploads/events.ts
//
// TS-1.1.4 — emit candidate.cv.uploaded on successful upload.
//
// Wires framework.events.bus to the upload-service's onSuccess hook.
// Envelope construction delegated to framework.events.publishEvent.

import { publishEvent, type IEventBus } from '@baddabing/framework/events'
import {
  CV_UPLOADED_EVENT_TYPE,
  type CvUploadedEventPayload,
  type UploadMetadata,
} from './types'

/**
 * Build an onSuccess hook that publishes candidate.cv.uploaded.
 *
 * Used by the route handler:
 *   onSuccess: createCvUploadedEmitter(getFrameworkEvents().bus)
 */
export function createCvUploadedEmitter(
  bus: IEventBus,
): (record: UploadMetadata) => Promise<void> {
  return async (record) => {
    const payload: CvUploadedEventPayload = {
      uploadId: record.uploadId,
      candidateId: record.candidateId,
      size: record.size,
      mimeType: record.mimeType,
    }
    await publishEvent(bus, CV_UPLOADED_EVENT_TYPE, payload, {
      source: 'candidate.upload',
      meta: { filename: record.filename, uploadedAt: record.uploadedAt },
    })
  }
}
