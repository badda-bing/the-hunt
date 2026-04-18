// modules/registry.ts
//
// Collection of every module manifest. The instrumentation hook passes
// this list into framework.lifecycle.activateModules.

import { candidateModule } from './candidate/manifest'
import { trackerModule } from './tracker/manifest'

export const allModules = [
  candidateModule,
  trackerModule,
]
