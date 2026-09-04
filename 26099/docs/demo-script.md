# CodeOne — demo script

**PS 26099 · AI-Driven Standardization and Harmonization of Material Codes Across CPSEs**
Ministry of Petroleum & Natural Gas / CPCL

Runs 9–11 minutes. Every number below is printed by `npm run demo:numbers`; if a
figure is not in that output it does not get said out loud. Re-run it after any
change to the corpus, the dictionary or the thresholds.

---

## Before you start

```bash
cd 26099/frontend && npm run dev
```

Then, in order:

1. Open `http://localhost:5173` in a **fresh tab**, maximised, at 1600px or wider.
2. The sidebar must read **`3 of 4 government companies loaded`** with CIL struck
   through. If it says 4 of 4, click **Start over** in the top right.
3. Leave the view toggle on **Simple**. You will switch to Technical once, on cue.
4. **Open `26099/frontend/public/masters/` in a file manager and put that window
   where you can reach it.** You will drag `cil-inhouse.csv` out of it onto the
   page. This is the single most important piece of staging in the demo — dragging
   a file off the desktop is what proves the data is not baked in.
5. If dragging is awkward in your recording setup, the drop zone has a small
   **"or pick the file"** link that opens the file picker. Same code path.

Sanity check before recording — all three must pass:

```bash
npm run check:masters && npm run check:truth && npm run demo:numbers
```

---

## Act 1 — Three companies, one missing (0:00–0:50)

**Where:** Overview. Three masters are loaded, CIL is not.

> "Four government companies buy the same bearing. Each one calls it something
> different, so each one gave it its own code, and none of them can see the other
> three. That is the problem — four purchase orders, four sets of stock, one part."

Point at the sidebar: **`3 of 4 government companies loaded`**.

> "Three of them are already in here — Indian Oil, NTPC, and the Steel Authority.
> Twenty lakh item records, and the system has already worked out that two hundred
> and ten distinct items sit underneath them."

Scroll to the source panel. Point at the fourth row: **`CIL · not sent yet`**.

> "Coal India has not sent theirs. Let us add them and watch what changes."

---

## Act 2 — Drag Coal India in (0:50–2:00)

**Drag `cil-inhouse.csv` from the file manager onto the drop zone.** Not a button
— pick the file up off the desktop and drop it on the page.

> "This file is not in the application. It is sitting on my desktop and I am
> handing it over, the same way Coal India would."

The run takes **about 24 seconds**. Narrate the stages as they light up:

> "It opens the connection. Pulls the master. Expands every abbreviation against a
> hundred and fifty-six dictionary rules. Works out which records are even worth
> comparing — that is the line that says twelve lakh comparisons skipped, and it
> is the reason this is possible at all. Then it scores what is left, groups what
> it accepts, and mints a code for each group."

Numbers on screen while it runs:

| | |
|---|---|
| items read from CIL | 3,76,000 |
| rate | ~15,700/s |
| under it | *projected from the 90-row extract in this demo* |

> "Fifteen thousand records a second, which is about what a bulk extract with
> normalization behind it costs. And it says underneath that the run is projected
> from the ninety-row sample in this demo — I am not going to pretend you watched
> three lakh rows go past."

### The payoff — read this table out

**What this list changed**, at the bottom of the panel:

| | before | after | |
|---|---|---|---|
| items in the registry | 283 | **373** | +90 |
| national codes | 210 | **256** | +46 |
| codes more than one company uses | 54 | **69** | +15 |
| waiting for a person | 16 | **22** | +6 |

> "Ninety items came in. Forty-six of them were genuinely new and got a new code.
> The other forty-four were things the country already buys — and fifteen more
> codes are now shared across organisations than were a minute ago. That is
> fifteen items where Coal India and somebody else can finally see each other."

Point at the sidebar badge, now **22 to check**.

> "And six more pairs went into the queue for a person. It did not pretend to be
> certain about those."

---

## Act 3 — Coal India's items are really there (2:00–2:40)

**Sidebar → Search items.** Click the **CIL** filter chip.

> "Ninety records, with Coal India's own local codes — CIL slash MM — and their
> own way of writing things, slash-separated. Every one of them now carries a
> national code in the last column."

Type `6205` in the search box and expand the first row.

> "One bearing. All four companies. And now you can see the stock: Indian Oil has
> a month and a half of cover, SAIL has five months of the same part sitting on a
> shelf. Neither could see the other until thirty seconds ago."

---

## Act 4 — One part, four names (2:40–4:30)

**Scroll down** to `02 One part, four names`.

The four lines are already on screen. Read them out — this beat only works if the
room hears how different they are:

```
IOCL   BRG BALL DG 6205 2RS SKF                    NOS
NTPC   BALL,BEARING,DEEP,GROOVE,6205,2RS           EA
SAIL   BALL BEARING DEEP GROOVE 6205 2RS FAG       PCS
CIL    BRG/BALL/DG/6205/2RS                        NO
```

> "One bearing. Four descriptions, four punctuation styles, four unit codes, two
> different manufacturers named. No text search finds these four."

**Click:** `1. Clean up the names`

