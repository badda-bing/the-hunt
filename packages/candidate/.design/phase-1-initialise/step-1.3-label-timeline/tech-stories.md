# Step 1.3 — Tech stories

## TS-1.3.1 — Timeline gap detection (coverage-bitmap algorithm)

### Scope
Pure computation: given the set of career roles + education intervals, return the list of uncovered month ranges ("gaps"). Overlaps are permitted and don't generate gaps.

### Framework surfaces used
- `framework.data.list` — read roles from `intel/career/roles`, education from `intel/career/qualifications`

### Custom work
- `modules/candidate/lib/timeline-analysis.ts` — `analyzeTimeline({ roles, education }): { gaps: Gap[], overlaps: Overlap[], earliest, latest }`
- Coverage-bitmap algorithm (port verbatim from old Hunt):
  - Convert all intervals' `start_date`/`end_date` to month-number offsets
  - Build a `Set<monthNumber>` of covered months
  - Find contiguous uncovered month ranges within `[earliest, latest]`
- Gap shape: `{ start: 'YYYY-MM', end: 'YYYY-MM', months: number, label?: string, acknowledged: boolean }`

### Cherry-pick from old Hunt
- `timeline-analysis.ts:88-213` — algorithm port verbatim (tight, well-tested code)
- Gap shape from old Hunt

### Tests
see `tests.md` §Positive-TS-1.3.1 / §Negative-TS-1.3.1

---

## TS-1.3.2 — Gap label set (predefined + "Other")

### Scope
The list of labels available to the candidate. Fixed list plus "Other" escape hatch.

### Framework surfaces used
- None — config constant

### Custom work
- `modules/candidate/lib/timeline-labels.ts` — exported constant `TIMELINE_GAP_LABELS = ['Career break', 'Education / Study', 'Parental leave', 'Travel', 'Health', 'Caregiving', 'Other'] as const`
- TypeScript union type `TimelineGapLabel = typeof TIMELINE_GAP_LABELS[number] | string` (string allows Other's custom value)

### Cherry-pick from old Hunt
- `TimelineReview.tsx:43-53` — label set reference

### Tests
see `tests.md` §Positive-TS-1.3.2 / §Negative-TS-1.3.2

---

## TS-1.3.3 — Gap labelling API route

### Scope
POST route that records a label for a specific gap. Gaps are identified by `{ start, end }` tuple since they're computed derivatives, not stored entities.

### Framework surfaces used
- `framework.data.put` — persist the label to a `timeline-gap-labels` derived collection
- `framework.errors.wrap`
- `framework.events.bus` — emit `candidate.timeline.gap-labelled`

### Custom work
- POST `/api/candidate/timeline/gap/route.ts`
- Request body: `{ gapStart: 'YYYY-MM', gapEnd: 'YYYY-MM', label: TimelineGapLabel, customText?: string }`
- Writes to `timeline-gap-labels` collection; key by `<gapStart>_<gapEnd>`
- Emit event on success

### Cherry-pick from old Hunt
- `app/api/candidate/timeline/route.ts` `action: 'label-gap'` branch

### Tests
see `tests.md` §Positive-TS-1.3.3 / §Negative-TS-1.3.3

---

## TS-1.3.4 — Timeline confirm route + event

### Scope
POST route that validates the timeline is ready (every gap labelled) and emits `candidate.timeline.confirmed`. If any gap is unlabelled, rejects with a list of which gaps are missing labels.

### Framework surfaces used
- `framework.data.list` — read roles + education + gap-labels
- `framework.errors.wrap`
- `framework.events.bus` — emit `candidate.timeline.confirmed`

### Custom work
- POST `/api/candidate/timeline/confirm/route.ts`
- Logic: `analyzeTimeline()` → filter unlabelled gaps → if any, reject `ValidationError({ unlabelledGaps })`; else emit `candidate.timeline.confirmed` with `{ gapCount, overlapCount, earliest, latest }`
- `isTimelineReady()` helper for other code to check state

### Cherry-pick from old Hunt
- `app/api/candidate/timeline/route.ts:34-48` confirm branch
- `workflow-rotator.ts` (gate sequencing)

### Tests
see `tests.md` §Positive-TS-1.3.4 / §Negative-TS-1.3.4

---

## TS-1.3.5 — Visual timeline UI

### Scope
Interactive component that renders roles + education as horizontal bars, gaps as highlighted boxes with a label picker, overlaps as stacked bars.

### Framework surfaces used
- `framework.ui` — Card, Button, Badge primitives
- Next.js client component

### Custom work
- `modules/candidate/components/timeline/TimelineView.tsx` — renders the visualisation
- `modules/candidate/components/timeline/GapLabelPicker.tsx` — dropdown of TIMELINE_GAP_LABELS + custom-text for Other
- `app/candidate/timeline/page.tsx` — page that uses these components

### Cherry-pick from old Hunt
- `TimelineReview.tsx` (317-520) — render patterns, gap detection display, confirm button wiring

### Tests
see `tests.md` §Positive-TS-1.3.5 / §Negative-TS-1.3.5
