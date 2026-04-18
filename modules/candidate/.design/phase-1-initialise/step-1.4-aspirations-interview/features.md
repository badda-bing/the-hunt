# Step 1.4 — Features

## F-1.4.1 — Oprah persona registered

### Shape
- Persona entry in `modules/candidate/manifest.ts` `chatPersonas[]`
- Persona body + brief defined in `modules/candidate/lib/personas/oprah.ts` and `.../oprah-brief.ts`
- Default model: `claude-sonnet-4-6`

### Built from
- Tech story: TS-1.4.1
- Framework primitives: `framework.chat.ChatPersonaRegistry` (auto-registered via manifest at boot)

### Tests
see `tests.md` §Positive-F-1.4.1 / §Negative-F-1.4.1

---

## F-1.4.2 — Interview entry + start flow

### Shape
- CTA button on the Step 1.3 confirm screen: "Start aspirations interview with Oprah (30 min)"
- Click → POST `/api/candidate/interview/start` → returns `sessionId` → navigate to `/candidate/interview/[sessionId]`

### Built from
- Tech story: TS-1.4.2
- Framework primitives: `framework.chat.start`, `framework.ui.Button`

### Tests
see `tests.md` §Positive-F-1.4.2 / §Negative-F-1.4.2

---

## F-1.4.3 — Live interview screen with pause/resume

### Shape
- `app/candidate/interview/[sessionId]/page.tsx` — the live chat screen
- Message bubbles for candidate + Oprah
- Streaming token display for Oprah's replies
- Pause / resume buttons (wired to `chat.pause/resume`)
- Visible phase indicator ("Part 1: Vision" / "Part 2: Next-role")
- End-button visible only when Oprah signals completion (not arbitrary)

### Built from
- Tech stories: TS-1.4.2, TS-1.4.3
- Framework primitives: `framework.chat.send` (streaming), `framework.ui`

### Tests
see `tests.md` §Positive-F-1.4.3 / §Negative-F-1.4.3

---

## F-1.4.4 — Post-interview extraction

### Shape
- Event-subscriber service (not UI) at `modules/candidate/lib/interview-curator-dispatch.ts`
- On `candidate.interview.completed` with `personaId === 'oprah'`:
  - Load transcript
  - Run 8 curators (Aspirations, Next-Role, Voice, Opinions, Personal Depth, Value, Positioning, Narrative) in parallel
  - Emit `candidate.aspirations.captured` when both `aspirations` + `next-role-expectations` collections have ≥1 record

### Built from
- Tech stories: TS-1.4.4, TS-1.4.5
- Framework primitives: `framework.events.bus.subscribe`, `framework.agents.runAgent`, `framework.data.put`, `framework.chat.getTranscript`

### Tests
see `tests.md` §Positive-F-1.4.4 / §Negative-F-1.4.4

---

## F-1.4.5 — Captured aspirations display

### Shape
- Page section (on `/candidate` or dedicated `/candidate/aspirations`) showing the extracted aspirations + next-role records
- Each record shows its citation — clicking reveals the transcript turn with surrounding context

### Built from
- Tech story: TS-1.4.4
- Framework primitives: `framework.data.list`, `framework.ui.Card`

### Tests
see `tests.md` §Positive-F-1.4.5 / §Negative-F-1.4.5
