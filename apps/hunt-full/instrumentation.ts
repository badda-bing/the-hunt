// apps/hunt-full/instrumentation.ts
//
// Next.js instrumentation hook. Runs once at server start, before any
// route handler. Brings up framework surfaces in dependency order,
// activates every declared module, and fires onStartupFinished for
// any gated modules waiting on it.
//
// Auto-generated shape (post-M6 restructure) — to add a module, run
// framework.scaffold.addModuleToWrapper and re-run.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // Load .env.local before any framework surface boots — Next.js's own
  // env-loading happens AFTER instrumentation, so framework config
  // validation would otherwise see an empty process.env. Shell-exported
  // vars win; .env.local only fills gaps.
  const { loadEnvLocal } = await import('@baddabing/framework/config')
  loadEnvLocal()

  const { initFrameworkConfig } = await import('@baddabing/framework/config')
  const { initFrameworkData } = await import('@baddabing/framework/data')
  const { initFrameworkEvents } = await import('@baddabing/framework/events')
  const { initFrameworkUserConfig } = await import('@baddabing/framework/user-config')

  await initFrameworkConfig()
  await initFrameworkData()
  await initFrameworkEvents({ forceInProcess: true })
  await initFrameworkUserConfig()

  const { activateModules, markActivated } = await import('@baddabing/framework/lifecycle')

  const { candidateModule } = await import('@the-hunt/candidate/manifest')
  const { trackerModule } = await import('@the-hunt/tracker/manifest')

  await activateModules([
    candidateModule,
    trackerModule,
  ])
  markActivated()
}
