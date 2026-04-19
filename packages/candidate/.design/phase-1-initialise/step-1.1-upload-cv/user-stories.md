# Step 1.1 — User stories

## US-1.1.1 — Upload my CV and see it accepted

**As a candidate,** I can drop my CV (PDF, DOCX, or plain text) onto an upload zone, and the module confirms it was received and stored.

**Why it matters:** Vision — the CV is the factual anchor every downstream claim traces back to. Until the module has a CV, it can't know me.

**Related tech stories:** TS-1.1.1, TS-1.1.2, TS-1.1.4
**Related features:** F-1.1.1, F-1.1.2, F-1.1.4
**Tests:** see `tests.md` §Positive-US-1.1.1 / §Negative-US-1.1.1

---

## US-1.1.2 — Rejected with a clear reason if my format is wrong

**As a candidate,** if I try to upload a file that isn't PDF / DOCX / plain text (e.g., a PNG image or an EXE), I see a specific rejection message explaining the format isn't supported.

**Why it matters:** Vision — *"minimising their time"*. Silent failures waste time; specific errors let the candidate fix the input and move on.

**Related tech stories:** TS-1.1.2
**Related features:** F-1.1.4
**Tests:** see `tests.md` §Positive-US-1.1.2 / §Negative-US-1.1.2

---

## US-1.1.3 — Know I can't proceed until I upload a CV

**As a candidate,** if I haven't uploaded a CV yet, the module shows only the upload door — no other navigation works, and the reason is explicit.

**Why it matters:** Vision — the CV is the hard gate for the entire module. Without it, there's no foundation to build on. The candidate shouldn't be confused about what's blocked.

**Related tech stories:** TS-1.1.3
**Related features:** F-1.1.3
**Tests:** see `tests.md` §Positive-US-1.1.3 / §Negative-US-1.1.3
