# CodeOne — Demo Video Script (1 Minute 45 Seconds)
## AI-Driven Standardization & Harmonization of Material Codes Across CPSEs
### PS 26099 | CPCL | Smart Automation

**Style: Single continuous screen recording. Start already logged in. Navigate with clicks. Voiceover throughout.**

---

## Pre-flight

Before you press record:
- Dev server running at `http://localhost:5173`
- Browser in a fresh private window so sessionStorage is clean
- The app seeds automatically with IOCL, NTPC, SAIL already loaded
- Have `bhel-materials.csv` ready — click **Import → "Sample lists" tab → pick "A tidy list with a high overlap"** in the script below

---

## The Script

### [0:00 – 0:15] OPENING — Dashboard

**[Screen: `/` — Dashboard. Three stat tiles: Items Read, Families, Duplicates flagged. Sidebar ITEM LISTS shows IOCL ✓, NTPC ✓, SAIL ✓]**

**VO:** "India's CPSEs each run their own ERP. The same bearing has four different codes, four different descriptions. CodeOne standardizes all of them against one national registry."

**VO:** "The Dashboard is the live view. Three companies are already loaded — IOCL, NTPC, SAIL. You see 20.34 lakh items, the family breakdown, and exactly how many duplicates the engine has found versus how many still need a human decision."

**[Quick hover on the stat tiles to show they are live numbers]**

---

### [0:15 – 0:40] THE IMPORT — Live Pipeline

**[Click sidebar: Import. Screen: `/import`]**

**VO:** "Now let's bring in a fourth company — BHEL, with its own material master. Watch the pipeline run."

**[Click: "Sample lists" tab → select "A tidy list with a high overlap" (BHEL)]**

**VO:** "42 rows of bearings, bolts, gaskets. The engine reads the CSV headers, detects the columns — Material Code, Description, UOM — and maps them automatically."

**[Click: "Load and score"]**

**VO:** "The ingest pipeline runs right here in your browser. Normalize, score, cluster, mint. Four stages."

**[As the progress indicator cycles through the four steps — Normalize → Score → Cluster → Mint — narrate:]**

**VO:** "Normalize every description into a canonical form. Score each pair against the existing corpus. Cluster near-matches. Mint a national code for each new item."

**[Three result groups appear: "Already known," "Needs a decision," "New to the registry"]**

**VO:** "Three groups. Already known — the engine found an existing match. Needs review — similar, but a human should confirm. And new items — nothing matched, so a fresh national code was minted."

**[Point to the sidebar ITEM LISTS — BHEL now has a checkmark]**

**VO:** "BHEL is now in the registry. You can see the sidebar updated live."

---

### [0:40 – 0:55] HUMAN REVIEW — Approve a Pair

**[Click sidebar: Duplicates. Screen: `/duplicates`]**

**VO:** "Pairs the engine wasn't certain about go here. This is the governance layer. The AI proposes. The human disposes."

**[Point to the first pair card under "Needs a decision" tab]**

**VO:** "Each card shows two records side by side — IOCL's original description on the left, NTPC's on the right. The score is shown. The tokens that differ are highlighted."

**[Click: "Yes, same item" (the green approve button)]**

**VO:** "One click. Both records now carry the same national code."

**[Point to the green "You agreed" chip and the national code badge that appeared inline]**

**VO:** "The card flips, the decision chip appears, and the national code drops in right there on the card. No navigation. No confirmation dialog. Just done."

---

### [0:55 – 1:15] THE AUDIT TRAIL

**[Click sidebar: Activity. Screen: `/activity`]**

**VO:** "Every action is logged. Every load, every match, every approve, every reject — timestamped, attributed, and exportable."

**[Point to the new entry at the top of the log]**

**VO:** "There it is. The approval we just made. Action: approved. Detail: which two records, which national code was assigned. Timestamped to the second."

**[Click the CSV export button]**

**VO:** "Export the entire log as CSV. Board-ready. Compliance-ready."

---

### [1:15 – 1:30] THE REGISTRY — The Deliverable

**[Click sidebar: Registry. Screen: `/registry`]**

**VO:** "The Registry is the deliverable. The National Code Book."

**[Click a cluster row to expand it]**

**VO:** "Every code is derived from the canonical signature of the cluster — reproducible, not allocated. Run the engine again with the same inputs, you get the same codes."

**[Point to the expanded member list]**

**VO:** "Here are the members — IOCL's original local code, NTPC's, BHEL's. All mapped to one national code. The ERP team loads this table and renames everything. Done."

---

### [1:30 – 1:45] CLOSING — Dashboard

**[Click sidebar: Dashboard. Screen: `/`]**

**VO:** "CodeOne. Dashboard, Import, Normalize, Matching, Duplicates, Registry, Migration, Activity, Engine. Nine working pages. One pipeline."

**VO:** "Real scoring, real clustering, real normalization. The import actually works — upload a CSV, paste rows, or pick a sample. The audit trail logs everything. And the engine is not a black box — the scoring arithmetic is visible on every card."

**VO:** "One Nation. One Material Code."

**[Fade out. Text overlay: *CodeOne — ONECODE | PS 26099 | CPCL | Ministry of Petroleum & Natural Gas*]**

---

## Timing

| Segment | Duration | Page | Key visual |
|---|---|---|---|
| Dashboard opening | 0:00 – 0:15 | Dashboard | Stat tiles, 3 loaded ITEM LISTS |
| Live import (BHEL) | 0:15 – 0:40 | Import | Pipeline step indicator cycling, 3 result groups |
| Approve a pair | 0:40 – 0:55 | Duplicates | Card flip, "You agreed" chip, national code badge |
| Audit trail | 0:55 – 1:15 | Activity | New approval entry, CSV export |
| Registry | 1:15 – 1:30 | Registry | Expand cluster, member codes |
| Closing | 1:30 – 1:45 | Dashboard | Full numbers, closing line |
| **Total** | **~1:45** | | |

## Presenter Notes

- **The import is the hero beat.** The pipeline step indicator cycling through Normalize → Score → Cluster → Mint is the visual proof that real processing is happening. Let it run — don't click away.
- **The approve click is the second hero beat.** One click, card flips, national code badge appears inline. This is the moment a judge understands the value: a human decision that scales across every ERP system.
- **Do not narrate over the import.** Let the pipeline indicator speak for itself. A few seconds of silence while it cycles is more convincing than "the engine is processing."
- **Use "Yes, same item" not "Approve."** That is the button label in simple mode — it reads more naturally on voiceover.
- **If you have time, hover on a score value** in the Duplicates page to show the 3-decimal precision (e.g. `0.913`). It signals care in the arithmetic.
- **The "Needs a decision" tab is the active tab** when you land on Duplicates — that is where the amber-zone pairs wait. Approved pairs move to "Agreed," rejected ones to "Rejected."
