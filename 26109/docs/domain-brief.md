# PRAHARI — Domain & Policy Brief (PS 26109)

Everything a team member needs to survive a Q&A with a DAHD or ICAR judge who has spent thirty years around dairy cattle. Read this before the deck, not after.

**Every figure below carries a source and a year. Items marked UNVERIFIED must not go on a slide.**

---

## 1. The Indian dairy system we are actually building for

| Metric | Figure | Source / Year |
|---|---|---|
| Total milk production | **239.30 million tonnes** (+3.78% YoY) | [Basic Animal Husbandry Statistics 2024, DAHD](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2077745), 2023-24 |
| Share of world milk output | ~25% — the world's largest producer | [DAHD Year End Review 2024](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2086052) |
| 10-year CAGR | ~6% vs global ~2% | DAHD, 2014-15 → 2023-24 |
| Livestock share of agricultural GVA | 30.23% (up from 24.38% in 2014-15) | PIB, 2022-23 |
| Top milk states | UP 16.21% · Rajasthan 14.51% · MP 8.91% · Gujarat 7.65% · Maharashtra 6.71% | DAHD, 2023-24 |
| Cattle / buffalo population | Cattle 192.9M · Buffalo 109.85M (total livestock 535.78M) | **20th Livestock Census, 2019** |
| 21st Livestock Census | Conducted Oct 2024 – Feb 2025, ₹200 cr, fully digitised, ~87,000 enumerators, 219 indigenous breeds | [DAHD brochure](https://dahd.gov.in/sites/default/files/2024-10/BrochureOf21stLivestockCensus.pdf) — **results not confirmed released. Check before the pitch.** Use 2019 figures with the caveat stated |
| Smallholder share of milk | 62–72% depending on study/region | FAO review; Karnataka study, various |
| Herd size | **86% of dairy farmers hold 1–5 animals**; national average is **under 2 milking cows per household** | USDA GAIN 2021/22; [peri-urban 5-city study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7348999/) |
| Village Dairy Cooperative Societies | **228,374** | NDDB, 2021-22 |
| Amul / GCMMF | 18,600 village societies, 3.64M farmer members, 35M litres/day | 2023-24 |
| Animals digitally registered | Bharat Pashudhan: **34+ crore animals, 9.4+ crore owners**, 15.5+ crore service entries, ~1.6 lakh/day. **~286.5M of ~303M bovines (95%) ear-tagged** | Oct 2025 NDLM workshop reporting |

**The number that drives our architecture:** under two milking animals per household, hand-milked (85.5% hand milking, 84% by the "knuckling" method), twice daily, **by women — who perform 60–80% of Indian dairy labour** including milking, feeding and health observation. Any interface that assumes a male head-of-household reading English on a smartphone is designed for the wrong user.

---

## 2. Mastitis clinical facts

### Definitions and thresholds

- **Clinical mastitis**: visibly abnormal milk (flakes, clots, watery), udder heat/swelling/pain, sometimes fever and off-feed.
- **Subclinical mastitis (SCM)**: milk and udder look normal; SCC is elevated. Invisible without a test — which is why it accounts for the majority of the economic loss.
- **California Mastitis Test (CMT)**: cow-side reagent lyses somatic cells; viscosity/gel change indicates elevated SCC. Scored negative / trace / 1 / 2 / 3. Designed for **subclinical** detection ([WikiVet](https://en.wikivet.net/California_Mastitis_Test)).
- **SCC threshold**: **200,000 cells/mL** is the National Mastitis Council convention, corroborated by IDF (1997). >300,000 at cow level is considered highly likely infected. The EU **bulk-tank** food-safety limit of 400,000 is a *regulatory* limit, not a diagnostic one — do not conflate them. **The diagnostic cut-point is genuinely contested**: values from 100,000 to 310,000 appear in the literature depending on method and breed ([PMC6048081](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6048081/)).

> **Design consequence:** our SCC threshold is a config value, not a constant, and the validation report includes a sensitivity analysis across 150k / 200k / 300k. Indian HF-crossbred studies have used up to 310,000, and buffalo baselines differ again.

### Milk electrical conductivity — the honest picture

**Physiological basis is real:** mastitis damages the blood–milk barrier tight junctions, letting Na⁺ and Cl⁻ leak into milk while K⁺ falls. That raises conductivity ([ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S1881836615300240)).

**The performance is not good enough alone, and we must say so first:**

| Evidence | Finding |
|---|---|
| Meta-analysis, [PubMed 1532805](https://pubmed.ncbi.nlm.nih.gov/1532805/) | EC alone: **sensitivity ~66%, specificity ~94%**, low positive predictive value in low-prevalence populations |
| Kandeel et al., *J Vet Intern Med* 2019, [PMC6766502](https://pmc.ncbi.nlm.nih.gov/articles/PMC6766502/) | Hand-held Na/K/Ca/EC meters: **AUC < 0.90 and +LR < 10 for every test**. Authors conclude they *"were not sufficiently predictive… to be recommended as clinically useful diagnostic tests"* standalone. Cisternal Na alone outperformed EC |
| [Pan et al., *Front. Vet. Sci.* 2025](https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2025.1671186/full) | SCC-based models AUC **0.952–0.981**; EC-based models AUC **0.843–0.865** on the same 93 cows |

This is the load-bearing citation set for the entire sensor-fusion argument. **Lead with it.** A team that presents a conductivity sensor as the innovation has already lost to any judge who knows this literature; a team that opens with "conductivity alone gets ~66% sensitivity, here is what we do about it" has established credibility in one sentence.

### Pathogens in India

| Finding | Source |
|---|---|
| *Staphylococcus*, *Streptococcus* and *E. coli* dominate Indian mastitis cases, with high regional variability | [Meta-analysis of Indian studies 1995–2016, PMC8147236](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8147236/) |
| Haryana: 77.5% CMT-positive; 98.05% culture-positive among CMT-positives | [ICAR ePubs](https://epubs.icar.org.in/index.php/IJAnS/article/view/152989) |
| Punjab (Narowal): *S. aureus* in 42.5% of cases — subclinical 45.8% > clinical 37.5% | [Veterinary World 2024](https://www.veterinaryworld.org/Vol.17/June-2024/3.pdf) |

**Contagious vs environmental is the distinction that drives the recommendation engine:**

- **Contagious** (*S. aureus*, *Strep. agalactiae*, *Mycoplasma*, *C. bovis*) — spread cow-to-cow **at milking**. → Interventions: milking order, post-milking teat dip, disinfecting cloths and equipment between animals, culling chronic shedders.
- **Environmental** (*E. coli*, *Klebsiella*, *Strep. uberis/dysgalactiae*) — from bedding and surroundings. → Interventions: bedding hygiene, drainage, teat-end condition, fly control. Tends to cause acute clinical rather than chronic subclinical disease.

Our SHAP drivers map onto this split: a contagion-proxy driver (milked after a known positive) produces contagious-pattern advice; a THI/bedding driver produces environmental-pattern advice. That is the difference between a recommendation engine and a fortune cookie.

### Risk factors validated in Indian studies

| Factor | Finding |
|---|---|
| **Season** | Incidence peaks in **monsoon**, lowest in summer — multiple Indian studies |
| **Breed** | Crossbreds consistently more susceptible. Punjab study: crossbred SCM 72.3% vs indigenous 65.6% vs nondescript 47.2%. Deoni 31% vs crossbred 65%. Buffalo teat keratin / streak canal is cited as protective |
| **Age / parity** | Peak SCM prevalence at 9–11 years (90.32%) in a Punjab buffalo study |
| **Lactation stage** | Mid-lactation highest (76.5%) > early (67.3%) > late (61.3%) in one buffalo study |
| **Management** | Owner education, labour type and post-milking feeding practice were all significantly associated with SCM risk (Punjab) |

### Preventive interventions — and the adoption gap that is our real opportunity

| Practice | Indian adoption |
|---|---|
| Post-milking teat disinfection | **2%** in a peri-urban Jaipur study; 25% in a broader milking-practices review |
| Dry cow therapy | ~70% dry off for >2 months, but blanket antibiotic dry therapy rather than modern selective therapy |
| Milking order, clean bedding, fly control, udder washing | Inconsistent. One study found all farmers washed hands / splashed water, but downstream hygiene collapsed |

Barriers ranked by Garret's Ranking in Punjab and West Bengal studies: **lack of awareness, lack of technical skill, treatment cost, labour shortage, diagnostic difficulty.**

> This is the strategic point of the whole product. Decades of extension have produced 2–25% adoption of a preventive measure that costs a few rupees a day. Information alone has demonstrably not worked. What might work is a **specific, timed, animal-named instruction delivered in the local language to the person actually doing the milking** — "Cow 47, right-rear, dip after milking today" beats "teat dipping is recommended" by an enormous margin. Our product is that difference.

---

## 3. Economics and AMR

### The national loss estimates — cite the range, not one number

| Study | Estimate | Year |
|---|---|---|
| Dandha & Sethi | ₹529 million/year | 1962 |
| Varshney & Naresh | ₹2,370 crore/year (SCM ≈ 70% of loss) | 2004 |
| **Bansal & Gupta** — the most-cited modern figure | **₹7,165.51 crore/year** (₹4,151.16 cr subclinical + ₹3,014.35 cr clinical); Punjab alone ₹503.49 cr | **2009** |
| Bardhan | ₹575 million/year; yield reduction **21% in India vs 11% in the US** | 2013 |

**Caveat you must state on the slide:** the ₹7,165 crore figure is from **2009** and is still being cited in 2025 material (it appears in ICAR's own presentations). It is a citation chain — neither of our research passes could open the Bansal & Gupta original. Present it as *"the most-cited estimate, from 2009"*, not as a current-year number. A judge who knows the provenance will respect the caveat and distrust anyone who omits it.

### The best primary citation available — and it is DAHD's own

> **[DAHD Strategy Document on the Prevention and Control of Mastitis](https://dahd.gov.in/sites/default/files/2025-02/StrategyDocumentonthePreventionandControlofMastitisV-Final.pdf)**
>
> A high-yielding cow with mastitis loses **3–4 kg of milk per day**, costing **₹306–458 per day**; discarded milk during treatment costs a further **₹150–200 per day**.

This is the department we are pitching to, quantifying the problem in its own words. It belongs on slide 2. **Action item: someone must open this PDF and read it end to end before the deck is finalised** — neither research pass could fully machine-extract it, and there is more in there worth quoting.

Other Indian figures:

- **₹1,390 per lactation** lost to subclinical mastitis — 49% milk-value loss, 37% veterinary expense; 187 animals, Central India, peer-reviewed and open access ([Sinha, Thombare & Bandyopadhyay, *The Scientific World Journal* 2014](https://onlinelibrary.wiley.com/doi/10.1155/2014/523984)). **This is the most directly verifiable per-case figure we found.**
- SCM accounts for an estimated **70–80% of total mastitis losses** in India — invisible, untested, uncounted.
- Mastitis is often described as the **#2 cause of culling after infertility** — **UNVERIFIED against a primary source. Do not state it as fact.**

### AMR — where this project meets national policy

| Item | Detail |
|---|---|
| **NAP-AMR 2017–2021** | India's first National Action Plan on AMR (MoHFW), six strategic priorities including optimising antimicrobial use in animals and food ([WHO-hosted PDF](https://cdn.who.int/media/docs/default-source/antimicrobial-resistance/amr-spc-npm/nap-library/national-action-plan-on-amr-(india).pdf)) |
| **NAP-AMR 2.0 (2025–2029)** | Current version, stronger One Health framing and quantitative targets ([NCDC](https://ncdc.mohfw.gov.in/uploads/pdf/amr10.pdf)) |
| Colistin | Banned in food animals since 2019 |
| Schedule H1 (2013) | Prescription plus three-year record-keeping for listed antibiotics |
| **FSSAI** | MRLs for 103 antibiotics/veterinary drugs, Codex-aligned. **October 2024 amendment expanded the regulated list to 27 substances** (adding amoxicillin, cephalexin, gentamicin, penicillin G, sulfamethazine, sulfadimethoxine) |
| Resistance in mastitis isolates | *Staphylococcus* spp. β-lactam resistance **71.36% organised / 76.59% unorganised sector**; CMT-positive prevalence 45.78% organised vs 54.65% unorganised — 391 households, southern + northeastern India ([*Antibiotics* 2026;15(3):256](https://doi.org/10.3390/antibiotics15030256)) |
| Field reality | Indian dairy farmers show very low AMR awareness, commonly use broad-spectrum antibiotics without diagnosis, and **rarely observe withdrawal periods**; residues have been documented in milk ([Frontiers in Public Health 2022](https://www.frontiersin.org/articles/10.3389/fpubh.2022.837594/full)) |

**The AMR argument, stated properly:** catching a case at the subclinical stage means hygiene and management fix it. Catching it at the clinical stage means an antibiotic — usually broad-spectrum, usually without culture, often without a withdrawal period being observed. **Early prediction is antimicrobial stewardship**, and it lands squarely on NAP-AMR 2.0's animal-sector priority. This is the strongest non-economic argument we have and it is why the system never names a drug.

---

## 4. Government digital infrastructure — integrate, do not duplicate

| System | What it is | Status | API |
|---|---|---|---|
| **INAPH** (NDDB) | Breeding, nutrition and health capture per animal via 12-digit ear tag; backbone of NADCP | **Being replaced** by Bharat Pashudhan / NDLM per NDDB's own transition messaging | No public API found |
| **Bharat Pashudhan** (DAHD + NDDB) | The national "Livestock Data Stack"; ~400,000 field workers | Live nationwide; 34+ crore animals | Government messaging describes an open-API, third-party interface; **no public Swagger, endpoint list or schema found by either research pass. Treat as partnership-gated** |
| **NDLM** | Umbrella digital mission — unified database, disease surveillance, traceability | Nationwide; **35.96 crore Pashu Aadhaar issued** | Bharat Pashudhan is its backbone |
| **Pashu Aadhaar** | 12-digit ear tag (11 serial + 1 check digit, per ICAR convention) | **~95% of ~303M bovines tagged** | The natural join key for any animal-level model |
| **e-Gopala** | Farmer advisory app, launched 10 Sept 2020 | **Superseded by the "1962 — Livestock Owner" app** under NDLM | Do not build against it |
| **Rashtriya Gokul Mission** | Indigenous breed conservation; ₹3,400 cr after the March 2025 revision | Running since Dec 2014 | Feeds breed data into INAPH |
| **NADCP** | FMD and brucellosis vaccination and surveillance | Ongoing; records tied to Pashu Aadhaar | INAPH is the backbone |
| **NDP I / National Dairy Support Project II** | Phase I ₹2,242 cr (2012–2019); Phase II ~₹8,000 cr projected | Phase II ongoing | **Funds the AMCU / BMC village infrastructure our hardware plugs into** |

**The integration position, in one paragraph.** The identity layer already exists and is essentially universal — 95% of India's bovines carry a Pashu Aadhaar tag. Our system keys every animal, every risk score and every alert to that ID, and serialises health events to the [ICAR ADE](https://github.com/adewg/ICAR) Apache-2.0 JSON schema so the data is portable into NDLM the day DAHD grants access. What we do **not** claim is a live integration, because no public developer portal exists. Framing PRAHARI as *a predictive module DAHD can absorb into Bharat Pashudhan* is both the honest answer and, as it happens, the stronger pitch than *a new app farmers must additionally download.*

---

## 5. Field reality — the constraints that should shape every design decision

| Factor | Finding | Source/Year |
|---|---|---|
| Rural internet users | **488M rural** vs 397M urban — rural is now 55% of India's internet population | Kantar/IAMAI, 2024 |
| Mobile penetration | Rural ~58.8% vs urban ~125.3% (multi-device); ~70% of adults own a mobile, ~80% of those smartphones | 2024-25 |
| 4G rural coverage | Signal > −110 dBm in 88.9% of villages | H1 2025 |
| Rural electricity | ~21.9–22.6 hrs/day average, up from 12.5 hrs in 2014-15 — **but outage duration remains far worse rurally** (UP rural average outage 90 min vs urban 21 min) | [PIB 2025](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2105394) |
| Milking | Twice daily near-universal (90.5%); **hand milking 85.5%**, "knuckling" method 84% | Milking practices review |
| **Who actually milks** | **Women perform 60–80% of dairy farm labour** — milking, feeding, health observation | Multiple |
| **AMCU capability** | Already measures **fat and SNF per farmer per shift** and computes payment in real time. NDDB's own spec designs for *"no regular power supply, non-IT-savvy operators, dusty environments"* | [NDDB AMCU Technical Specification](https://www.nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf) |
| AMCU deployment count | No authoritative national total found. NDDB's 2024-29 plan targets 75,000 new Multi-Purpose DCS and strengthening 46,000 existing DCS with AMCU/BMC — implying tens of thousands already equipped. **UNVERIFIED as an exact figure** | NDDB action plan |
| Willingness to pay | No India-dairy-specific study found. Adjacent voice-advisory work with Indian cotton farmers found WTP **below** per-farmer cost at pilot scale but likely above it at scale → **cooperative-bundled pricing, not direct-to-farmer subscription** | Directionally suggestive only |

**Read the AMCU spec row again.** The government has already written a hardware specification for a device that must work with no reliable power, dust, and an operator who is not IT-literate — and deployed it across the country at the exact point where every animal's milk passes twice a day, where fat and SNF are already measured per farmer. Designing per-cow hardware for a two-cow household while ignoring that is the mistake this brief exists to prevent.

---

## 6. Competitive landscape

### Indian

| Company | What it does | Scale |
|---|---|---|
| **Stellapps** | IoT dairy platform; **mooON** leg-band activity tracker (detects illness indirectly via movement), ultrasonic milk analysers, mooMark | 3M farmers, 36,000 villages, 13.5M L/day; $26M Series C Oct 2024, backed by Gates Foundation, Qualcomm Ventures, Blume |
| **Prompt DairyTech** | India's oldest dairy-tech player (1995); **AMCU/AMCS systems**, iSmart milk analyser, MilkoChill, Farm365, pedometers | 28 states, 70,000+ villages |
| **Herdman (Vetware)** | Subscription herd-data tracking | 1M+ animals |

### Global

| Company | Approach | Cost |
|---|---|---|
| **DeLaval Herd Navigator** | In-line biosensor measuring **LDH and progesterone**; AI-enhanced May 2024; flags subclinical mastitis and ketosis days ahead | Installation **$50,000–150,000** |
| **Afimilk MPC, Lely MQC-C, Nedap, Connecterra** | Continuous in-line fat/protein/lactose/SCC per cow; Connecterra applies ML to sensor + behaviour | $50,000+ install; Lely software ~€6–12/cow/year on top |

### Where the white space is

Every credible global mastitis system assumes a **robotic or rotary parlour** and a five-figure dollar installation. That is structurally incompatible with a two-cow, hand-milked, unreliably-powered Indian holding. The Indian players have genuine rural distribution and already own the milk-testing touchpoint — but Stellapps' mastitis-relevant offering is an **indirect activity wearable**, and Prompt's strength is procurement and payment transparency, not predictive risk.

**The gap: a low-cost, AMCU-integrated, multi-signal predictive layer that works at 1–5 animals per household and hand milking, riding on cooperative infrastructure instead of requiring per-farm capital.** That is exactly what PRAHARI is, and it is worth stating in one sentence on the competition slide.

---

## 7. Ten numbers for the deck

1. **239.30 million tonnes** — India's milk production, largest in the world, ~25% of global output (DAHD/BAHS 2024)
2. **86%** of dairy farmers hold 1–5 animals, producing roughly **62–72%** of the milk (USDA GAIN 2021/22)
3. **₹7,165.51 crore/year** — the most-cited national mastitis loss estimate (Bansal & Gupta, **2009** — say the year)
4. **₹306–458/day** in lost yield plus **₹150–200/day** in discarded milk per affected cow — **DAHD's own Strategy Document on Mastitis**
5. **200,000 cells/mL** — the NMC/IDF SCC threshold defining subclinical mastitis
6. **66% sensitivity / 94% specificity** — milk conductivity used *alone* ([PubMed 1532805](https://pubmed.ncbi.nlm.nih.gov/1532805/)). The case for sensor fusion, in one line
7. **21% milk yield reduction** from mastitis in India, roughly double the ~11% reported in the US (Bardhan 2013)
8. **95%** of India's ~303 million bovines already carry a 12-digit Pashu Aadhaar tag — the identity spine to plug into
9. **Only 2–25%** of Indian dairy farmers practise post-milking teat disinfection, despite it costing a few rupees a day
10. **228,374** village Dairy Cooperative Societies already running — the distribution network we ride instead of building

---

## 8. Five questions that would sink us — and the honest answer to each

**Q1. "Conductivity is a weak diagnostic. Why should we believe your fusion beats what's already been tried?"**
It doesn't, alone — and we say so before you do. Kandeel et al. 2019 found AUC < 0.90 for every hand-held EC/ion meter and concluded they are not clinically useful standalone. Our claim is not a better electrode. It is (a) fusion across conductivity, quarter asymmetry, yield, AMCU fat/SNF, behaviour and management risk factors, and (b) the per-animal baseline — we never compare a cow to a threshold, only to herself. We will show the sensitivity/specificity arithmetic, not assert improvement.

**Q2. "Where does your ground-truth SCC or culture data come from? You cannot import US/EU thresholds."**
We don't have a large India-specific labelled SCC corpus, and we searched hard for one — data.gov.in, ICAR, NDDB, NDRI, Kaggle, Mendeley, Zenodo, HuggingFace. It does not exist publicly. The 200,000 cut-point itself is contested (100k–310k across studies) and derives largely from temperate herds; Indian crossbred, indigenous and buffalo animals have documented differential susceptibility. So: our prototype trains on the one CC-BY dataset that exists plus a simulator whose parameters are a published, citation-backed table, and **phase 1 of deployment is a labelled data-collection partnership with ICAR-NIVEDI / NDRI / a milk union's existing CMT programme.** We present this as a data plan, not a solved problem.

**Q3. "India's cows are hand-milked in ones and twos with no power at the shed. DeLaval needs a robotic parlour. How does any sensor system work here?"**
It cannot work the way DeLaval's does, and that is precisely why our primary hardware sits at the **village AMCU**, not on the animal. The AMCU already operates under exactly the constraints DAHD specifies — no regular power, dusty, non-IT-literate operator — already measures fat and SNF per farmer twice a day, and already exists at 228,374 societies. One retrofit module serving 100–500 animals amortises to single-digit rupees per animal. Per-animal wearables stay in the design for organised farms where they pay for themselves.

**Q4. "Does an early-warning app actually change farmer behaviour, or is it one more notification to ignore?"**
The default evidence is discouraging and we should not pretend otherwise: teat-dip and CMT adoption sit at 2–25% after decades of extension effort, and the ranked barriers are awareness, skill, cost and labour — not information supply. So our answer cannot be "the app will fix behaviour". It is three specific design choices: the alert goes to the person who actually milks (usually a woman, in her language, by voice if needed); it names one animal, one quarter and one action rather than giving general advice; and it is delivered through channels farmers already trust — DCS field staff and the INAPH-linked vet — not as a standalone consumer app competing for attention. We also cap alerts at ~5% of the herd per day, because the fastest way to be ignored is to cry wolf.

**Q5. "Why isn't this a feature DAHD/NDDB should just build into Bharat Pashudhan themselves?"**
Eventually it probably is, and we should say so rather than pretend we are building a rival platform. Our contribution is the predictive model, the AMCU-level sensor-fusion design, and the alerting/feedback loop — all keyed to Pashu Aadhaar and serialised to the ICAR ADE schema from day one, precisely so it can be absorbed. "A module DAHD can adopt" is both the honest answer and the stronger pitch than "an app farmers must additionally install."

---

## 9. Primary documents to read before the deck is finalised

Neither research pass could fully extract these. Someone on the team should open each one directly.

1. **[DAHD Strategy Document on the Prevention and Control of Mastitis](https://dahd.gov.in/sites/default/files/2025-02/StrategyDocumentonthePreventionandControlofMastitisV-Final.pdf)** — the department we are pitching to, framing the exact problem. Highest-value document in this brief.
2. **[NDDB AMCU Technical Specification](https://www.nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf)** — the field constraints our hardware must respect, written by the people who deployed the infrastructure.
3. **Bansal & Gupta (2009)**, *Indian J. Dairy Sci.* 62(5):337–345 — locate the primary paper so the ₹7,165 crore figure can be cited first-hand rather than through a citation chain.
4. **[Krishnamoorthy et al. 2021](https://doi.org/10.1016/j.rvsc.2021.04.021)**, *Res Vet Sci* 136:561–586 — the prevalence meta-analysis (India SCM 45%, CM 18%) behind our problem-framing slide.
5. **[Zhou et al. 2026](https://doi.org/10.3390/ani16020204)**, *Animals* — the only paper matching our 7–14 day horizon with transparent metrics. Our accuracy claims are measured against it.
