// apps/hunt-full/app/candidate/api/upload/route.ts
//
// Auto-generated shape from framework.scaffold.generateWrapperRoutes.
// Hand-authored until the generator CLI learns to parse routes.ts
// statically (it currently dynamic-imports the module, which pulls
// next/server outside Next's bundler and fails to resolve). Shape
// matches what the generator produces.
//
// Regenerate via: pnpm --filter @the-hunt/hunt-full generate-routes
// (once the CLI's static-parse fix ships).

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const mod = await import('@the-hunt/candidate')
  const handler = mod.routes['POST /upload']
  if (!handler) {
    return new Response(
      JSON.stringify({
        error: {
          type: 'InternalError',
          message: "module 'candidate' does not export routes['POST /upload']",
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
  return handler(req)
}
