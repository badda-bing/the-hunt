---
name: scaffold-new-app
description: "Create a new @baddabing/framework-powered app via conversational interview. Use when the user wants to scaffold, create, bootstrap, spin up, or start a new project/app/tool from scratch using this workspace's framework. Handles: extracting the AppSpec from conversation, validating, writing files, running post-steps. Examples: 'I want to build a new app for tracking X', 'Spin up a project to manage Y', 'Start something fresh for Z'."
---

# scaffold-new-app

Conversational skill that turns user intent into a scaffolded, buildable framework-powered app. The user talks; this skill interviews, proposes, and writes.

## When to invoke

- User wants to start a NEW app or project in this workspace
- User mentions creating/scaffolding/bootstrapping something fresh
- User asks "how do I start a new app" or similar

**Do NOT invoke when:**
- User is in an existing app and wants to add a module — use `addModule` directly (see [packages/framework/GUIDE.md](../../../../baddabing-framework/GUIDE.md) §4).
- User wants to add a surface to an existing app — use `addSurface` directly (GUIDE.md §3).
- User is editing code inside an already-scaffolded app.

## Flow

The skill has three phases: **interview → confirm → generate**.

### Phase 1 — Interview

Extract the fields for an `AppSpec`. Do it conversationally, one question at a time unless you can safely derive the answer. Favour good defaults over unnecessary questions.

Questions to work through (skip any you can answer from context):

1. **What should the app be called?**
   - Convert the user's answer to a slug: lowercase, hyphens, alphanumeric.
   - If user says "Invoice Tracker" → `invoice-tracker`.
   - Validate: matches `/^[a-z0-9][a-z0-9-]*$/`.

2. **One-line description?**
   - Short, goes into package.json and CLAUDE.md.

3. **What are the main things this app will track or manage?**
   - Each thing is (likely) a module.
   - Ask for subdivisions if unclear: "Is 'contacts' and 'companies' one module or two?"

4. **For each module, what collections does it own?**
   - Collections are the data types the module stores.
   - Every collection has `kind: 'user' | 'derived'`:
     - `user` — data the user creates/owns (invoices, notes, contacts). **Cannot be auto-purged (P5).**
     - `derived` — computed from user data (stats, indexes, caches).
   - If unsure, default to `user` — it's the safer choice.

5. **Anything LLM-specific?** (usually no)
   - Defaults: Anthropic provider id `default`, API key from `ANTHROPIC_API_KEY`, default model `claude-sonnet-4-6`.
   - Override only if the user explicitly wants a different provider or model.

6. **Package manager?** (usually no)
   - Defaults to `pnpm` (matches the workspace).

Don't ask about `surfaces` — default to `['config', 'data', 'events']`. Other surfaces (chat, knowledge, agents, etc.) can be added later once the app is boots.

### Phase 2 — Confirm

Before writing anything, present a complete summary and get explicit approval:

```
I'll generate "<name>" at apps/<name>/ with:

  Description: <description>
  Modules:
    - <id1> (<name>) — collections: [<id>:<kind>, ...]
    - <id2> (<name>) — collections: [...]
  Surfaces: config, data, events (default set)
  LLM: Anthropic (ANTHROPIC_API_KEY)

Proceed? [y/n]
```

Wait for user confirmation. Do not write files speculatively.

### Phase 3 — Generate

Once approved:

1. **Write the spec to a temporary JSON file.**
   Use the `Write` tool with a path under the system tmp directory, or `mktemp`.

2. **Invoke the scaffold CLI:**
   ```bash
   npx tsx ../baddabing-framework/scripts/scaffold-new-app.ts \
     --target apps/<name> \
     --spec <tmp-spec-path>
   ```
   The script exits non-zero on error (validation failures, target already populated, etc.). The JSON it prints on success contains the summary + the post-steps you'll need.

3. **Run pnpm install.** From the workspace root. This picks up the new workspace member.

4. **Run pnpm --filter <name> build.** Verifies the generated code compiles cleanly with Next.js. If it fails, show the error to the user — do not try to hand-fix generated files; regenerate with a corrected spec instead.

5. **Clean up the temp spec file.**

6. **Report to the user:**
   - Path to the new app.
   - How to run it: `pnpm --filter <name> dev`.
   - Where the app-specific CLAUDE.md lives (`apps/<name>/CLAUDE.md`).

## AppSpec reference

For full details, see [packages/framework/GUIDE.md §2](../../../../baddabing-framework/GUIDE.md).

```ts
interface AppSpec {
  name: string
  description?: string
  modules: Array<{
    id: string
    name: string
    description?: string
    collections?: Array<{ id: string; kind: 'user' | 'derived' }>
  }>
  // omit the rest unless user specifically asks
}
```

## Example session

**User:** "I want an app to track consulting clients and their invoices."

**Assistant** (interview):
1. Name: `consulting-tracker`? (derived from context)
2. Description: "Track consulting clients and their invoice lifecycle"?
3. Modules I'm hearing: `client` (the firms you work with), `invoice` (billed and paid status). Sound right?
4. `client` collections: just `clients`, kind=user. `invoice` collections: `invoices` + maybe `payments` (so you can split billed-vs-received). Both user-kind?
5. Skip LLM (defaults) + pm (pnpm).

**Assistant** (confirm):
```
I'll generate "consulting-tracker" at apps/consulting-tracker/ with:
  Description: Track consulting clients and their invoice lifecycle
  Modules:
    - client (Clients) — collections: [clients:user]
    - invoice (Invoices) — collections: [invoices:user, payments:user]
  Surfaces: config, data, events
  LLM: Anthropic
Proceed? [y/n]
```

**User:** yes

**Assistant** (generate):
- Writes spec to `/tmp/spec-xxx.json`
- `npx tsx ../baddabing-framework/scripts/scaffold-new-app.ts --target apps/consulting-tracker --spec /tmp/spec-xxx.json` → summary JSON
- `pnpm install` → picks up new workspace member
- `pnpm --filter consulting-tracker build` → compiles clean
- Cleanup temp spec
- Reports: app ready at `apps/consulting-tracker/`, run with `pnpm --filter consulting-tracker dev`

## Error recovery

- **Spec validation fails** (e.g. name collision, bad slug): the CLI prints the error. Go back to Phase 1, fix the specific field, retry.
- **pnpm install fails**: usually a dependency constraint. Let the user see the error; don't auto-retry with different versions — the scaffold templates are the contract.
- **pnpm build fails**: this indicates a bug in the scaffold templates themselves. Do NOT hand-patch the generated app. Instead: flag as a framework-level bug (spawn a task with the exact build error), and tell the user their spec is fine but the framework needs a fix.

## Out of scope

- Adding modules to an EXISTING app — use `addModule` directly (GUIDE.md §4).
- Adding surfaces — use `addSurface` directly (GUIDE.md §3).
- Publishing the app to npm — not a scaffold concern.
- Deploying — not a scaffold concern.
