---
name: add-module-to-app
description: "Add a new module to an existing @baddabing/framework-powered app. Use when the user wants to add a section, area, domain, or module to an app that already exists. Handles: extracting the ModuleSpec from conversation, checking for duplicates, writing the new manifest + updating registry + app.config.json. Examples: 'Add an invoices module to the consulting tracker', 'Create a new area for expense tracking', 'Add a contacts section'."
---

# add-module-to-app

Conversational skill for adding a module to an already-scaffolded app. The user talks; this skill interviews for the module spec, then invokes `addModule` to mutate the app in place.

## When to invoke

- User wants to add a new module/area/section to an EXISTING app
- User names a specific app context ("in the-hunt, add...") or the current working dir is inside an app
- User asks "how do I add a module"

**Do NOT invoke when:**
- No existing app is in scope — use `scaffold-new-app` instead.
- User wants to edit an existing module's code — that's normal code editing, not a scaffold op.

## Identify the target app

Before interviewing, determine which app the module goes in. Options in order of precedence:

1. User mentioned an app explicitly (e.g. "in the-hunt add…").
2. Current working directory is `apps/<name>/…` — use that app.
3. Only one app under `apps/` — use that one.
4. Ambiguous — ask the user which app.

The app root must contain `app.config.json` (otherwise it isn't a framework-scaffolded app).

## Flow

Three phases: **interview → confirm → generate**.

### Phase 1 — Interview

Extract the fields for a `ModuleSpec`:

1. **Module id (slug)?**
   - Lowercase, hyphens allowed.
   - Validate: matches `/^[a-z0-9][a-z0-9-]*$/`.
   - Check it's not already in the app's `app.config.json#app.modules`.

2. **Human name?**
   - The label shown in the sidebar.

3. **One-line description?**
   - Optional but encouraged — ends up in the manifest.

4. **Collections owned by this module?**
   - List of `{ id, kind }`.
   - `kind: 'user'` — data the user creates/owns (the default; P5 protects it from auto-purge).
   - `kind: 'derived'` — computed from user data.
   - Common default: one `user` collection named the module id's plural (`invoice` module → `invoices` collection).

5. **Base path?** (usually no)
   - Defaults to `/<id>`. Override only for rename cases.

6. **Icon?** (usually no)
   - Defaults to `/icons/<id>.svg`.

### Phase 2 — Confirm

Summarise and get explicit approval:

```
I'll add module "<id>" to apps/<appName>/:
  Name: <name>
  Description: <description>
  Collections: [<id>:<kind>, ...]

Files that will change:
  - apps/<appName>/modules/<id>/manifest.ts          (new)
  - apps/<appName>/modules/<id>/lib/.gitkeep         (new)
  - apps/<appName>/modules/registry.ts               (rewritten — adds import)
  - apps/<appName>/app.config.json                   (updated — adds to app.modules + storage.roots)

Proceed? [y/n]
```

### Phase 3 — Generate

One of two execution paths:

**Option A — inline `npx tsx`.** Write a one-shot TS file that reads the current app, calls `addModule`, and writes the result. This is the most direct:

```ts
// /tmp/add-mod-<timestamp>.ts
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { addModule, type ModuleSpec } from '@baddabing/framework/scaffold'

const root = '<absolute path to app>'
const modSpec: ModuleSpec = <spec object>

const current = new Map<string, string>()
for (const rel of ['app.config.json', 'modules/registry.ts']) {
  current.set(rel, await fs.readFile(path.join(root, rel), 'utf8'))
}
const out = addModule(current, modSpec)
for (const [rel, content] of out.files) {
  const full = path.join(root, rel)
  await fs.mkdir(path.dirname(full), { recursive: true })
  await fs.writeFile(full, content, 'utf8')
}
console.log(JSON.stringify(out.summary, null, 2))
```

Run via `npx tsx /tmp/add-mod-<timestamp>.ts`, then delete the temp file.

**Option B — direct edits via the Edit/Write tools.** Only if tsx isn't available. Compute the three file changes by hand by studying GUIDE.md §4 + existing manifests, then apply with the Write/Edit tools. Riskier — prefer Option A.

After generation, verify:
1. `cd apps/<appName> && npx tsc --noEmit` — types still compile.
2. If the app has tests, run `pnpm --filter <appName> test`.

### Report

Tell the user:
- Module created at `apps/<appName>/modules/<id>/`.
- The module's lib/ is empty — next step is adding business logic there (normal code editing).
- Sidebar entry will render at `<basePath>` once the app reboots.

## Error recovery

- **Duplicate module id**: `addModule` throws. Pick a different id.
- **App.config.json parse error**: the target app's config is malformed. Stop; tell the user the app itself is in a bad state.
- **Target app not found / not scaffolded**: instruct the user to use `scaffold-new-app` first.

## Out of scope

- Creating a new APP — use `scaffold-new-app` instead.
- Wiring an additional framework SURFACE (agents, chat, etc.) — use `addSurface` directly per GUIDE.md §3.
- Writing the module's business logic inside `lib/` — that's normal development, not a scaffold op.

## Related

- [packages/framework/GUIDE.md §4](../../../../baddabing-framework/GUIDE.md) — the `addModule` API in full.
- [packages/framework/MODULES.md](../../../../baddabing-framework/MODULES.md) — the module model.
