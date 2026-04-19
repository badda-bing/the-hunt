# Step 1.2 — User stories

## US-1.2.1 — See what the module extracted from my CV

**As a candidate,** after my CV is uploaded, I see a summary of what the module extracted — roles, dates, education, skills, and anything else it could pull out — organised by category.

**Why it matters:** Vision — *"Know the candidate…"*. I need to see what the module *thinks it knows* so I can confirm it's right before the module acts on it.

**Related tech stories:** TS-1.2.1, TS-1.2.2, TS-1.2.3
**Related features:** F-1.2.1, F-1.2.2, F-1.2.4
**Tests:** see `tests.md` §Positive-US-1.2.1 / §Negative-US-1.2.1

---

## US-1.2.2 — Every extracted item cites its source in my CV

**As a candidate,** for every intel record the module shows me, I can see (or click through to) the exact phrase, sentence, or section in my CV that it came from.

**Why it matters:** Vision commitment 1 (Provenance) — every view derivable back to something I said. The CV is what I said; citations make it traceable.

**Related tech stories:** TS-1.2.3
**Related features:** F-1.2.3, F-1.2.4
**Tests:** see `tests.md` §Positive-US-1.2.2 / §Negative-US-1.2.2

---

## US-1.2.3 — Confirm or correct the extraction

**As a candidate,** I can confirm an extracted record as correct, edit it if it's wrong, or delete it if it doesn't apply. My corrections replace what was extracted and carry their own provenance (a note that this came from me directly, not from CV parsing).

**Why it matters:** Vision — *"honest"* + *"rigorous"*. The module should not silently persist wrong extractions, and my corrections should be as first-class as its extractions.

**Related tech stories:** TS-1.2.5
**Related features:** F-1.2.5
**Tests:** see `tests.md` §Positive-US-1.2.3 / §Negative-US-1.2.3

---

## US-1.2.4 — Know when extraction is "enough" to move on

**As a candidate,** once I've reviewed the extracted intel and confirmed what's correct, I see a clear signal that Step 1.2 is done and I can proceed to Step 1.3 (timeline review).

**Why it matters:** Vision — *"minimising their time"*. I shouldn't be stuck reviewing forever; I should know when I'm done.

**Related tech stories:** TS-1.2.5 (confirmation state), cross-cut to TS-5 (phase 1 gates)
**Related features:** F-1.2.5
**Tests:** see `tests.md` §Positive-US-1.2.4 / §Negative-US-1.2.4
