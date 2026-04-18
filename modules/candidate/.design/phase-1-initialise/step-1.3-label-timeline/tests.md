# Step 1.3 — Tests

---

## User-story tests

### Positive-US-1.3.1 / Negative-US-1.3.1 — Visual timeline

**Positive:** Given 3 roles + 1 education interval, the timeline renders 4 bars positioned by date with correct widths.

**Negative:** With zero roles + zero education, the page shows an empty-state "No career data to visualise" + routes the candidate back to Step 1.2.

---

### Positive-US-1.3.2 / Negative-US-1.3.2 — Gaps highlighted

**Positive:** Given roles Jan 2020 - Jun 2022 and Sep 2022 - present, the 2-month gap (Jul–Aug 2022) shows as a highlighted block with "Please label this gap" CTA.

**Negative:** Zero gaps → the confirm button is immediately available; no gap indicators rendered.

---

### Positive-US-1.3.3 / Negative-US-1.3.3 — Label from list

**Positive:** Candidate picks "Career break" for a gap → label persists; gap's visual state changes to "labelled: Career break".

**Negative:** Candidate picks "Other" without providing custom text → the picker stays open, shows "Please provide a description", doesn't submit.

---

### Positive-US-1.3.4 / Negative-US-1.3.4 — Confirm button

**Positive:** With all gaps labelled, clicking "Confirm timeline" posts to the confirm route, succeeds, emits `candidate.timeline.confirmed`, and navigates to Step 1.4.

**Negative:** Clicking confirm with one gap still unlabelled → the route returns `ValidationError` with the unlabelled gap list; UI surfaces the error + highlights the offending gap.

---

### Positive-US-1.3.5 / Negative-US-1.3.5 — Overlaps

**Positive:** Role A (2020-01 to 2022-06) + Role B (2021-03 to 2023-01) — both render; their overlap (2021-03 to 2022-06) is visible as stacked bars. No gap generated for the overlap.

**Negative:** Two identical roles (same start + end + title) → deduped or flagged as a likely data error (not silently stacked).

---

## Tech-story tests

### Positive-TS-1.3.1 / Negative-TS-1.3.1 — Gap detection

**Positive:** `analyzeTimeline({ roles: [{start:'2020-01',end:'2022-06'},{start:'2022-10',end:'2024-01'}], education: [] })` returns `gaps: [{start:'2022-07',end:'2022-09',months:3,label:undefined,acknowledged:false}]`, overlaps: [].

**Negative:** `analyzeTimeline({ roles: [], education: [] })` returns empty gaps + overlaps + `isReady: true` (vacuously ready). Malformed date strings → throws `ValidationError`.

---

### Positive-TS-1.3.2 / Negative-TS-1.3.2 — Label set

**Positive:** `TIMELINE_GAP_LABELS` contains exactly the 7 expected labels.

**Negative:** Attempt to add a label outside the list (without "Other" sentinel) at the route → `ValidationError`.

---

### Positive-TS-1.3.3 / Negative-TS-1.3.3 — Labelling route

**Positive:** POST `/api/candidate/timeline/gap` with `{gapStart,gapEnd,label:"Career break"}` → 200; `timeline-gap-labels` collection has the record; event `candidate.timeline.gap-labelled` emitted.

**Negative:** POST with `label: "SomethingCustom"` but NO "Other" sentinel + `customText` → 400 ValidationError. POST with malformed dates → 400. POST with a gapStart/gapEnd that doesn't correspond to a real gap (per current `analyzeTimeline`) → 400.

---

### Positive-TS-1.3.4 / Negative-TS-1.3.4 — Confirm route

**Positive:** With all gaps labelled, POST `/api/candidate/timeline/confirm` → 200; emits `candidate.timeline.confirmed`; `isTimelineReady()` returns true afterwards.

**Negative:** POST confirm with one gap unlabelled → 400 with `details.unlabelledGaps: [{start,end}]`. No event emitted.

---

### Positive-TS-1.3.5 / Negative-TS-1.3.5 — Timeline UI

**Positive:** (component test) Rendering `<TimelineView>` with seeded data produces DOM with correct role bars, gap highlights, label pickers.

**Negative:** With no data, renders empty-state.

---

## Feature tests

(Covered by their tech stories — features and tech stories overlap heavily in this step because the UI IS the tech story.)

---

## Cross-cutting checks

- **Provenance (X-US-1):** Gap labels stored with `source: { kind: 'candidate-label', timestamp, label, customText? }`. The label IS the candidate's word — provenance satisfied by the act of labelling.
- **Event discipline (X-TS-3):** `candidate.timeline.gap-labelled` and `candidate.timeline.confirmed` follow envelope schema; correlation id propagates through the confirm flow.
- **Framework-default (X-TS-1):** All writes via `framework.data.put`; all events via `framework.events.bus`; no direct `fs`.
- **Timeline continuous (vision):** After `candidate.timeline.confirmed`, every month between `earliest` and `latest` is either covered by a role/education interval OR has a label. Tested via an integration test that re-runs `analyzeTimeline` after confirm.
