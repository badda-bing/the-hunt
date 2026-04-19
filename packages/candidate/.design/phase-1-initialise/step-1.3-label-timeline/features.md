# Step 1.3 — Features

## F-1.3.1 — Gap detection algorithm

### Shape
- Pure function `analyzeTimeline({ roles, education }): TimelineAnalysis` in `modules/candidate/lib/timeline-analysis.ts`
- Returns `{ gaps: Gap[], overlaps: Overlap[], earliest, latest, isReady: boolean }`
- Isolated — no framework dependencies; pure input → pure output

### Built from
- Tech story: TS-1.3.1
- No framework surfaces (pure computation)

### Tests
see `tests.md` §Positive-F-1.3.1 / §Negative-F-1.3.1

---

## F-1.3.2 — Visual timeline UI

### Shape
- `TimelineView` component
- Horizontal time axis from `earliest` to `latest`
- Role bars + education bars; stacked when they overlap
- Gap highlights rendered in-between with a "label needed" CTA
- Responsive to labelled-state changes (re-renders when a label lands)

### Built from
- Tech story: TS-1.3.5
- Framework primitives: `framework.ui.Card`, `framework.ui.Badge`
- Data source: F-1.3.1 (gap-detection output)

### Tests
see `tests.md` §Positive-F-1.3.2 / §Negative-F-1.3.2

---

## F-1.3.3 — Gap label picker

### Shape
- `GapLabelPicker` component per gap
- Dropdown with `TIMELINE_GAP_LABELS` options
- "Other" reveals a short text input for custom label
- On select/submit → POST to the label route (TS-1.3.3)

### Built from
- Tech story: TS-1.3.2, TS-1.3.3
- Framework primitives: `framework.ui.Button`, framework-ui forms (once they exist — for now custom)

### Tests
see `tests.md` §Positive-F-1.3.3 / §Negative-F-1.3.3

---

## F-1.3.4 — Confirm timeline button + gate

### Shape
- "Confirm timeline" CTA in the UI, disabled until every gap is labelled
- On click → POST to confirm route
- On success → advance UI to Step 1.4 (aspirations interview entry)
- On rejection (some gaps still unlabelled) → surface error, highlight the offending gaps

### Built from
- Tech story: TS-1.3.4
- Framework primitives: `framework.ui.Button`, `framework.ui.Alert`

### Tests
see `tests.md` §Positive-F-1.3.4 / §Negative-F-1.3.4
