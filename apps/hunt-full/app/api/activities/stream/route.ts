// apps/hunt-full/app/api/activities/stream/route.ts
//
// Server-Sent Events endpoint for the framework activities primitive.
// The browser's subscribeToActivityStream (from
// '@baddabing/framework/activities/client') opens an EventSource
// against this route and mirrors every server-side activity event
// into the client registry — driving DefaultActivityPane.
//
// Hand-authored because it's a single-line mount; the framework
// owns the handler factory (createActivitiesStreamHandler), this
// file just wires it into Next's App Router route conventions.

import { createActivitiesStreamHandler } from '@baddabing/framework/next'

// Node runtime — the handler relies on the same server bus that
// instrumentation.ts initialises. Edge runtime can't see the in-
// process bus singleton.
export const runtime = 'nodejs'

// Disable all caching + static optimisation — this is a live stream.
export const dynamic = 'force-dynamic'

export const GET = createActivitiesStreamHandler()
