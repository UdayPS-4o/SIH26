# PRAHARI — SIH 2026 Presentation Content
## Problem ID: 26109 | DAHD | Ministry of Fisheries, Animal Husbandry & Dairying | Category: **Hardware**

> **Rule for this deck: every number on a slide has a source in [`domain-brief.md`](domain-brief.md) or [`plan.md`](../plan.md).** Anything marked UNVERIFIED in those files does not go on a slide. Judges from DAHD and ICAR know this domain; one fabricated statistic costs more than three good slides earn.

---

## Slide 1: Title Slide

**Title:** PRAHARI — *Predictive Risk Analytics for Herd Alerting & Rapid Intervention*
**Subtitle:** Catching mastitis two weeks before the farmer can see it — for ₹24 an animal

**Team:** [Your Team Name]
**Institute:** [Your Institute]
**Category:** Hardware | Agriculture, FoodTech & Rural Development

**Problem Statement ID:** 26109
**Organization:** Ministry of Fisheries, Animal Husbandry & Dairying | Department of Animal Husbandry & Dairying

**Visual Suggestion:** Deep indigo background. A single photograph of an Indian woman hand-milking a buffalo — that is the actual user, and putting her on slide 1 sets up every design decision that follows. Thin saffron/green accent rule. *Prahari* (प्रहरी) rendered in Devanagari alongside the Latin acronym.

**Speaker note:** "Prahari means sentinel. The system watches so the farmer doesn't have to."

---

## Slide 2: The Problem

**Title:** By the time you can see mastitis, you have already lost the money

**Content:**
- Mastitis is India's most expensive dairy disease — and the most invisible
- **Subclinical mastitis prevalence in India: 45%.** Clinical: 18% *(Krishnamoorthy et al., Res Vet Sci 2021 — meta-analysis of 103 Indian studies)*
- Subclinical cases show **normal milk and a normal udder**. They are found only by testing — and almost nobody tests
- SCM accounts for an estimated **70–80% of total mastitis losses**

**The money, in DAHD's own words** *(Strategy Document on the Prevention and Control of Mastitis)*:
> A high-yielding cow with mastitis loses **3–4 kg of milk per day** — **₹306–458/day** — plus **₹150–200/day** of milk discarded during the antibiotic withdrawal period.

- **₹1,390 lost per lactation** to subclinical mastitis; 49% milk value, 37% veterinary cost *(Sinha et al., Scientific World Journal 2014)*
- **₹7,165 crore/year** national loss — *the most-cited estimate, from **2009** (Bansal & Gupta). Say the year.*
- India loses **21% of yield** to mastitis vs ~11% in the US *(Bardhan 2013)*

**Visual Suggestion:** A timeline running left to right. Days −14 to 0 shaded grey and labelled "invisible — normal milk, normal udder, money already leaking." Day 0 in red: "farmer sees clots. Yield gone. Antibiotics start." Our intervention arrow lands at day −14.

---

## Slide 3: The Problem Behind the Problem

**Title:** Everyone already knows the answer. Nobody does it.