> "Every short form expanded against the dictionary. BRG becomes BEARING. DG
> becomes DEEP GROOVE. 2RS becomes DOUBLE RUBBER SEALED. NOS, EA, PCS and NO all
> collapse to EACH."

**Click:** `2. Compare them`

> "One point zero zero zero, against all three. Not similar — identical, once the
> words have been made comparable."

**Click:** `3. Give it one code`

Point at `CNMC-BE-73AE`.

> "That code is not a serial number handed out in order. It is computed from the
> item's own attribute signature, so the same part gets the same code on any
> machine, in any order, in any state. That matters when eighty organisations are
> minting codes at once."

Signature on screen: `BEARING|BALL, DEEP GROOVE|DOUBLE RUBBER SEALED|6205`

### Then break it on purpose

**Click into the IOCL line** (the first text box), select all, and type:

```
HYDRAULIC PUMP 10HP 415V
```

Editing a line clears the three steps — steps 2 and 3 grey out on purpose, so a
stale score can never sit under a changed input. So run them again:

**Click:** `1. Clean up the names`, then `2. Compare them`

> "Nought point one four eight, against an accept threshold of nought point eight
> eight. And it says why: the noun is BEARING on one side and PUMP on the other.
> It does not guess and it does not quietly merge. That is the property you need
> in a code book — the failures have to be legible."

**Click:** `Reset`.

---

## Act 5 — What it costs (4:30–6:30)

**Sidebar → Duplicates.** Three numbers across the top:

| | |
|---|---|
| Same item | 176 |
| Needs a person | 22 |
| Different items | 1,089 |

> "It does not pretend to be certain. A thousand and eighty-nine pairs it rejected
> outright, a hundred and seventy-six it is confident about, and twenty-two it
> will not decide on its own."

> "Twenty-two is small on purpose. When two lines contradict each other on a
> stated fact - a different bore, a different class, a different grade - that is
> not a question, so it is rejected outright rather than put in front of a person.
> Everything left in this queue is something a human genuinely has to settle."

Point at the first row of the queue:

```
IOCL   VLV GATE WCB 100NB CL150 FLGD IS 14846
NTPC   VALVE,GATE,WCB,100NB,CL150,FLANGED,RISING STEM,IS,14846        0.946
```

> "Nought point nine four six — well above the accept line. It still stopped,
> because NTPC's line says RISING STEM and Indian Oil's does not. They do not
> disagree, but they do not agree either. Silence is not confirmation. A person
> settles this one, and the system records who."

**Sidebar → Savings.**

> "Rupees ninety-six point six crore a year."

**Click:** `How the number is built`.

| step | value | assumption |
|---|---|---|
| 1 Duplicate line items found | 7,55,952 | 31.4% duplicate rate, measured on the 373 records anyone can open |
| 2 Realistically consolidatable | 1,66,309 | 22% — running contracts and vendor qualification block the rest |
| 3 Addressable annual spend | Rs 1097.6 crore | Rs 66,000 average annual spend per item |
| 4 Saving from joint tendering | **Rs 96.6 crore** | 8.8% discount on the consolidated volume |

> "Four steps, three assumptions, all three editable. Drag any of them and the
> number moves. I would rather show you an argument you can attack than a figure
> you have to take on trust."

**Sidebar → Search items.** Type `6205` in the search box, then expand the first row.

> "And this is why duplicate codes cost money rather than just being untidy. One
> bearing. Indian Oil holds one and a half months of cover; SAIL holds five point
> two months of the same part. Neither can see the other. Under one code, they can."

*(Stock across the slice: Rs 77.3 crore, of which Rs 51.5 crore — 67% — sits under
a code more than one organisation uses.)*

---

## Act 6 — A fifth organisation arrives (6:30–8:00)

**Sidebar → Add new data → `Sample lists` → "A pipeline list with genuinely new items"** →
`Load this list` → `Match against the national registry`.

The headline reads: **10 of 37 items you sent already exist under a national code.**
Underneath: **4 need a person to decide, and 23 are new** and were given a fresh code.

> "This is the day-two workflow. A fifth CPSE sends a spreadsheet, and within
> seconds it knows which of its items the country already has a code for, which
> need a person to look, and which are genuinely new. No project, no consultant,
> no six-month data cleanse."

The three sample lists, if you want a different one:

| list | rows | already coded | need a person | new |
|---|---|---|---|---|
| A tidy list with a high overlap (BHEL) | 41 | 26 | 2 | 13 |
| A pipeline list with genuinely new items (GAIL) | 37 | 10 | 4 | 23 |
| A messy export with ragged rows (HAL) | 31 | 23 | 2 | 6 |

The messy one also reports **2 unreadable lines by line number** rather than
silently dropping them — worth showing if anybody asks about data quality.

Note the Duplicates badge in the sidebar goes up after this: the rows that need a
person join the same queue as everything else, which is the point.

---

## Act 7 — Show the machinery (8:00–9:00)

**Toggle to `Technical`** (top right).

> "Same screens, different register. Every panel now names the endpoint that
> produced it, with latency and how many records it read."

**Sidebar → Add new data.** Point at the column mapping if the panel is open.

