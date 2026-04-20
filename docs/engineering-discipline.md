# Engineering discipline — the-hunt

This file is the running contract for how we ship code in this workspace.
Two halves: **rules we always follow**, and a **lessons-learned log** that
captures specific mistakes + how to avoid repeating them. Claude sessions
MUST consult this file before proposing fixes, and MUST add to the log
every time a bug is fixed.

Applies to both repos in the workspace (`the-hunt/` + the
`baddabing-framework/` sibling that it links to).

---

## Rules

### R1 — Every bug fix ships a regression test

When you fix a bug, ship a test that **would have failed before the fix**
and **passes after the fix**. "Would have failed before" is the load-
bearing half — if you can revert just the code change and the test still
passes, it's not a regression test, it's a restatement.

Specifics:

- **If the bug class is testable at unit level**, add a unit test in the
  same PR as the fix.
- **If the bug class is a wire contract between pieces** (client URL vs
  server route, manifest field vs schema, event type vs subscriber),
  test the **relationship** between the two sides, not each side in
  isolation. See Lesson L9.
- **If the bug class is build-time / bundler-behaviour** (webpack
  tracing, Next config discovery, tsc strict mode), add a build-time
  assertion: a test that runs `pnpm build` + greps the output, or a
  verify-CLI check.
- **If the bug class is runtime / integration only** (Next instrumentation
  firing, SSR/hydration parity), the regression test is a smoke script
  or an e2e test. Cheaper than you think; a single `curl` against a
  dev server counts. Ship it alongside the fix.
- **If you genuinely can't test it**, say so in the commit message with
  the reason + what manual verification was done. "Hard to test" is a
  signal to either redesign for testability or document the known gap.

### R2 — Test the contract, not the code you just wrote

A test that asserts `expect(received.endpoint).toBe('/api/candidate/cv-upload')`
does not protect you from shipping the wrong URL. It just asserts that
the code you wrote does what you wrote it to do. Tautologies are green
by definition.

Instead, test the **relationship**: "the URL the client fetches matches
the URL the server mounts," "the event type the module publishes matches
the type declared in `manifest.emits`," etc. The failure mode is
"drift between two things that should agree," and the test must be able
to detect that drift.

### R3 — Single source of truth for values shared between layers

If client and server both need the same string (URL, event type, route
path, storage key), define it **once** in a shared constant and import
it from both sides. Two hand-typed copies drift by default.

When this rule is honoured, Rule R2's contract tests become simple
identity assertions against the shared constant. When it's broken, you
need a contract test that spans both hand-written strings — which is
harder to write and easier to forget.

### R4 — Consult the lessons log before fixing

Before proposing a fix, search the log below for the bug class. If we've
hit it before, the fix pattern is probably already named. Don't rediscover.

### R5 — Add to the lessons log after fixing

After a fix lands, append an entry to the log. New class = new entry;
same class we've seen before = add a new occurrence under the existing
entry + tighten the rule if needed. A repeat-offender bug class should
graduate to a framework-level check (Rule R3 applied to the toolchain).

---

## Lessons learned

Format:

    ### L<n> — <short tag> (YYYY-MM-DD)
    **Symptom:** what the user saw
    **Root cause:** what actually went wrong
    **Fix:** what we changed
    **Regression guard:** how we detect the recurrence
    **Applies to:** framework / app / both

---

### L1 — `next.config.cjs` silently ignored when package.json is `type: module` (2026-04-19)

**Symptom:** `/candidate` returned 500 with `DataStoreError: framework.data
accessed before initFrameworkData() completed`, despite `instrumentation.ts`
existing and `experimental.instrumentationHook: true` being set.

**Root cause:** Next.js 14 auto-discovery of `next.config.*` didn't pick
up the `.cjs` extension in this monorepo layout. Silently ran with
defaults → instrumentationHook never enabled → instrumentation.ts never
executed → framework.data never initialised.

**Fix:** Renamed `next.config.cjs` → `next.config.mjs` with
`export default nextConfig` (the enclosing `package.json` is
`"type": "module"`, so `.mjs` interprets cleanly).

**Regression guard:** Missing. Hard to test at unit level — this is
Next's config-discovery behaviour. Smoke script: boot `next dev`,
confirm the startup log says
`· instrumentationHook` under `Experiments`. Claude sessions that touch
Next config or the file layout MUST run the dev server + confirm that
line is present before claiming the change works.

**Applies to:** app.

---

### L2 — `routeBindings` rejected by `FrameworkConfigSchema` strict object (2026-04-19)

**Symptom:** Instrumentation threw
`ConfigError: Unrecognized key: "routeBindings"` on boot.

