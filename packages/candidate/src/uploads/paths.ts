// packages/candidate/src/uploads/paths.ts
//
// Shared route-path constants. Both the server-side route registration
// (packages/candidate/src/routes.ts) and the browser-side fetch helper
// (packages/candidate/src/uploads/upload-client.ts) import from here
// so the URL is defined in one place.
//
// Why a separate file: the upload-client is bundled into the browser
// and can't import routes.ts directly (routes.ts pulls wrapRoute,
// framework.next, publish-event, async_hooks — server-only). A tiny
// constants file keeps the client bundle browser-safe while giving
// both sides a single source of truth.

/**
 * Path segment (relative to the module's basePath + /api) that the
 * CV-upload handler is mounted at. The route key is
 * `POST ${UPLOAD_ROUTE_PATH}`; the full wrapper URL is
 * `${candidateModule.basePath}/api${UPLOAD_ROUTE_PATH}`.
 *
 * Changing this constant updates the server registration, the client
 * default endpoint, AND (after `pnpm generate-routes`) the wrapper's
 * generated route file all at once. The `uploads-client-contract`
 * test asserts the three stay in sync.
 */
export const UPLOAD_ROUTE_PATH = '/upload' as const
