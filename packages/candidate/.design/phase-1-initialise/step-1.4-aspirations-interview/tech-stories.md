# Step 1.4 — Tech stories

## TS-1.4.1 — Oprah persona definition + 2-part brief

### Scope
Register the Oprah persona in the candidate module's manifest with the full 2-part interview brief. Oprah is a `ChatPersona` (per-session, spun up via `framework.chat`, not a permanent agent).

### Framework surfaces used
- `framework.chat.ChatPersonaRegistry` — persona registration via manifest
- `framework.chat` types — `ChatPersona` shape

### Custom work
- Add persona to `modules/candidate/manifest.ts` `chatPersonas: [...]`:
  ```ts
  {
    id: 'oprah',
    module: 'candidate',
    name: 'Oprah Winfrey',
    body: OPRAH_PERSONA_BODY,  // Her voice, warmth, probing style
    defaultModel: 'claude-sonnet-4-6',
    modulePulls: [
      { collection: 'intel/career/roles', label: 'Career timeline' },
      { collection: 'intel/career/skills', label: 'Skills captured' },
    ],
  }
  ```
- Persona body file: `modules/candidate/lib/personas/oprah.ts` — exports `OPRAH_PERSONA_BODY`
- 2-part brief file: `modules/candidate/lib/personas/oprah-brief.ts` — exports `ASPIRATIONS_INTERVIEW_BRIEF` (verbatim port of old Hunt's 2-part structure, ~1,176 tokens)

### Cherry-pick from old Hunt
- `actions-engine.ts:245-282` — 2-part brief verbatim (Part 1: vision 15min, Part 2: next-role specifics 15min)
- Old Hunt's character definitions for Oprah's voice

### Tests
see `tests.md` §Positive-TS-1.4.1 / §Negative-TS-1.4.1

---

## TS-1.4.2 — Chat session lifecycle + UI

### Scope
Interview starts a `framework.chat` session using the Oprah persona, with the 2-part brief as `initialContext`. UI streams the conversation. Pause/resume supported via framework chat's session API.

### Framework surfaces used
- `framework.chat.getChatService()` — for `start`, `send`, `pause`, `resume`, `end`
- `framework.chat.ChatSessionState` — session persistence
- `framework.events.bus` — session lifecycle events emitted automatically by framework.chat

### Custom work
- POST `/api/candidate/interview/start/route.ts` — `chat.start({ module: 'candidate', personaId: 'oprah', initialContext: ASPIRATIONS_INTERVIEW_BRIEF })` — returns `sessionId`
- Streaming chat route: POST `/api/candidate/interview/[sessionId]/turn/route.ts` — uses `chat.send(sessionId, userMessage)` and streams response chunks
- `framework.chat` already handles pause/resume; custom UI invokes those APIs
- Live chat page: `app/candidate/interview/[sessionId]/page.tsx`

### Cherry-pick from old Hunt
- `app/candidate/interview/live/[sessionId]/page.tsx` — layout + streaming handling
- `app/api/interview/chat/route.ts` — streaming pattern

### Tests
see `tests.md` §Positive-TS-1.4.2 / §Negative-TS-1.4.2

---

## TS-1.4.3 — Interview phase tracking (Part 1 vs Part 2) + termination

### Scope
Track which part of the 2-part interview we're in. Advance Part 1 → Part 2 when Oprah's internal signals say Part 1 is sufficient. End the interview when Part 2 is sufficient.

### Framework surfaces used
- `framework.chat` — `additionalContext` per turn to inject phase cues (e.g., "you're ~10 minutes into Part 1")
- `framework.chat` session state extension — carry `interviewPhase: 'part1' | 'part2' | 'complete'` in session metadata

### Custom work
- Session metadata schema extension for `interviewPhase`, `turnCount`, `part1SufficientSignals: boolean`
- Post-turn inspection: after each of Oprah's responses, a lightweight classifier judges whether Part 1 is "done enough" (covers vision dimensions: role type, org type, sector, 5/10-year success, what would make them decline dream role)
- Phase transition: when classifier says Part 1 complete → inject `additionalContext: "Move to Part 2 — concrete next-role specifics"` on next turn
- Termination: when Part 2 covers next-role specifics (title, seniority, engagement, compensation, sector, company size, location, deal-breakers) → Oprah wraps up

### Cherry-pick from old Hunt
- Old Hunt hardcoded the 30-min timer; v2 uses signal-based termination (matches vision's "measurable" better than fixed time)

### Tests
see `tests.md` §Positive-TS-1.4.3 / §Negative-TS-1.4.3

---

## TS-1.4.4 — Post-interview curator dispatch (aspirations + next-role + voice + narrative)

### Scope
When Oprah's session ends, dispatch the interview-applicable curators against the transcript. Each curator writes its territory with turn-level source citations.

### Framework surfaces used
- `framework.events.bus.subscribe('candidate.interview.completed', handler)`
- `framework.agents.runAgent` — per-curator agent runs
- `framework.data.put` — intel writes with provenance
- `framework.chat.getTranscript(sessionId)` — retrieve the JSONL transcript

### Custom work
- Subscriber `modules/candidate/lib/interview-curator-dispatch.ts`
- Applicable curators: Aspirations, Next-Role, Voice, Opinions, Personal Depth, Value, Positioning, Narrative
- Each curator gets: full transcript + persona-type hint ('oprah-aspirations')
- Schema for aspirations record: `aspiration_type`, `description`, `timeframe`, `confidence`, `source: { kind: 'chat-turn', sessionId, turnId, quote }`
- Schema for next-role record: `target_title`, `seniority`, `engagement_type`, `must_haves[]`, `deal_breakers[]`, etc. + same source shape

### Cherry-pick from old Hunt
- `.config/schemas/aspiration.schema.json` — schema port
- `.config/schemas/next-role-expectation.schema.json` — schema port
- `curator-registry.ts:166-186` — aspirations + next-role curator `curates[]` for prompt building

### Tests
see `tests.md` §Positive-TS-1.4.4 / §Negative-TS-1.4.4

---

## TS-1.4.5 — Interview-completed event + phase gate advance

### Scope
On `candidate.interview.completed` (specifically when it's the Oprah aspirations interview), after dispatch has succeeded, check whether Phase 1's aspirations gate is now satisfied. If so, signal Step 1.5 that aspirations are captured.

### Framework surfaces used
- `framework.events.bus` — emit `candidate.aspirations.captured` after successful dispatch
- `framework.data.list` — check aspirations + next-role collections have ≥1 record each

### Custom work
- Post-dispatch check: `isAspirationsCaptureComplete()` — returns true iff both collections populated
- Emit `candidate.aspirations.captured` with `{ aspirationCount, nextRoleCount }`

### Cherry-pick from old Hunt
- `interview/end/route.ts` — event emission pattern

### Tests
see `tests.md` §Positive-TS-1.4.5 / §Negative-TS-1.4.5
