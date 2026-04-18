// modules/candidate/lib/test-helpers.ts
//
// Candidate-module test harness. Wraps @baddabing/framework's testHarness
// + registers the module's declared collections on the mock data store.
//
// The framework's testHarness runs `activateModules` for persona/agent/
// knowledge registries, but collection registration goes through the
// real-framework singleton (getFrameworkData) which isn't wired to the
// mock store. We register collections manually here so tests behave as
// if the module were fully activated.

import {
  testHarness,
  type TestHarness,
  type TestHarnessOptions,
} from '@baddabing/framework/testing'
import { candidateModule } from '../manifest.js'

/**
 * Build a test harness with candidate-module collections pre-registered
 * on the mock data store. Behaves like framework.testHarness otherwise.
 */
export async function candidateTestHarness(
  opts: Omit<TestHarnessOptions, 'modules'> = {},
): Promise<TestHarness> {
  const h = await testHarness({
    ...opts,
    modules: [candidateModule],
  })
  // Register every declared collection on the mock store.
  for (const coll of candidateModule.collections ?? []) {
    h.store.registerCollection(coll)
  }
  return h
}
