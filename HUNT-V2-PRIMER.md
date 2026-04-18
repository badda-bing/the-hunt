# The Hunt v2 — Session Primer

> Handoff from the framework-extraction session to the Hunt v2 build session. Read this whole file before taking any action. Then follow the **First actions** checklist at the bottom.

---

## 1. What you're doing

Build a brand-new `the-hunt` app in **[github.com/badda-bing/the-hunt](https://github.com/badda-bing/the-hunt)** (empty, public) using **@baddabing/framework** as the substrate. Port domain IP from the existing Hunt; do NOT port code patterns. The old Hunt becomes reference material; the new Hunt is framework-idiomatic from the first commit.

**Why fresh, not fix-in-place:** the old Hunt has ~105 broken imports post-extraction, a ~20-site pending events migration, and a lot of pre-framework patterns. Rebuilding cleanly on the locked framework is faster than untangling; it also validates the framework end-to-end as a product.

---

## 2. The three repos you're working between

| Repo | Path | Role |
|---|---|---|
| **baddabing-framework** | `F:\Git\baddabing-framework\` | The framework. **Clean. Green. Don't modify unless you find a real framework bug.** |
| **the-hunt** (new) | `F:\Git\the-hunt\` — *clone to here first* | Where you're building. Empty on GitHub. |
| **the-hunt-candidate-dino** (old monorepo) | `F:\Git\the-hunt-candidate-dino\` | **Reference only.** Read freely; don't commit there. Contains `apps/the-hunt/` with all the old Hunt code — the source of domain IP to port. |

All three live as siblings under `F:\Git\`. Keep them that way — paths assume it.

---

## 3. Read these before scaffolding (in order)

1. [F:\Git\baddabing-framework\GUIDE.md](F:\Git\baddabing-framework\GUIDE.md) — how to drive the framework as a consumer. Task-oriented, example-heavy. Covers `bootstrapApp`, `addSurface`, `addModule`, chaining, verification.
2. [F:\Git\baddabing-framework\REFERENCE.md](F:\Git\baddabing-framework\REFERENCE.md) — every surface the framework exposes. Skim the surfaces table; read the sections for anything Hunt needs (data, events, chat, knowledge, agents, ui, scaffold).
3. [F:\Git\baddabing-framework\MODULES.md](F:\Git\baddabing-framework\MODULES.md) — the module model + lifecycle. Hunt will have two modules (candidate, tracker); this defines what "module" means.
4. [F:\Git\baddabing-framework\CLAUDE.md](F:\Git\baddabing-framework\CLAUDE.md) — framework-builder rules (P1–P5, S1–S9, X1–X5). You're a CONSUMER, not a builder, so skim only; the relevant bit is the red flags table.

Two Claude skills are available to drive the flow — both in the old monorepo's `.claude/skills/` (copy them over to the new repo's `.claude/skills/` in your first commit):

- **`/scaffold-new-app`** — conversational interview → AppSpec → `bootstrapApp`. Use this to create the new Hunt.
- **`/add-module-to-app`** — conversational interview → ModuleSpec → `addModule`. Use this if you're adding modules after the initial scaffold.

Skill sources:
- [F:\Git\the-hunt-candidate-dino\.claude\skills\scaffold-new-app\SKILL.md](F:\Git\the-hunt-candidate-dino\.claude\skills\scaffold-new-app\SKILL.md)
- [F:\Git\the-hunt-candidate-dino\.claude\skills\add-module-to-app\SKILL.md](F:\Git\the-hunt-candidate-dino\.claude\skills\add-module-to-app\SKILL.md)

---

## 4. The Hunt's shape (for the scaffold interview)

When `/scaffold-new-app` asks, these are the answers:

- **Name:** `the-hunt`
- **Description:** `Candidate profile-building and opportunity-tracking system. Agents extract career intel from uploads and chat; curators maintain 20 non-overlapping territories; rubric engine scores readiness; The Judge evaluates roles.`
- **Modules:** two primary modules, match the existing split:
  - `candidate` — the candidate's profile, intel, completeness model, pipeline runs
  - `tracker` — role evaluations, judge learnings, application materials

### Candidate module — collections

From [apps/the-hunt/modules/candidate/manifest.ts](apps/the-hunt/modules/candidate/manifest.ts):

**User collections (`kind: 'user'`, P5-protected):**
```
intel/career/achievements
intel/career/aspirations
intel/career/awards
intel/career/experiences
intel/career/narratives
intel/career/next-role-expectations
intel/career/projects
intel/career/qualifications
intel/career/roles
intel/career/skills
intel/evidence
intel/opinions
intel/personal
intel/personal/positioning-statements
intel/personal/value-statements
intel/psychology/assessments
intel/relationships/companies
intel/relationships/people
intel/relationships/recommendations
intel/voice
workflow-state
intel/merge-dismissed
```

**Derived collections (`kind: 'derived'`):**
```
timeline-gaps
completeness-model
pipeline-runs
snapshots
(plus the framework chat sessions collection)
```

### Tracker module — collections

From [apps/the-hunt/modules/tracker/manifest.ts](apps/the-hunt/modules/tracker/manifest.ts):

**Derived:**
```
judge-learnings
evaluation-metrics
(plus framework chat sessions)
```

Tracker has no user collections in the existing Hunt — all data is Judge-generated. That's a deliberate architectural choice; keep it.

### Surfaces to wire

Default (`config`, `data`, `events`) is not enough for Hunt. It needs at least these available (some are lazy-init so they're not wired in `instrumentation.ts`, just used on demand):

- `config` (required)
- `data` (required — SQLite)
- `events` (required — InProcessEventBus default; NATS for prod)
- `audit` (used by pipeline error tracking)
- `errors` (classified errors across routes/subscribers)
- `observability` (correlation spans)
- `agents` (20+ curators, armorer, researchers, Judge)
- `chat` (per-module personas: candidate characters, The Judge, The Scribe)
- `knowledge` (not heavily used today but earmarked)
- `ui` (tokens + primitives for the admin dashboard)

The scaffold default is `['config', 'data', 'events']`. The rest are lazy — no framework changes needed.

---

## 5. What to port (domain IP worth preserving)

Port **content**, not code. These are the specific files to read in the old Hunt and re-express in the new structure.

### Prompts (highest-value, most time-expensive to re-derive)

- [apps/the-hunt/modules/candidate/lib/prompt-builder.ts](apps/the-hunt/modules/candidate/lib/prompt-builder.ts) — `ARMORER_RUBRIC`, `ARMORER_SCORING`, `LOG_INSTRUCTIONS`, `PIPELINE_COMPLETE_INSTRUCTIONS`, and the builders `buildUploadPrompt_Phase1/2`, `buildInterviewPrompt_Phase1/2`, `buildReAuditPrompt`. These are ~1,176 tokens of prompt engineering per agent run. Re-derive at your peril.

### Curator definitions (20 curators, non-overlapping territories)

- [apps/the-hunt/modules/candidate/lib/curator-registry.ts](apps/the-hunt/modules/candidate/lib/curator-registry.ts) — each curator declares `curates`, `does_not_curate`, schema. This is the system's "one curator = one schema = one territory" backbone (A1 in the old Hunt's CLAUDE.md).

### Rubric engine

- [apps/the-hunt/modules/candidate/lib/completeness.ts](apps/the-hunt/modules/candidate/lib/completeness.ts) — how rubric dimensions map to intel collections and compute a completeness score.
- [apps/the-hunt/modules/candidate/lib/rubric-mapper.ts](apps/the-hunt/modules/candidate/lib/rubric-mapper.ts) — the dimension-to-intel mapping.

### Character configs + seeds

- [apps/the-hunt/.config/](apps/the-hunt/.config/) — schemas, seed templates, character definitions. These are user-edited / curated content, not code.

### Chat personas

- From [apps/the-hunt/modules/tracker/manifest.ts](apps/the-hunt/modules/tracker/manifest.ts): `TRACKER_JUDGE_PERSONA_BODY`, `TRACKER_SCRIBE_PERSONA_BODY`.
- From [apps/the-hunt/modules/candidate/manifest.ts](apps/the-hunt/modules/candidate/manifest.ts): the candidate module's persona bodies (career narrative, coaching, etc.).

### Pipeline shape

- [apps/the-hunt/modules/candidate/lib/pipeline-orchestrator.ts](apps/the-hunt/modules/candidate/lib/pipeline-orchestrator.ts) — what stages run in what order, on what triggers. The framework has `PipelineOrchestrator` in `@baddabing/framework/lib/events`; you'll pass your step array to it.

### Non-code content

Candidate-authored intel in [candidate/](candidate/) in the old repo is personal and should NOT port automatically. If the user wants their existing intel preserved, that's a separate data-migration task; it's not scaffold work.

---

## 6. What to NOT port

| Don't port | Why | What to do instead |
|---|---|---|
| Route handlers (`app/api/**/route.ts`) | Hand-written against pre-framework patterns, many use stale aliases | Regenerate from scratch using framework idioms |
| Event subscribers (`modules/candidate/lib/event-subscribers/*`) | Still on the pre-Phase-3 bus shape | Rebuild against `IEventBus` + envelope-shaped handlers |
| Admin dashboard UI (`app/admin/**`) | Heavy custom React, can defer | Skip for v2; rebuild when you need it |
| File I/O (`lib/file-io.ts`, `snapshots.ts`, any direct `fs` usage) | Framework `IDataStore` replaces this | Use `getFrameworkData()` + collections |
| Agent harness code (custom spawn wrappers) | Framework `framework.agents.run()` does this | Use `AgentDefinition` + the agents surface |
| Path aliases `@/framework/*`, `@/lib/*` | These are internal framework aliases, not consumer-facing | Use `@baddabing/framework/*` subpath exports |
| Tests | Most test the old bus shape / old aliases | Rewrite as you port each feature |
| `scripts/fwd-*.js` | These are framework-level, live in the framework repo now | Consume from the framework (or copy into new Hunt's scripts/ if needed) |

---

## 7. Architecture the old Hunt documented (ARCHITECTURE.md)

[F:\Git\the-hunt-candidate-dino\ARCHITECTURE.md](F:\Git\the-hunt-candidate-dino\ARCHITECTURE.md) — eleven sections covering features, system overview, components, data, agents, pipeline, API, workflow, research, token optimization, tech stack. Read it for DOMAIN context (how Hunt is supposed to work), not for implementation (it references code paths that are now obsolete).

Core Hunt concepts you'll need to re-express in the new architecture:

- **20 curators** each owning a non-overlapping slice of intel — see ARCHITECTURE.md §5.
- **Rubric-aware extraction** — the armorer scores completeness; curators emit rubric-targeted intel. §6.
- **Timeline gate** — work cannot proceed if the career timeline has gaps. §6.
- **Event-driven pipeline** — every stage emits `started/working/completed/failed`. §6.
- **Researcher intel layer** — 6 researchers populate hidden `_researcher_intel` fields. §9.
- **Reaudit triggers** — subscribers re-run the armorer when intel changes substantively. §6.
- **Token optimization** — ~1,176 tokens saved per agent via shared prompt constants. §10.

---

## 8. Pre-existing rules that still apply

The old Hunt's [CLAUDE.md](CLAUDE.md) has rules C1–C4, A1–A4, D1–D2, P1–P3, Q1–Q4, M1–M2. Most are now enforced by the framework itself:

- C1 (prepend `AGENT_PREAMBLE`) — framework does this automatically in `framework.agents.run()`.
- C3 (safe-write-json) — framework's `IDataStore` handles JSON safety. Scripts live in `baddabing-framework/scripts/`.
- C4 (agent isolation) — framework's agent runner enforces territory via `AgentDefinition.tools`.
- M2 (event names) — framework's `EventBus` validates against `[module].[agent].[subject].[verb]`.

Rules you still need to honor manually as a consumer:

- A1 (one curator = one schema = one territory)
- A3 (record errors, never silently skip)
- D1 (two data roots: `.config` shared, `candidate/tracker` per-module)

---

## 9. What the final shape looks like

New Hunt, post-scaffold, post-port, on disk:

```
F:\Git\the-hunt\
├── app/                    # Next.js App Router (mostly empty until you re-add routes)
│   ├── layout.tsx          # scaffold-emitted
│   ├── page.tsx            # scaffold-emitted (module links)
│   └── globals.css
├── modules/
│   ├── candidate/
│   │   ├── manifest.ts     # collections, personas, chatPersonas, hooks
│   │   ├── lib/            # ported prompts, curators, rubric engine
│   │   └── (routes later)
│   ├── tracker/
│   │   ├── manifest.ts
│   │   ├── lib/            # Judge, Scribe, evaluation metrics
│   │   └── (routes later)
│   └── registry.ts
├── .config/                # ported from old Hunt — schemas, characters, seeds
├── candidate/              # per-candidate live state dirs (gitignored subdirs)
├── tracker/                # per-role live state
├── app.config.json         # scaffold-emitted; edit to add tracker root
├── instrumentation.ts      # scaffold-emitted
├── next.config.js          # scaffold-emitted (includes webpack externalisers)
├── tsconfig.json
├── package.json            # @baddabing/framework via link: or version
├── CLAUDE.md               # scaffold-emitted
└── .claude/skills/         # copy scaffold-new-app + add-module-to-app here
```

---

## 10. First actions (do these in order)

1. **Clone the empty repo:**
   ```bash
   cd /f/Git
   git clone https://github.com/badda-bing/the-hunt
   cd the-hunt
   ```

2. **Confirm the framework is accessible:**
   ```bash
   ls ../baddabing-framework/GUIDE.md  # should exist
   cd ../baddabing-framework && pnpm test 2>&1 | tail -5  # should show 725 passing
   cd ../the-hunt
   ```

3. **Read the four framework docs** listed in §3 above. Don't skip GUIDE.md.

4. **Copy the two skills into the new repo** so the scaffold interview works:
   ```bash
   mkdir -p .claude/skills
   cp -r ../the-hunt-candidate-dino/.claude/skills/scaffold-new-app .claude/skills/
   cp -r ../the-hunt-candidate-dino/.claude/skills/add-module-to-app .claude/skills/
   ```

5. **Invoke `/scaffold-new-app`** with the spec from §4. Let the interview run; confirm before writing.

6. **Post-scaffold verification:**
   - `pnpm install`
   - `pnpm build` — next build succeeds
   - `npx tsc --noEmit` — clean

7. **Commit the scaffolded baseline** as commit 1: `"Scaffold: new-hunt via @baddabing/framework skill"`. Push to `main`.

8. **Set up the Feature Definitions directory** — before porting anything else:
   ```bash
   mkdir -p docs/features
   ```
   Then read §12 carefully. The discipline is: every feature gets a `docs/features/<id>.md` + failing tests BEFORE implementation. No exceptions.

9. **Start porting, feature by feature** — work the §12.6 priority list top-down. For each feature: write the Feature Definition → write failing tests → port/rebuild → green → commit. One feature per commit. Do not batch.

---

## 11. Verification you're still on track

After each feature lands, all of these must pass:

- `pnpm build` — Next.js builds clean
- `npx tsc --noEmit` — types pass
- `pnpm test` — every test across every ported feature, including the one just added

**The definition of "feature done":** its Feature Definition exists, its acceptance-criteria tests pass, and the full suite still passes. Any of those missing = feature not done; don't move on.

If any of these regress, stop and diagnose before adding more. The point of building on a locked framework is that Hunt's green is never framework's fault — if framework changes are needed, file a separate task, don't patch locally.

---

## 12. Features and tests — the discipline Hunt v2 is committing to

The old Hunt had loose feature boundaries: curators spawned via prompts, "does it work?" relied on eyeballing outputs, tests were thin against the hot code paths. Hunt v2 tightens this.

### 12.1 Every feature starts as a definition, not code

Before any feature lands in v2, write a **Feature Definition** (short markdown in `docs/features/<feature-id>.md` — or a section in the module's README). Format:

```markdown
# Feature: <id> — <one-line intent>

## Scope
What this feature does in one paragraph. Start with the user-observable behaviour, not the implementation.

## Inputs
- Shape / source of every input the feature consumes.

## Outputs
- Shape / destination of everything the feature produces.
- Events emitted (type + payload shape).
- Data written (collection + key).

## Non-goals
What this feature explicitly does NOT do. Catches scope creep at the design stage.

## Dependencies
- Framework surfaces used.
- Other Hunt modules or collections read.

## Acceptance criteria
Bullet list of observable conditions that must hold for the feature to be "done."
Each bullet maps 1:1 to a test below.
```

If a feature is too complex to write this down in under a page, split it. If it's too trivial to need this, it's probably not really a new feature — fold it into an existing one.

### 12.2 Test floor — non-negotiable

Per framework rule **P3** (every function isolated-testable, tested for success and failure), Hunt v2 adopts the same bar. For each feature:

- **Unit tests** — every pure function has a `.test.ts` next to it. Both success AND failure paths. No "happy path only."
- **Integration tests** — at least one test that exercises the feature through the same surfaces a real user would (route handler → framework → storage → back).
- **Contract tests** where a feature implements a framework interface — use the framework's existing contract test harness (`@baddabing/framework/testing`).

Tests are written **before** (or alongside) the port/implementation, not after. A feature with passing tests is a feature that's done; a feature without tests is a feature that isn't started.

### 12.3 What NOT to mock

The old Hunt mocked too much and missed real bugs. Rules for v2:

- **Don't mock the framework.** Use `@baddabing/framework/testing`'s `mockDataStore`, `mockEventBus`, `mockLLMClient`, `mockClock`, `mockEntropy`, `testHarness`. These are contract-parity mocks — tests that pass against them also pass against the real implementations. Rolling your own mocks bypasses that guarantee.
- **Don't mock databases in integration tests.** Use real SQLite (via the framework's test harness); the framework's `mockDataStore` exists for unit tests only.
- **Don't mock LLM responses in integration tests.** Use `mockLLMClient` with scripted responses if the feature's correctness depends on LLM output shape; only do this when the LLM call is pure-ish (classification, extraction). Skip the test if the LLM behaviour is the feature.

### 12.4 Feature porting checklist

For each feature ported from old Hunt:

1. **Define it first.** Write the Feature Definition in `docs/features/<id>.md`. Read the old Hunt's implementation ONLY to derive scope, inputs, outputs. Don't copy code patterns into the definition.
2. **Ask: is this still the right feature?** The old Hunt's features were shaped by old constraints. Sometimes the answer is "redesign this" rather than "port this."
3. **Write the tests.** Acceptance-criteria bullets → test cases. Run them; they should all fail (no implementation yet).
4. **Port / rebuild the implementation.** Framework-idiomatic.
5. **Tests pass.** If any acceptance criterion can't be tested, the criterion is wrong or untestable — fix the criterion.
6. **Run the full suite.** Make sure you didn't regress anything already ported.
7. **Commit:** `feat(<module>): <feature-id> — <one-line>`. Definition + tests + implementation in the same commit.

### 12.5 Test organization in Hunt v2

```
modules/candidate/
├── lib/
│   ├── completeness.ts
│   ├── completeness.test.ts        # unit
│   ├── curator-registry.ts
│   ├── curator-registry.test.ts    # unit
│   └── ...
├── integration/
│   ├── pipeline.integration.test.ts
│   └── reaudit.integration.test.ts
└── fixtures/
    ├── sample-intel.json
    └── sample-rubric.json
```

Run with `vitest run`. CI runs the same command. No per-feature skip conditions; if a test is flaky, fix the flake or delete the test (flaky tests are worse than missing tests).

### 12.6 Feature inventory — priorities for v2

Derived from old Hunt's ARCHITECTURE.md. Ordered by porting priority (highest value + lowest framework risk first):

1. **Candidate intel write/read** — baseline data access via `IDataStore`. Simplest, proves the substrate.
2. **Curator registry** — 20 curators with territory declarations. Pure config + validation; easy to test.
3. **Rubric engine / completeness scoring** — pure computation over intel; highly testable.
4. **Single curator run** — one agent → one schema → one write. Framework's `agents.run()` does the spawning.
5. **Curator orchestrator** — multi-curator coordination via pipeline orchestrator. Depends on (4).
6. **Armorer** — scoring agent that reads across collections and emits rubric outputs. Depends on (3) and (4).
7. **Researcher runs** — 6 researchers populating `_researcher_intel`. Depends on (4).
8. **Reaudit triggers** — event subscribers that re-run the armorer on intel changes. Depends on (6) + event subscriber pattern.
9. **Timeline gate** — pipeline step that blocks progression if timeline has gaps. Depends on (3).
10. **Upload pipeline** — user uploads → classify → curators → intel writes. Depends on (4), (5).
11. **Chat surfaces (candidate personas)** — framework.chat with persona per module. Depends on personas being defined in manifest.
12. **Tracker — Judge evaluation** — independent from candidate pipeline; its own feature slice.
13. **Tracker — Scribe (application materials)** — builds on Judge output.
14. **Admin dashboard** — defer until earlier features are solid. Not a blocker for Hunt being usable.

Each of these gets its own Feature Definition before porting starts. Don't batch — define one, test one, port one, commit one.

---

## 13. What to ignore in the old repo

You'll be tempted to open files and port incrementally. These are **time sinks** in the old repo — avoid unless you have a specific need:

- `app/admin/**` — dashboard UI, large, rebuild only when needed
- `app/api/**` — route handlers, rebuild cleanly
- `lib/*.ts` — mostly glue code superseded by the framework
- `scripts/*` — most are framework-level (now in the framework repo) or Hunt-specific one-shots (migration, etc.)
- `events/`, `candidate/pipeline-runs/`, `candidate/snapshots/` — runtime artifacts, not portable

---

## 14. If you get stuck

- **Framework gap:** if Hunt needs something the framework doesn't expose, stop. Don't patch Hunt around it. File a task, ask the user. The framework is locked; if it genuinely needs to grow, that's a framework-repo change, not a Hunt workaround.
- **Old Hunt's rule violates framework rule:** the framework wins. Refactor the port to match framework idioms.
- **Ambiguous domain logic in old Hunt:** ask the user before guessing. Much of the subtle behavior (reaudit triggers, curator territories) came from real user decisions; don't re-derive silently.

---

## Known open items (for context, not scope)

- Pre-existing audit bug: `entityHistory` ordering in the framework's DefaultAuditService. Reproduces on clean HEAD in the framework repo. Unrelated to Hunt but good to know.
- Framework principles doc ([framework_principles_and_open_questions.md](framework_principles_and_open_questions.md) in the old repo) describes an ambitious future direction — Change Team, Domain Expert, Charter, bus-driven discovery. **Out of scope for Hunt v2.** Build Hunt on the framework as it is.

---

**End of primer. Start with §10.**
