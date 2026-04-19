# Step 1.3 — User stories

## US-1.3.1 — See my career as a visual timeline

**As a candidate,** I see my career displayed as a horizontal timeline — roles rendered as bars positioned by their dates, with education intervals shown separately.

**Why it matters:** Vision — *"rich, detailed, honest"*. Seeing my career visually helps me spot errors or omissions the module couldn't catch.

**Related tech stories:** TS-1.3.1, TS-1.3.5
**Related features:** F-1.3.2
**Tests:** see `tests.md` §Positive-US-1.3.1 / §Negative-US-1.3.1

---

## US-1.3.2 — See any gaps highlighted as needing a label

**As a candidate,** if there are periods between roles/education where nothing is recorded, I see those gaps visually highlighted with a "please label this gap" indicator.

**Why it matters:** Vision commitment 3 (Completeness over convenience) — gaps that matter are never quietly tolerated.

**Related tech stories:** TS-1.3.1, TS-1.3.2
**Related features:** F-1.3.1, F-1.3.3
**Tests:** see `tests.md` §Positive-US-1.3.2 / §Negative-US-1.3.2

---

## US-1.3.3 — Label each gap from a predefined list

**As a candidate,** for each gap, I can pick a label from a short predefined list (Career break, Education / Study, Parental leave, Travel, Health, Caregiving, Other). "Other" lets me add a custom label.

**Why it matters:** Vision — *"minimising their time"*. Predefined labels are faster than free text and keep labelling consistent; "Other" handles edge cases.

**Related tech stories:** TS-1.3.2, TS-1.3.3
**Related features:** F-1.3.3
**Tests:** see `tests.md` §Positive-US-1.3.3 / §Negative-US-1.3.3

---

## US-1.3.4 — Confirm the timeline is complete

**As a candidate,** once every gap is labelled, I see a "Confirm timeline" button. Clicking it marks the timeline as continuous and advances me to Step 1.4.

**Why it matters:** Vision — *"refusing to miss the full picture"* is enforced here; no half-labelled timelines.

**Related tech stories:** TS-1.3.4
**Related features:** F-1.3.4
**Tests:** see `tests.md` §Positive-US-1.3.4 / §Negative-US-1.3.4

---

## US-1.3.5 — See overlaps acknowledged, not flagged

**As a candidate,** if I was doing two things at once (e.g., a side project during my main job), the timeline shows the overlap without demanding I explain it away.

**Why it matters:** Vision — *"honest"*. Overlaps are real; demanding I pick one would flatten my history.

**Related tech stories:** TS-1.3.1
**Related features:** F-1.3.1
**Tests:** see `tests.md` §Positive-US-1.3.5 / §Negative-US-1.3.5