> "The four extracts arrive with four different header rows — a SAP ECC material
> list, an S/4HANA product extract, an Oracle EBS item query, and a spreadsheet
> somebody keeps by hand. Nobody mapped those columns by hand. Six of the seven
> Oracle columns were matched by inference, and the interface flags each one as a
> guess so an operator can correct it."

**Sidebar → Engine** (Technical only) if asked about tuning.

Close on the Overview:

> "The fourth of those lists was on my desktop ninety seconds ago. Everything it
> changed on this screen, you watched happen."

---

## Numbers you are allowed to say

Anything in `npm run demo:numbers`. The ones that come up:

| | |
|---|---|
| Records in the working slice | 373 (IOCL 95 · NTPC 91 · SAIL 97 · CIL 90) |
| Full corpus across four masters | 24.1 lakh |
| Dictionary rules | 156 |
| Candidate pairs | 1,287 (176 same · 22 review · 1,089 different) |
| National codes | 256 (69 shared by 2+ organisations, 187 single) |
| Duplicate records | 117 — 31.4% of the slice |
| Largest group | 4 |
| **Wrong merges** | **0** |
| **Codes covering more than one real item** | **0** |
| Matches missed | 18, of which 13 rejected outright |
| Annual saving | Rs 96.6 crore |
| Stock in the slice | Rs 77.3 crore, 67% under a shared code |
| Accept / review thresholds | 0.88 / 0.72 |

---

## Questions you will get

**"Is this real CPSE data?"**
No, and no such dataset is public. The problem statement says the CPSEs supply it.
This is a generated corpus of real MRO lines — bearings, valves, cable, fasteners
to actual IS and DIN standards — where each organisation writes the same item the
way that kind of material master really writes it: SAP short forms, comma-joined
long forms, Oracle-style descriptions, slash-joined codes. What is being
demonstrated is the method, and the method does not care where the strings came from.

**"How do I know it isn't just showing me a prepared answer?"**
The application ships with an empty registry. Everything on screen came out of four
CSV files that are sitting on disk and that you can open. Edit one and reload —
the numbers change. There is a script, `npm run check:masters`, that reads those
four files and asserts they reproduce the corpus exactly.

**"How do you know the matches are right?"**
The corpus generator knows which records came from the same physical item, and
`npm run check:truth` grades every merge against that. It currently reports zero
wrong merges and zero codes covering more than one item, and it exits non-zero if
that ever stops being true. It also reports the 18 matches we miss, which is the more
honest number, and it fails if the review queue ever contains a pair that
contradicts on a stated fact.

**"Where is the AI?"**
Today the matcher is a scored ensemble — lexical similarity, attribute agreement,
numeric tolerance — over a normalizer with a 156-rule domain dictionary, with a
weighting fitted offline and a human in the loop above the review threshold. That
is what carries the demo, and it is deterministic and auditable, which a code book
has to be.

There is a fine-tuned sentence transformer in `backend/app/data/codeone-minilm/`,
trained with a 40% item-level hold-out. It lifts AUC on unseen items from 0.616
off-the-shelf to 0.824. It is **not** wired into this build. The 13 pairs at the
bottom of `check:truth` — HOOTER against SIREN, PENSTOCK against SLUICE GATE,
BULB against LUMINAIRE — are exactly the cases no dictionary reaches and the model
does. Say that as the next step; do not claim it is running.

**"What about scale? 24 lakh records is 2.9 × 10¹² comparisons."**
Which is why nothing compares everything. Records only become candidates when they
share a family and a significant token. The console reports comparisons skipped
next to comparisons made on every load.

**"What if two organisations disagree about an item?"**
It goes to the review queue with the specific reason attached, a person decides,
and the decision is recorded in Activity history against their name. The system
never overrides a human decision — a rejection holds even if the score later rises.

---

## If something goes wrong

| symptom | do this |
|---|---|
| A load bar is frozen | You switched windows. Click back into the page; it resumes. |
| Sidebar reads 4 of 4 before you start | **Start over**, top right — it returns to three loaded. |
| You pressed reload mid-demo | It restores what was loaded. **Start over** for a clean run. |
| The drop does nothing | The file must be `.csv`. Use **or pick the file** instead. |
| It says "already been loaded" | CIL is in. **Start over** and drop it again. |
| A source card says "Could not read the extract" | The dev server is not serving `public/masters`. Restart `npm run dev`. |
| Somebody asks you to prove it is not hardcoded | **Start over**, then drag a CSV from the file manager onto a source row. |

---

## Recording checklist for the video

- Fresh tab, maximised, 1600px+, Simple view, empty registry.
- Zoom the browser to 110% if the recording is going on a projector.
- Record the four loads in **one continuous take** — the whole argument is that
  nobody cut away while the data appeared.
- Do not cut away during the 24-second load. The whole argument is that nobody
  touched anything while the numbers moved.
- Get the drag itself on camera — file manager visible, file picked up, dropped.
  That five seconds of footage is worth more than any slide.
- Do the failure drill in Act 4. A demo where nothing fails looks staged.
- End on the Overview with all four loaded, not on a sub-page.
