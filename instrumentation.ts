// instrumentation.ts
//
// Next.js instrumentation hook. Runs once at server start, before any
// route handler. Brings up framework surfaces in dependency order.
// Node runtime only — edge runtime can't read app.config.json from disk.
//
// Modify this file by calling framework.scaffold.addSurface / addModule
// from a Claude session rather than editing by hand.

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

  await initFrameworkConfig()
  await initFrameworkData()
  await initFrameworkEvents({ forceInProcess: true })

  const { activateModules, markActivated } = await import('@baddabing/framework/lifecycle')
  const { allModules } = await import('@/modules/registry')
  await activateModules(allModules)
  markActivated()
}