**Root cause:** The framework's top-level config schema is
`z.strictObject({...})`. Unknown keys = error. `routeBindings` was
aspirational scaffold output that never got added to the schema.

**Fix:** Removed the key from `apps/hunt-full/app.config.json`.

**Regression guard:** Missing. Should be added to the framework's
`pnpm verify` CLI — parse every declared config file against the schema
at lint time. See TODO in lessons.

**Applies to:** app. Prevention belongs in framework.

---

### L3 — Bundler traces dynamic imports into client bundles (2026-04-19)

**Symptom:** `next build` failed with
`Module not found: Can't resolve 'net'` /
`Can't resolve 'stream/web'` when a client component imported from
`@baddabing/framework/events`.

**Root cause:** `events/index.ts` re-exports from `nats-event-bus.ts`,
which does `await import('nats')` inside a function. Post-M1 the load
is lazy at runtime, but webpack 5 still statically analyses dynamic
specifiers + tries to include them in the bundle. `nats` depends on
Node's `net` + `stream/web`, which don't resolve in browser builds.

**Fix:** Added `/* webpackIgnore: true */` magic comment on the dynamic
import. Webpack leaves it alone; Node's native ESM resolver handles it
at runtime on the server.

**Regression guard:** Partial. The framework's test suite doesn't exercise
browser bundling. A future framework CI step should run
`pnpm --filter hunt-full build` and grep for `Module not found` in the
output. Adding the magic-comment ALSO requires a client-safe leaf
subpath (Lesson L4) so future framework additions don't re-trip it.

**Applies to:** framework.

---

### L4 — Barrel imports drag Node-only transitive deps into client bundles (2026-04-19)

**Symptom:** Even with webpackIgnore applied (L3), the events barrel
still pulled `async_hooks` (via `publish-event.ts`) into the client.

**Root cause:** Top-level barrels import everything. Client components
that only need `InProcessEventBus` or `setContext` pay for the full
surface — including Node-only transitives that can't bundle for the
browser.

**Fix:** Add a leaf subpath (`./client`, `./lifecycle/context-keys`,
etc.) that exports only browser-safe pieces. Client components import
from the leaf.

**Regression guard:** Partial. Every framework surface that has
server-only pieces should ship a parallel client subpath with a
test that imports it + asserts the import graph stays clean (e.g. no
`async_hooks` / `net` / `better-sqlite3` reachable from the client
subpath). New test owed — see open TODOs.

**Applies to:** framework.

---

### L5 — `useSyncExternalStore` infinite loop from unstable snapshots (2026-04-19)

**Symptom:** `/candidate` threw
`Error: Maximum update depth exceeded` as soon as the sidebar tried to
render.

**Root cause:** `useContributions('menu')` called
`getContributionsByKind(...)` which built a **new** array on every call.
React's `useSyncExternalStore` compares snapshots by reference
(`Object.is`); a fresh array always differs from the previous one, so
React thinks state changed every commit → re-renders forever.

**Fix:** Snapshot-cache the registry. Monotonic `version` counter, cache
map keyed by arg-shape, invalidated on any mutation. Reads return
the same reference until something actually changes.

**Regression guard:** Yes — 6 tests in `contributions.test.ts` assert
reference stability of each getter across repeat reads, freshness after
mutations, and independent caching per arg shape.

**Applies to:** framework. Pattern replicated in
`activities/registry.ts`.

---

### L6 — Hydration mismatch from `useEffect`-timed client bootstrap (2026-04-19)

**Symptom:** `Hydration failed because the initial UI does not match
what was rendered on the server.`

**Root cause:** Server SSR rendered the sidebar with menu items
(server-side `instrumentation.ts` populated the registry before layout
rendered). Client-side `FrameworkClientBoot` ran
`registerContributions(...)` inside `useEffect` — which fires AFTER
React's hydration pass. Client's first render saw an empty registry →
rendered no items → mismatched server HTML.

**Fix:** Moved registration to module-load time, guarded by
`typeof window !== 'undefined'`. 'use client' module body runs
synchronously when the client imports it, before React hydrates, so the
registry is populated by the time the sidebar's hook reads it.

**Regression guard:** Missing. The bug reoccurs if anyone moves the
registration back into useEffect. Need a test that renders the layout
with `react-dom/server.renderToString` + asserts the output contains the
menu items, AND a second test via `renderToStaticMarkup` with an
explicit "client-side registration has not happened yet" scenario to
confirm the contract. Not cheap — TODO.

**Applies to:** app. Framework contribution: document the pattern in
`default-wrapper/` so every app gets it right out of the scaffold.

---

### L7 — Hydration mismatch from SSR-leaking client-only state (2026-04-20)

**Symptom:** `Hydration failed because the initial UI does not match
what was rendered on the server.` — after enabling `DefaultActivityPane`.