**Content:**
- Post-milking teat dipping costs a few rupees a day and is the single most effective preventive measure
- **Indian adoption: 2%** in a peri-urban Jaipur study; **25%** in a broader milking-practices review
- Ranked barriers *(Garret's Ranking, Punjab & West Bengal studies)*: lack of awareness · lack of technical skill · treatment cost · labour shortage · diagnostic difficulty

**The point:**
Decades of extension messaging have produced 2–25% adoption of a nearly free intervention. **Information has already failed.** More dashboards will not fix this.

What might work: a **specific, timed, named instruction, in her language, to the person actually holding the udder.**

> "Teat dipping is recommended" → ignored for thirty years.
> "Cow 47, right-rear quarter, dip after milking today" → a task, not advice.

**Visual Suggestion:** Two speech bubbles side by side, the first grey and crossed out, the second in Devanagari/Gujarati with a checkbox. Beneath: "60–80% of Indian dairy labour — including milking — is done by women." Design for her.

---

## Slide 4: The Solution

**Title:** PRAHARI — an early-warning sentinel that lives at the milk collection point

**Core idea:** Predict clinical mastitis **7–14 days before onset**, per animal and per herd, by fusing cheap sensors with data India is *already collecting*, and deliver one specific action to the person who milks.

**Six things it does:**
1. **Ingest** — AMCU records, retrofit sensors, farm records, lab SCC, farmer input, IMD weather
2. **Baseline** — score every animal against *her own* trailing history, never a global threshold
3. **Predict** — calibrated probability of clinical onset in the next 7–14 days
4. **Restrain** — cap alerts at ~5% of the herd per day so the system stays believable
5. **Explain & recommend** — SHAP drivers → a vet-reviewed intervention template
6. **Learn** — every alert's outcome is captured in one tap and retrains the model nightly

**Tagline:** *"Two weeks of warning, for the price of a cup of tea per animal."*

---

## Slide 5: How It Actually Works

**Title:** From a milk can to an instruction, in twenty minutes

**Visual:** `implementation-flow.png` — the half-slide funnel panel. Text sits beside it.

**The two ideas that carry the method:**

**1. The cow is her own control.**
Absolute conductivity, yield and activity vary enormously by breed (HF-cross vs Sahiwal vs Murrah buffalo), parity, days-in-milk and season. A global threshold on raw conductivity is exactly why the technique has a poor reputation. PRAHARI compares **Cow 47 today to Cow 47's own trailing 10-milking baseline**, as a robust z-score. Breed, stage and season fall out of the arithmetic instead of needing to be corrected for.

**2. Four quarters, one udder, one milking.**
Mastitis is a *quarter-level* event. Our strongest early feature is not the level of anything — it is **asymmetry across the four quarters at the same milking**: `max_q(EC) / median_q(EC)`. Ambient temperature, milking vacuum, the operator and the cow's mood all cancel, because all four quarters share them. **This is a matched-pairs design, and it is what buys the lead time.**

**Speaker note:** If asked "what's actually novel here" — it is these two, plus the alert budget. Not the sensor.

---

## Slide 6: The Hardware — and the decision that defines this entry

**Title:** We do not put hardware on the cow. We put it where the milk already goes.

**The trap every team will fall into:**
DeLaval Herd Navigator, Lely, Afimilk — every credible mastitis system in the world — is an in-line sensor in a robotic parlour costing **$50,000–150,000**. They work, and they are irrelevant here:
- **86% of Indian dairy farmers hold 1–5 animals**; the national average is **under 2 milking cows**
- **85.5% of milking is by hand**
- The shed has no reliable power

**What India already has, at national scale:**
- **228,374 village Dairy Cooperative Societies** *(NDDB, 2021-22)*
- Each with an **AMCU** already measuring **fat and SNF per farmer, per shift, twice a day**
- NDDB's own AMCU spec designs for *"no regular power supply, non-IT-savvy operators, dusty environments"*

**So our primary hardware is a ₹2,722 retrofit module on the AMCU sample path** — conductivity, milk temperature, CMT-assist — serving **100–500 animals per village**.

| | Unit cost | Per animal |
|---|---:|---:|
| **AMCU retrofit module** | ₹2,722 | **₹5–27** |
| Full village (module + gateway) | ₹7,072 | **₹24** |
| Handheld quarter wand (per household) | ₹2,094 | ₹419 |
| Collar (organised herds only) | ₹1,641 | ₹1,641 |

**Visual Suggestion:** Split slide. Left: a $50,000 robotic parlour, greyed out, captioned "designed for a farm that does not exist in India." Right: a photo of a village DCS collection counter with the module clipped on, captioned "₹24 per animal."

---

## Slide 7: The Tier Ladder — useful on day one, with zero hardware

**Title:** The system works before you buy anything

```
TIER 0   no hardware          app + animal records + IMD weather        ₹0/animal
         management-risk model: breed, parity, DIM, season, housing,
         teat-dip practice, prior mastitis history

TIER 1   existing AMCU        shift yield + FAT + SNF, already          ₹0/animal
         measured twice daily for tens of millions of animals
         → the free lunch nobody else is eating

TIER 2   AMCU module          + conductivity, milk temp, CMT-assist     ₹5–27/animal
         ◀── PRIMARY DELIVERABLE. Biggest lead-time gain per rupee.

TIER 3   per-animal           + quarter asymmetry (wand, ₹419)          ₹419–1,641
         + rumination/activity (collar, ₹1,641) — organised herds
```

**The point:** every tier is scored by the **same** calibrated pipeline — the model just sees more columns, and calibration is re-fit per tier so a Tier-0 farm gets honest probabilities rather than confident nonsense. A union deploys Tier 0/1 across every village on day one, and buys Tier 2 modules out of the losses avoided.

**Visual Suggestion:** A rising staircase, each step labelled with cost-per-animal, with a dotted line showing "useful from here" at Tier 0.

---

## Slide 8: The AI — and the numbers we are honestly measuring against

**Title:** A hazard model on cow-days, trained on the horizon we claim

**Formulation.** The unit of prediction is a **cow-day**. For cow *i* on day *t*:

> h_i(t) = P( clinical onset in (t+7, t+14] | no onset by t )

Fitted as a LightGBM binary classifier on cow-days, with positives drawn **only** from `[onset − 14, onset − 7]`. Days in `(onset − 7, onset]` are **blanked — dropped, not labelled negative** — because including them lets the model learn *"she is already sick,"* which is precisely the thing we are forbidden to do.

**Honest metrics.** Clinical mastitis prevalence in a cow-day panel is well under 1%. Accuracy is meaningless; AUC-ROC flatters. We report:
- **AUC-PR** (primary) · precision@k where k = the herd's daily alert budget
- **Lead-time distribution** — median and IQR of (onset − alert day)
- Calibration slope and intercept
- **Cross-validation grouped by herd**, never by cow-day — otherwise the same cow leaks across folds and every number is fiction

**The benchmark we hold ourselves to:**
> [Zhou et al., *Animals* 2026](https://doi.org/10.3390/ani16020204) — 255,772 records, SCR HR-Tag sensors — **AUC 0.789, sensitivity 0.500, specificity 0.947 at a 14-day horizon.**

**Any team promising 95% accuracy at 14 days is quoting a point-in-time detection paper as if it were forecasting, or has leaked the label.**

**Visual Suggestion:** The label-window timeline — a bar from onset−21 to onset, with `[−14,−7]` in green ("positives"), `(−7, 0]` in hatched grey ("BLANKED — leakage guard"), and the rest in pale blue ("negatives").

---

## Slide 9: Why conductivity alone is not the answer — and what we do instead

**Title:** We lead with the weakness, because the judges already know it

**The literature, stated plainly:**

| Evidence | Finding |
|---|---|
| Meta-analysis *(PubMed 1532805)* | EC alone: **~66% sensitivity, ~94% specificity**; poor PPV at low prevalence |
| Kandeel et al., *J Vet Intern Med* 2019 | Hand-held EC/ion meters: **AUC < 0.90 for every test**; *"not sufficiently predictive… to be recommended as clinically useful"* |
| Pan et al., *Front Vet Sci* 2025 | Same 93 cows: SCC-based AUC **0.952–0.981** vs EC-based **0.843–0.865** |

**Our answer is not a better electrode. It is:**
1. **Fusion** — EC + AMCU fat/SNF + yield + quarter asymmetry + behaviour + management risk factors
2. **The per-animal baseline** — a cheap electrode with stable *relative* response beats an expensive one used against a global cut-point
3. **The matched-pairs quarter comparison** — cancelling every confounder the four quarters share

**Speaker note:** Say this before a judge does. A team whose innovation *is* the conductivity sensor has already lost this exchange.

---

## Slide 10: Restraint — the feature nobody else will have

**Title:** A system that flags a fifth of the village gets uninstalled by Friday

**Content:**
- **Alert budget:** `max(1, ceil(0.05 × herd_size))` alerts per day. Candidates ranked by calibrated probability; only the top *k* notify. The rest go to a silent watchlist and are re-scored next milking.
- **Hysteresis:** enter HIGH at p ≥ 0.60, leave only below 0.45 — so no animal oscillates between bands twice a day.
- **One tap closes the loop:** confirmed / not confirmed / treated. That is a new training label, and it is why the model improves — PS capability #5, as a mechanism rather than an aspiration.

**Why this matters more than model accuracy:** the failure mode of every agricultural alerting product is alert fatigue. Precision at the budget is the metric farmers actually experience. We optimise for it explicitly.

**Visual Suggestion:** Two phone mock-ups side by side. Left: 8 red alerts out of 40 cows, captioned "day 4: uninstalled." Right: 2 alerts, one with a photo and a named quarter, captioned "day 400: still in use."

---

## Slide 11: Technical Architecture

**Visual:** `architecture.png` — rendered from [`architecture-diagram.md`](architecture-diagram.md) §1.

**One paragraph:** ESP32 nodes aggregate on-device and uplink over **LoRaWAN IN865** to a solar gateway that spools **72 hours** through a network outage. The gateway publishes MQTT into a single cloud VM running FastAPI, TimescaleDB, Valkey and Celery under Docker Compose. A nightly feature builder produces cow-day vectors dominated by per-animal deviations and within-udder asymmetry. LightGBM scores; isotonic calibration turns scores into probabilities; the alert budget decides who gets told; SHAP picks the intervention template; the farmer's confirm/deny feeds the next retrain.

| Layer | Pick | Licence |
|---|---|---|
| Edge | ESP32 + ESP-IDF | Apache-2.0 |
| LoRaWAN | ChirpStack | MIT |
| Broker | Eclipse Mosquitto | EPL-2.0 / EDL-1.0 |
| Buffer | **Valkey** (not Redis — SSPL/RSAL since 7.4) | BSD-3 |
| Store | TimescaleDB + PostGIS + H3 | Apache-2.0 core |
| API | FastAPI | MIT |
| Model | LightGBM + isotonic calibration | MIT |
| Survival cross-check | lifelines / XGBoost AFT | MIT / Apache-2.0 |
| Explain | SHAP TreeExplainer | MIT |
| Client | React PWA, offline-first, 7 languages | MIT |
| Maps | MapLibre GL + deck.gl (**not Mapbox GL v2+ — paid**) | BSD-3 / MIT |

**Speaker note if asked about licences:** we checked every one. We rejected GADM boundary data (non-commercial only), EMQX (BSL since v5.9), current Redis builds (SSPL/RSAL), Moirai (CC BY-NC), scikit-survival (GPL-3.0), and TimesFM 3.0 weights (non-commercial). Details in `plan.md` §5.

---

## Slide 12: No LLM in the prediction path — a deliberate refusal

**Title:** Nothing generative writes veterinary advice

**Content:**
- The risk model is gradient-boosted trees on tabular features. **CPU-only, milliseconds per cow, no GPU.**
- Recommendation text comes from a **fixed, vet-reviewed template catalogue** keyed by SHAP driver — never from a language model.
- **The system never names an antibiotic.** It recommends inspection, hygiene, milking order, and vet referral. Treatment decisions stay with the registered veterinarian.

**Why this is a feature:** a hallucinated treatment recommendation in a livestock-health product is a liability, not a demo. It is also the AMR argument — see slide 14.

The only neural components are at the edges and are cleanly excisable: **AI4Bharat IndicConformer** (ASR, MIT) and **Indic Parler-TTS** (Apache-2.0) for the voice interface.

---

## Slide 13: Multilingual, Mobile, Offline

**Title:** Built for the person actually doing the milking

**Seven languages, chosen by dairy geography:** Hindi · Gujarati (Amul/GCMMF) · Marathi · Punjabi · Telugu · Tamil (Aavin) · Kannada (KMF/Nandini). All seven are covered by the AI4Bharat stack.

| Component | Model | Licence |
|---|---|---|
| Translation | `ai4bharat/indictrans2-*` (200M distilled for CPU) | MIT |
| Voice in | `ai4bharat/indic-conformer-600m-multilingual` | MIT |
| Voice out | `ai4bharat/indic-parler-tts` | Apache-2.0 |

- **PWA, offline-first** — installs from a link, no app store, works on a low-end Android, syncs when signal returns
- **Voice prompts** for low-literacy users; the alert can be *heard*, not just read

**The deployment gotcha most teams will miss:**
> SMS to Indian numbers requires **TRAI DLT registration** under TCCCPR 2018 — three layers (principal entity, sender header, exact content template), with carrier-side scrubbing that silently drops any message differing from the registered template **by one character**. Needs PAN/GST, takes 1–3 weeks. WhatsApp Business API needs Meta verification, template approval, a BSP, and per-message pricing since 1 July 2025.
>
> **Neither is achievable in a hackathon window.** We demo on FCM push and ntfy, and present DLT as the documented path to production.

**Speaker note:** Knowing DLT exists is itself the credibility signal. Most teams will promise SMS alerts without knowing.

---

## Slide 14: Impact — economics and antimicrobial resistance

**Title:** Early detection *is* antimicrobial stewardship

**The AMR chain, stated properly:**
> Caught **subclinical** → hygiene and management fix it.
> Caught **clinical** → an antibiotic, usually broad-spectrum, usually without culture, often without the withdrawal period being observed.

**The evidence:**
- *Staphylococcus* β-lactam resistance in Indian mastitis isolates: **71.36% organised / 76.59% unorganised sector** *(Antibiotics 2026;15(3):256)*
- Indian dairy farmers show very low AMR awareness and **rarely observe withdrawal periods**; residues are documented in milk *(Frontiers in Public Health 2022)*
- **FSSAI's October 2024 amendment** expanded the regulated antibiotic list to **27 substances**
- **NAP-AMR 2.0 (2025–2029)** names optimising antimicrobial use in animals as a strategic priority

**Impact per village society (300 animals, ₹7,072 of hardware):**

| | Figure |
|---|---|
| Subclinical prevalence | 45% *(Krishnamoorthy 2021)* |
| Loss per affected lactation | ₹1,390 *(Sinha 2014)* |
| Hardware cost per animal | **₹24** |
| Break-even | **A single prevented case pays for ~58 animals' worth of hardware** |

*(Show the arithmetic on the slide. Do not present a projected national savings figure — you cannot source it.)*

---

## Slide 15: Interoperability — a module DAHD can absorb, not a rival app

**Title:** We plug into the spine that already exists

- **95% of India's ~303 million bovines already carry a 12-digit Pashu Aadhaar ear tag.** Every risk score and alert is keyed to it.
- Health events serialise to the **[ICAR Animal Data Exchange](https://github.com/adewg/ICAR) schema** — Apache-2.0, public, actively maintained. `/export/ade` is a real endpoint a judge can call.
- Geographic layer uses **DataMeet** open boundaries — *not GADM, which is non-commercial and non-redistributable.*

**What we do NOT claim:**
> INAPH, Bharat Pashudhan and NDLM have **no public developer portal, Swagger spec or documented schema** that we could find. Government messaging describes a planned open-API third-party interface; we could not verify it as shipped. **Live integration requires a DAHD/NDDB data-sharing MoU.** We say so rather than fake it.

**The positioning, in one line:** PRAHARI is a predictive module DAHD can absorb into Bharat Pashudhan — not another app farmers must additionally install.

---

## Slide 16: What we will and will not claim — and the roadmap

**Title:** The honest scorecard

**What is real in the prototype:**
- Working AMCU-module hardware on the bench, producing live conductivity + temperature
- End-to-end pipeline: ingest → features → hazard model → calibration → alert budget → SHAP → multilingual recommendation → outcome capture → retrain
- Farmer PWA, vet console, cooperative GIS view
- Deployed with `docker compose up`

**What is simulated, and labelled as such everywhere:**
> **There is no public, animal-level, mastitis-labelled Indian sensor dataset.** We searched data.gov.in, ICAR, NDDB, NDRI, Kaggle, Mendeley, Zenodo, UCI and HuggingFace. We use the one CC-BY dataset that does exist *([Mendeley 10.17632/kbvcdw5b4m.1](https://data.mendeley.com/datasets/kbvcdw5b4m/1))* plus a seeded simulator whose parameters are a published, citation-backed table a judge can audit. It says "SIMULATED" in the UI, in this deck, and in the README.

**Roadmap:**
| Phase | What |
|---|---|
| **1** | Labelled data partnership — ICAR-NIVEDI / NDRI Karnal / a milk union's existing CMT programme |
| **2** | Field validation at one district union; report lead-time distribution stratified by cattle vs buffalo |
| **3** | Custom PCB, WPC ETA certification, LiFePO4, AD5933 impedance front end |
| **4** | DAHD MoU → live Bharat Pashudhan integration; district GIS surveillance for state AH departments |

---

## Slide 17 (backup): The five questions that could sink us

Keep this slide hidden and pull it up in Q&A. Full answers in [`domain-brief.md`](domain-brief.md) §8.

1. *"Conductivity is a weak diagnostic."* → Agreed, and we said so on slide 9. Our claim is fusion + per-animal baseline, not a better electrode.
2. *"Where's your Indian ground-truth SCC data?"* → We don't have it, nobody does publicly, and here is the phase-1 partnership plan.
3. *"Indian cows are hand-milked in ones and twos with no power."* → Exactly why the hardware is at the AMCU, not on the animal.
4. *"Will farmers actually act on an alert?"* → Default evidence says no (2–25% teat-dip adoption). Our three answers: the right person, one named action, and delivery through channels they already trust.
5. *"Shouldn't DAHD just build this into Bharat Pashudhan?"* → Probably eventually, yes — which is why it is designed from day one to be absorbed.

---

## Design Guidelines

### Colour Palette
| Role | Colour | Use |
|---|---|---|
| Base | `#101828` deep indigo | Backgrounds |
| Primary | `#0E7490` teal | Hardware, data flow |
| Accent | `#B45309` amber | Risk, alerts, the "Moderate" band |
| Alarm | `#BE123C` crimson | The "High" band only — use sparingly, it should feel rare |
| Calm | `#065F46` green | "No risk", savings, confirmations |
| Neutral | `#F4F4F4` / `#94A3B8` | Diagram fills, secondary text |

Match the risk-band colours in the deck to the risk-band colours in the UI. Judges notice when they differ.

### Typography
- Headings: Inter / Poppins SemiBold, 36–44 pt
- Body: Inter Regular, 20–24 pt — **nothing below 18 pt**
- Devanagari/Gujarati: Noto Sans Devanagari / Noto Sans Gujarati — bundle them, do not rely on the projector's fonts
- Numbers on impact slides: 60 pt+, one number per visual

### Visual Rules
1. **One idea per slide.** If a slide needs a paragraph read aloud, it is two slides.
2. **Every statistic carries its source in 12 pt beneath it.** This is the single cheapest credibility signal in the deck and most teams skip it.
3. **Show the woman milking.** Slide 1 and slide 3. She is the user; the deck should look like it knows that.
4. **Photograph the hardware.** A real bench photo of the AMCU module beats any render. Category is Hardware — they will look for it.
5. **Screenshot the real UI, not a mock-up.** Include the "SIMULATED DATA" badge in the screenshot rather than cropping it out.
6. ASCII/monospace diagram blocks from `architecture-diagram.md` screenshot cleanly at ~13 pt and read better than redrawn boxes.

### Slide Budget for a 10-minute Pitch
Slides 1, 2, 3, 4, 5, 6, 8, 10, 14, 16 — ten slides, roughly one minute each. Slides 7, 9, 11, 12, 13, 15 and 17 are the appendix you pull up when asked. **Slide 6 (hardware) and slide 9 (the honest conductivity slide) are the two that differentiate this entry — do not cut either for time.**