**Root cause:** Two independent reasons the pane can't SSR:

1. The server-side activities registry is a Node-process singleton.
   Activities that ran on the server (from earlier requests or
   concurrent work) stay in the registry, get SSRed into the HTML.
   Client hydrates with its own empty registry → mismatch.
2. Each card renders an elapsed-time readout from `Date.now()`, which
   differs between server-render-time and hydrate-time even for a
   single in-flight activity.

**Fix:** `useMounted()` gate in `DefaultActivityPane`. Returns null
during SSR + the first client render; flips to true in a post-mount
`useEffect`. The pane is a client-only progressive-enhancement surface
— it has no business existing on the server.

**Regression guard:** Yes — 1 test in `activity-pane.test.ts` asserts
that `renderToString(<DefaultActivityPane />)` returns `""` even when
the registry is populated. Content tests use `DefaultActivityPaneBody`
(the body without the gate) so the content contract stays covered.

**Applies to:** framework. Pattern to replicate: any component whose
render depends on `Date.now()`, `Math.random()`, or a client-only store
should gate on mount.

---

### L8 — Server-side registry retains completed activities across requests (2026-04-20)

**Symptom:** Page loads show a completed activity card briefly before it
disappears, even for activities from previous sessions.

**Root cause:** The server-side activities registry has no auto-prune.
Only the client-side SSE subscriber schedules prunes (after the fade
animation). Terminal activities sit on the server forever; the next SSR
includes them.

**Fix:** Not shipped yet. Two options:
- Server-side auto-prune immediately after publishing a terminal
  event. Client's own prune-timer still handles the fade.
- Mount-gate the pane (covered by L7) — server HTML never includes
  activities, so registry state can leak harmlessly.

We shipped the mount-gate. An ideal belt-and-suspenders would also
auto-prune server-side. TODO.

**Regression guard:** L7's guard covers the user-visible symptom.
A test that asserts the server registry is empty after a terminal
transition is still owed.

**Applies to:** framework.

---

### L9 — Upload 404: test asserted the client-side constant, not the client-server contract (2026-04-20)

**Symptom:** `Upload failed (UnknownError) HTTP 404` when dropping a CV
in the browser.

**Root cause:** `packages/candidate/src/uploads/upload-client.ts`
defaulted to `/api/candidate/cv-upload` — the pre-M6-restructure path.
The server route was mounted at `/candidate/api/upload`. Client and
server each had their own hand-typed string. The unit test for
`uploadCv` asserted the client's default equalled the client's default
string:

    expect(received.endpoint).toBe('/api/candidate/cv-upload')

Tautology. When the server route path changed during the restructure,
nothing forced the client string or the test string to follow.

**Fix:**
1. Extracted `UPLOAD_ROUTE_PATH = '/upload'` into
   `packages/candidate/src/uploads/paths.ts` as a single source of truth.
2. `routes.ts` uses the constant for its key.
3. `upload-client.ts` derives the default endpoint as
   `${candidateModule.basePath}/api${UPLOAD_ROUTE_PATH}`.

**Regression guard:** Three tests (new):
- `uploadCv` default endpoint matches the value derived from
  `candidateModule.basePath` + `UPLOAD_ROUTE_PATH`. Fails if either side
  drifts.
- `routes.ts` exports a key `POST ${UPLOAD_ROUTE_PATH}`. Fails if someone
  hand-types the route key.
- (TODO, framework-level) `pnpm verify` asserts that every client fetch
  helper in a module imports its URL from the module's own exported
  constants, not hand-typed.

**Applies to:** app. Prevention pattern belongs in framework-level
verify. Until then, honour Rule R3 in every module: any value shared
across layers is one constant in one file.

---

## Open TODOs surfaced by the log

- **Framework `pnpm verify` extensions:**
  - Assert declared app-config files parse cleanly against `FrameworkConfigSchema` (prevents L2 recurrence class-wide).
  - Assert client subpaths don't reach Node-only deps in their import graph (prevents L3/L4 framework-wide).
  - Assert module client fetch helpers derive their URLs from exported
    module constants, not hand-typed strings (prevents L9 across every
    module).
- **Framework CI step:** run `pnpm --filter <wrapper> build` against
  a reference app; fail CI on `Module not found` in the output (closes
  the remaining L3/L4 gap).
- **Scaffold hardening:** new-module scaffold should emit a `paths.ts`
  file + wire both the routes.ts key and the client default via those
  constants, so Rule R3 is satisfied out of the box.
- **Smoke-test harness:** a single `bun run` / `pnpm run` script that
  boots `next dev`, hits a set of known routes, fails on non-2xx. Cheap
  insurance against L1-class regressions.
