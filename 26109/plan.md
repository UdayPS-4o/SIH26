# SIH 2026 — PS 26109: AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms

**Project name: PRAHARI** — *Predictive Risk Analytics for Herd Alerting & Rapid Intervention*
Organisation: Ministry of Fisheries, Animal Husbandry & Dairying · Department: **DAHD**
Theme: Agriculture, FoodTech & Rural Development · **Category: Hardware**

> Every fact in §6–§9 carries a source URL and a verification status. Anything we could not confirm is marked **UNVERIFIED** rather than quietly dropped or invented. Do not put an unverified number on a slide.

---

## 1. What they actually want (plain English)

A dairy farmer finds out a cow has mastitis when the udder is hot and swollen and the milk has clots in it. By then the yield is already gone for that lactation, the milk is unsaleable for the antibiotic withdrawal period, and someone is reaching for an antibiotic — often the wrong one, often without a culture.

DAHD wants that moment moved **7 to 14 days earlier**, using the digital exhaust that Indian dairying is starting to produce anyway: automatic milk collection units at village societies, milk analysers, cheap sensors, and the animal records already sitting in INAPH and Bharat Pashudhan.

Four things make this hard, and a serious entry has to say so out loud:

1. **Mastitis is rare per cow-day.** Clinical incidence is on the order of a few tens of cases per 100 cow-years. In a cow-day panel the positive rate is well under 1%. A model with 99% accuracy is a model that predicts "healthy" every time. This is why we report AUC-PR, precision at a fixed alert budget, and a lead-time distribution — not accuracy, and not AUC-ROC alone.
2. **The cheapest sensor is the weakest one.** Milk electrical conductivity is what everyone puts on a slide, and EC-alone detection sensitivity in the literature sits around 61–78% ([source](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12662225/) — UNVERIFIED, found via search summary), while a 2025 Frontiers study measured EC-based models at AUC 0.843–0.865 against SCC-based models at AUC 0.952–0.981 ([Pan et al. 2025](https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2025.1671186/full)). Our design answer is fusion plus a per-animal baseline, not a better electrode.
3. **There is no public Indian mastitis sensor dataset.** We searched data.gov.in, ICAR, NDDB, NDRI, Kaggle, Mendeley, Zenodo and HuggingFace. What exists is listed in §6. The honest position is: bootstrap on the one CC-BY dataset that does exist, generate an Indian-context simulator calibrated to published Indian prevalence and yield-loss figures, and name ICAR-NDRI / NDDB partnership as the phase-2 data path. Claiming an Indian dataset we do not have is the fastest way to lose the Q&A.
4. **The Indian farm is not the farm these systems were designed for.** Every credible commercial mastitis system in the world — DeLaval Herd Navigator, Lely MQC-C, Afimilk MPC — assumes a robotic or rotary parlour and costs $50,000+ to install. The Indian median dairy holding is **under two milking animals**, hand-milked twice a day, mostly by women, in a shed with no reliable power. **86% of Indian dairy farmers hold 1–5 animals** (USDA GAIN 2021/22). A per-cow collar strategy is a rounding error against that reality.

### The design consequence: build for the collection point, not the cow

This is the single most important architectural decision in the project, and it falls straight out of fact 4.

India already has a twice-daily, near-universal, instrumented touchpoint for almost every dairy animal in the country: the **village Dairy Cooperative Society and its Automatic Milk Collection Unit**. There are roughly **228,374 village DCS** (NDDB, 2021-22). The AMCU already measures **fat and SNF per farmer per shift** and computes payment in real time — and NDDB's own [AMCU technical specification](https://www.nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf) explicitly designs for *"no regular power supply, non-IT-savvy operators, dusty environments."* The government has already solved the hard deployment problem. We should not solve it again.

So PRAHARI's primary hardware is **not** a collar. It is a low-cost retrofit module that taps the AMCU's existing sample path and adds electrical conductivity, milk temperature and a CMT-assist capture — **one device serving 100–500 animals in a village**, amortising to single-digit rupees per animal instead of ₹1,800 per animal. Per-animal wearables remain in the design as an upper tier for organised farms and large commercial herds, where they genuinely pay for themselves. See the tier ladder in [`docs/architecture-diagram.md`](docs/architecture-diagram.md) §4 and the costed BOM in [`docs/hardware.md`](docs/hardware.md).

This also gives us a free, powerful feature almost nobody else will use: the AMCU's **fat and SNF** readings. A shifting fat-to-SNF relationship and a yield drop at the farmer level are classic subclinical indicators, and they are already being measured, twice a day, at no marginal cost, for tens of millions of animals.

---

## 2. The 8 required capabilities (from the PS), and where each is answered

| # | PS capability | Our answer | Doc |
|---|---|---|---|
| 1 | Predict 7–14 days before clinical signs | Discrete-time hazard model trained with positives drawn **only** from `[onset−14d, onset−7d]`, with the intervening week blanked to stop leakage | `docs/implementation-flow.md` §Mermaid, `docs/architecture-diagram.md` §5 |
| 2 | Animal-wise and herd-level risk | Per-cow calibrated probability + herd-pressure features (bulk-tank SCC slope, incidence, milking-order contagion proxy) and a herd roll-up | `docs/architecture-diagram.md` §1 |
| 3 | Integrate sensors, FMS, lab, manual input | One `observations` schema, seven source adapters; the tier ladder means the system works with zero sensors | `docs/architecture-diagram.md` §4 |
| 4 | Real-time alerts to farmers and vets | MQTT → scoring → alert budget → FCM push + SMS + vet console escalation | `docs/architecture-diagram.md` §2 |
| 5 | Continuously improving models | One-tap outcome capture on every alert → nightly champion/challenger retrain, promoted only on held-out-herd AUC-PR | `docs/BUILD_PLAN.md` |
| 6 | Dashboards and visualisation | Farmer PWA, vet triage console, cooperative/district GIS hotspot view | `docs/BUILD_PLAN.md` |
| 7 | Recommend preventive/corrective interventions | SHAP top-3 drivers → intervention template catalogue; advisory only, never a prescription | `docs/implementation-flow.md` |
| 8 | Multilingual, mobile deployment | PWA + i18next, 7 languages, AI4Bharat voice path for low literacy | §7.7 below |

---

## 3. System architecture (one paragraph)

Field nodes (collar, milk-line, barn) do their own aggregation on an ESP32 and uplink over LoRaWAN IN865 to a solar farm gateway that spools 72 hours through a network outage. The gateway publishes MQTT into a single cloud VM running FastAPI, TimescaleDB, Valkey and Celery under Docker Compose. A nightly feature builder turns raw observations into cow-day feature vectors dominated by **deviations from each animal's own baseline** and **asymmetry across the four quarters of one udder at one milking** — the two design choices that remove breed, parity, stage-of-lactation and ambient confounding without having to model them. LightGBM scores each cow-day for hazard of clinical onset in the next 7–14 days; isotonic calibration turns the score into a probability a farmer can act on; an alert-budget layer caps notifications at ~5% of the herd per day so the app stays credible; SHAP drivers pick the intervention template; the farmer's confirm/deny closes the loop and feeds the next retrain.

Full diagrams: [`docs/architecture-diagram.md`](docs/architecture-diagram.md). Flow panel: [`docs/implementation-flow.md`](docs/implementation-flow.md).

---

## 4. Do we need an LLM? Can this run offline?

**No LLM in the prediction path, and yes it runs offline.** The risk model is gradient-boosted trees on tabular features — CPU-only, milliseconds per cow, no GPU. The only optional neural components are at the edges:

- **Voice** (AI4Bharat IndicConformer ASR / Indic Parler-TTS) for low-literacy farmers — nice to have, cleanly excisable, and can be swapped for Bhashini's hosted API in a demo.
- **Nothing generative writes advice.** Recommendation text comes from a fixed, vet-reviewed template catalogue keyed by SHAP driver. A hallucinated treatment recommendation in a livestock-health product is a liability, not a feature — this is a deliberate architectural refusal and it is worth saying so on the slide.

The farm gateway keeps working with the cloud unreachable: it spools, and the farmer PWA holds an offline queue in IndexedDB. Scoring itself is cloud-side in v1; a quantised on-gateway scorer is a stated phase-2 item, not a claim.

---

## 5. Tech stack (final pick)

Every choice below was licence-verified during research. Where a well-known tool has a licence trap, we say what the trap is.

| Layer | Pick | Licence | Why |
|---|---|---|---|
| Edge firmware | ESP-IDF / Arduino on ESP32-C3 | Apache-2.0 | Cheapest credible MCU with LoRa + BLE ecosystem |
| LoRaWAN server | **ChirpStack** | MIT | The de-facto self-hosted LNS; MIT with no strings ([repo](https://github.com/chirpstack/chirpstack)) |
| MQTT broker | **Eclipse Mosquitto** | EPL-2.0 **or** EDL-1.0 (BSD-style) | Single C binary, few MB RAM ([mosquitto.org](https://mosquitto.org/)) |
| Stream buffer | **Valkey** Streams | BSD-3-Clause | Redis' licence moved to SSPL/RSAL (7.4–8.0) then added AGPLv3; Valkey is the Linux Foundation BSD fork and keeps Streams. Use Valkey, not current Redis Inc. builds |
| Time-series DB | **TimescaleDB** (Apache-2 Edition features) | Apache-2.0 core + TSL for some features | It is Postgres, so animals/herds/alerts and sensor series live in one engine. TSL features (compression, continuous aggregates) are free to self-host but are **source-available, not OSI** — say so if asked ([licences](https://www.tigerdata.com/legal/licenses)) |
| Spatial | **PostGIS** + **H3** (via `h3-pg`) | PostGIS GPL-2.0-or-later; H3 and `h3-pg` Apache-2.0 | Spatial joins in the same DB; H3 hex-bins farm points into a district hotspot layer. **The GPL here does not infect our application** — per [PostGIS' own FAQ](https://postgis.net/documentation/faq/gpl-license/), copyleft applies only if you modify and redistribute PostGIS itself, not when your app queries it. Know this answer before a judge asks it |
| API | **FastAPI** + Pydantic | MIT | Matches the stack used on PS 26099 and PS 26056 |
| Jobs | **Celery** | BSD-3-Clause | Nightly feature build, scoring, retrain |
| Core model | **LightGBM** | MIT | Fastest CPU GBM on tabular; v4.7.0 (Jul 2026) ([repo](https://github.com/microsoft/LightGBM)) |
| Cross-checks | **XGBoost** (incl. `survival:aft`), **CatBoost** | Apache-2.0 / Apache-2.0 | AFT gives a survival formulation without a new dependency |
| Survival benchmark | **lifelines** | MIT | Best-maintained (v0.30.3, Apr 2026); Cox PH for interpretable hazard ratios |
| Feature extraction | **tsfresh** | MIT | Windowed statistical/spectral features off raw sensor series |
| Online update | **River** | BSD-3-Clause | Incremental per-herd updates between full retrains — PS capability #5 |
| Imbalance | **imbalanced-learn** | MIT | SMOTE / ensemble resampling; but prefer `scale_pos_weight` first |
| Calibration | scikit-learn `CalibratedClassifierCV` (isotonic) | BSD-3-Clause | A "68%" shown to a farmer must be true 68% of the time |
| Explainability | **SHAP** TreeExplainer | MIT | Exact per-animal attributions, C++ fast path for tree ensembles ([repo](https://github.com/shap/shap)) |
| Experiment tracking | MLflow | Apache-2.0 | Champion/challenger promotion log |
| Frontend | React + TypeScript + Tailwind, **PWA** | MIT | One codebase serves farmer, vet and cooperative; no app-store friction on basic Android |
| Offline sync | PouchDB/CouchDB **or** Workbox background sync | Apache-2.0 / MIT | Avoid RxDB *premium* — core is Apache-2.0 but encryption/advanced storage plugins are a **paid annual licence** ([rxdb.info/premium](https://rxdb.info/premium/)) |
| i18n | i18next / react-i18next | MIT | Lazy-loaded locale bundles |
| Maps | **MapLibre GL JS** + **deck.gl** | BSD-3-Clause / MIT | Mapbox GL v2+ requires a paid subscription; MapLibre is the community BSD fork |
| Notifications | **ntfy** (demo) + FCM (production push) | Apache-2.0/GPLv2 · FCM proprietary-but-free | FCM is free, **not open source** — label it honestly |
| Deploy | Docker Compose on one 8 vCPU / 16 GB VM | — | Same pattern as PS 26099 |

**Rejected, and why**

| Rejected | Reason |
|---|---|
| Apache Kafka | Needs ~6–8 GB RAM minimum plus JVM/KRaft ops for a workload of a few thousand messages a day. Valkey Streams does it in <256 MB |
| EMQX | Moved to Business Source Licence 1.1 at v5.9 (May 2025) — source-available, not OSI. Mosquitto has no such ambiguity |
| Current Redis Inc. builds | SSPL/RSALv2 from 7.4; AGPLv3 added at 8.0. Valkey stays BSD-3 |
| GADM boundary data | Academic/non-commercial **only**, redistribution prohibited ([gadm.org/license](https://gadm.org/license.html)). A very common trap — do not bundle it |
| Moirai (Salesforce time-series FM) | **CC BY-NC 4.0** — non-commercial only. Disqualifying for anything DAHD might deploy |
| Lag-Llama | Last commit June 2024; effectively unmaintained |
| TimesFM 3.0 weights | 3.0 weights are under a **non-commercial** licence; only 2.x is Apache-2.0 |
| PySurvival | Last release April 2019, Python 3.7 max. Dead |
| LIME | Last PyPI release June 2020, and slower than SHAP TreeExplainer for per-animal panels |
| scikit-survival | Capable, but **GPL-3.0-or-later** — fine for research, a licensing conversation for a deployed government product. Use lifelines + XGBoost AFT instead |
| The Things Stack OSS | Their own docs call the self-hosted OSS edition unsuitable for production; ChirpStack is MIT and complete |
| Deep forecasting (neuralforecast, PyTorch Forecasting, TFT) | Trainable on CPU only for toy sizes. GBMs beat them on tabular sensor features anyway at this data scale |

---

## 6. Datasets — what's real, what's a dead end

**The honest headline: there is no public, animal-level, mastitis-labelled Indian sensor dataset.** Searched: data.gov.in, ICAR, NDDB, NDRI Karnal, Kaggle, Mendeley, Zenodo, UCI, HuggingFace. This is a finding, not a failure — say it on the slide and name the phase-2 partnership path.

| Dataset | What it is | Licence | Downloadable? | Verdict |
|---|---|---|---|---|
| [**Clinical Mastitis in Cows based on Udder Parameter using IoT**](https://data.mendeley.com/datasets/kbvcdw5b4m/1) (DOI 10.17632/kbvcdw5b4m.1) | Cow ID, day, breed, months since calving, prior-mastitis flag, udder size across 4 quadrants (flex sensors), body temperature, udder hardness, swelling/pain, milk-image quality flag, binary mastitis label | **CC BY 4.0** | **Yes — verified live** | **Use it.** The only confirmed-downloadable, clearly-licensed, column-known dataset found. Small and sensor-simulated, but enough to build and demo a real pipeline |
| [**MmCows**](https://github.com/neis-lab/mmcows) (NeurIPS 2024 D&B) | 2 weeks, 10 cows with UWB position + inertial + body temp, 16 cows on camera, 4.8M frames, 213k bounding boxes | Per repo | Yes | **No mastitis labels.** Use for behaviour/activity feature engineering and for a credible "this is what collar data looks like" demo, nothing more |
| [MasPA](https://github.com/naeemmrz/MasPA.py) ([paper](https://doi.org/10.3390/agriengineering3030037)) | Open-source reference implementation on the same sensor lineage as the Mendeley set | Check repo | Yes | Useful as a baseline/feature-engineering starting point. Its reported 98.1% accuracy reflects oversampled simple data — **do not cite it as a realistic target** |
| [Cow Mastitis (From milk)](https://www.kaggle.com/datasets/amithadityacp/cow-mastitisfrom-milk) · [Mastitis-Disease-Detection](https://www.kaggle.com/datasets/sivaprathishsiva/mastitis-disease-detection) · [Cattle diseases](https://www.kaggle.com/datasets/devang03mgr/cattle-diseases-datasets) | Kaggle datasets, titles confirmed | Unknown | **UNVERIFIED** — Kaggle pages need JS; content, size and licence not confirmed | Check manually before committing |
| [data.gov.in — 20th Livestock Census](https://www.data.gov.in/catalog/20th-livestock-census) · [state-wise milk production](https://www.data.gov.in/catalog/stateut-wise-estimates-milk-production-animal) | Aggregate population and yield statistics by state/species | NDSAP | Yes | Real and citable, but **aggregate only** — for the GIS layer and the problem-framing slide, not for training |
| [DataMeet `maps`](https://github.com/datameet/maps) + [`indian_village_boundaries`](https://projects.datameet.org/indian_village_boundaries/) | India district and village boundary GeoJSON | Districts: **CC BY 2.5 India**. Village project: reported as **ODbL** by one check and CC BY by another — **resolve before shipping**, because ODbL carries a share-alike obligation on the derived *database* | Yes | **Use it** for the hotspot map, but confirm the village-layer licence first. Maintainers flag pre-delimitation boundaries in several states — label the map "indicative" |
| UCI ML Repository | — | — | — | **Dead end** — no dairy/mastitis dataset exists there |
| Zenodo milk-EC datasets | — | — | — | **Dead end** — searches returned journal articles, not datasets |
| CMT strip image dataset | — | — | — | **Dead end** — CMT appears as a *label* in thermal-imaging studies, never as a released image corpus |
| [TIDS — thermal imaging, subclinical mastitis](https://ecmlpkdd-storage.s3.eu-central-1.amazonaws.com/preprints/2025/ads/preprint_ecml_pkdd_2025_ads_1285.pdf) | ECML-PKDD 2025 preprint | Unknown | **UNVERIFIED** | Dairy **sheep**, not cattle. Watch it, don't plan on it |

### Consequence for the build

We ship a **calibrated synthetic generator** (`datasets/simulator/`) that produces Indian-context cow-day panels: HF-crossbred / indigenous / Murrah buffalo baselines, monsoon THI seasonality, parity and DIM effects, and clinical incidence tuned to the published Indian prevalence in §7. The simulator is seeded and its parameters are a documented table with citations, so a judge can audit exactly which assumption produced which number. Real data from the Mendeley set is used to sanity-check feature distributions. **We label it as simulated everywhere it appears** — in the UI, in the deck, and in the README.

---

## 7. Literature — the accuracy numbers we are allowed to claim

| Paper | Data | Horizon | Reported |
|---|---|---|---|
| **Zhou et al., *Animals* 2026, [10.3390/ani16020204](https://doi.org/10.3390/ani16020204)** | 255,772 records, 68 mastitic + 154 healthy cows, commercial farm NE China, SCR HR-Tag activity/rumination/EC + yield | **7 / 14 / 21 / 28 days** pre-diagnosis | **14-day: AUC 0.789, Sens 0.500, Spec 0.947, F1 0.625.** 7-day: AUC 0.758, Sens 0.500, Spec 0.842, F1 0.556 |
| [Pan et al., *Front. Vet. Sci.* 2025](https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2025.1671186/full) | 93 cows, 4 farms, Beijing | Detection at test time | **SCC-based:** SVM AUC 0.952, FNN AUC 0.981. **EC-based:** SVM AUC 0.843, FNN AUC 0.865 |
| [Fadul-Pacheco et al., *Int. Dairy J.* 2021;119:105051](https://doi.org/10.1016/j.idairyj.2021.105051) | Daily prediction, RF/NB/XGBoost | Continuous daily | RF best: 71% correct (1st lactation), 85% (continuous); overall accuracy 72% |
| [Comput. Electron. Agric. 2025](https://www.sciencedirect.com/science/article/pii/S0167587725001606) | 1,790 cows, 2 German farms, 4 years, 7 AMS variables, SMOTE | **1 day prior** | Acc 0.80–0.90, Sens 0.64–0.78, Spec 0.80–0.90 |
| [Hyde et al., *Sci. Rep.* 2020;10:4289](https://www.nature.com/articles/s41598-020-61126-8) | 1,000 UK farms, herd-level | Herd classification | Contagious vs environmental: Acc 98%, PPV 86%, NPV 99% |
| [Ghafoor & Sitkowska, *AgriEngineering* 2021](https://doi.org/10.3390/agriengineering3030037) | ~6,600 oversampled samples | Point-in-time | Acc 98.1%, Sens 99.4% — **oversampled simple data; do not use as a target** |

**What we put on the slide.** Zhou et al. is the only paper found that reports the exact 7–14 day horizon this PS asks for, with transparent per-window metrics. **AUC ≈ 0.79 at 14 days with sensitivity around 0.50 is the state of the art we are measuring ourselves against.** A team promising 95%+ at 14 days is either citing a point-in-time detection paper as if it were a forecasting paper, or has leaked the label. Saying this clearly is a differentiator, not a weakness.

### Standards for the label definition

| Standard | What it fixes |
|---|---|
| **200,000 cells/mL** SCC cut-point (National Mastitis Council convention) | Our subclinical threshold. Some work argues 100,000 is more sensitive; Indian HF-crossbred studies have used up to 310,000 — we make the threshold a config value and report sensitivity to it ([source](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6048081/)) |
| [ISO 13366-1:2008 / IDF 148-1](https://www.iso.org/standard/40259.html) | Reference microscopic SCC method |
| [ISO 13366-2:2006 / IDF 148-2](https://www.iso.org/standard/40260.html) | Flow-cytometry SCC counters; explicitly covers buffalo milk |
| [ICAR Guidelines §2 — Dairy Cattle Milk Recording](https://www.icar.org/Guidelines/02-Overview-Cattle-Milk-Recording.pdf), [§12 — Milk Analysis](https://www.icar.org/Guidelines/12-Milk-Analysis.pdf) | How milk records and SCC are officially collected. Note: this ICAR is the *International Committee for Animal Recording*, **not** the Indian Council of Agricultural Research — do not conflate them in the deck |
| [ISO 20966:2007](https://www.iso.org/standard/37191.html) | Automatic milking installations. **No dedicated ISO standard for milk-conductivity sensor accuracy exists** — a genuine gap we should name, because it is why EC readings are not comparable across vendors |

---

## 8. Interoperability with Indian government systems — the honest position

| System | What it is | Public API? |
|---|---|---|
| [**INAPH**](https://www.nddb.coop/resources/inaph) (NDDB) | Field data capture for breeding, nutrition and animal health; backbone of the National Animal Disease Control Programme; ~3.45 crore registered bovines; 12-digit ear-tag ID | **No public API or schema documentation found.** Closed operational system |
| [**Bharat Pashudhan / NDLM**](https://bharatpashudhan.ndlm.co.in/) (DAHD + NDDB) | "Pashu Aadhaar" 12-digit animal ID, ~35.9 crore animals; field app records AI, vaccination, treatment | A [WOAH presentation](https://rr-asia.woah.org/app/uploads/2023/11/7-ms-versha-joshi_livestock-traceability-v3.pdf) describes a planned third-party interface "through open APIs". **UNVERIFIED as a shipped, documented API** — architectural intent, not something a team can integrate with today |
| **e-Gopala** (DAHD/NDDB) | Farmer advisory app, 12 languages, alerts for vaccination/AI/calving | No API. **Being superseded by the "1962 — Livestock Owner" app** under NDLM per a Lok Sabha statement — do not build against e-Gopala. Relevant only as a delivery-channel precedent |
| [**ICAR ADE**](https://github.com/adewg/ICAR) (*Animal Data Exchange*, International Committee for Animal Recording) | Actively maintained, **Apache-2.0**, JSON-Schema/OpenAPI spec covering animal identification, movements, milking, liveweight, health treatments, feeding | **Yes — a real, public, permissively licensed schema** |
| "ISOagriNET" | Possibly **ISO 17532** (on-farm device interoperability) | **CONTESTED — our two research passes disagreed.** One could not confirm the name maps to any ISO standard; the other identified it as ISO 17532, full text paywalled. **Do not cite it from a slide** until someone reads the actual standard. The uncontested adjacent standards are ISO 11784/11785 (RFID animal ID) and ISO/TC 347 |

**So what does "interoperable" mean for us, concretely?**

1. **Schema-level alignment, built and inspectable.** Our animal identifier field is the 12-digit Pashu Aadhaar ear-tag format used by NDLM/INAPH, and our health-event records serialise to the ICAR ADE JSON schema. `/export/ade` is a real endpoint a judge can hit. This is a demonstrable claim.
2. **A stated integration pathway, not a fabricated one.** Live INAPH/Bharat Pashudhan integration requires a DAHD/NDDB data-sharing MoU and sandbox access. We say that on the slide. Claiming a working live government integration that does not exist is a Q&A death sentence.
3. **Open geodata only.** DataMeet boundaries (CC BY), not GADM.

---

## 9. Multilingual and low-literacy access

Seven priority languages, chosen by dairy geography: **Hindi** (UP/MP/Rajasthan/Punjab-Haryana belt), **Gujarati** (Amul/GCMMF), **Marathi**, **Punjabi**, **Telugu**, **Tamil** (Aavin), **Kannada** (KMF/Nandini). All seven are covered by the AI4Bharat stack.

| Component | Model | Licence | Note |
|---|---|---|---|
| Translation | [`ai4bharat/indictrans2-en-indic-1B`](https://github.com/AI4Bharat/IndicTrans2) and the indic-indic / distilled 200M variants | **MIT** (verified on model card and repo LICENSE) | All 22 scheduled languages |
| Text encoder | [`ai4bharat/indic-bert`](https://huggingface.co/ai4bharat/indic-bert), IndicBERTv2 | **MIT** | 12 languages incl. all seven of ours |
| ASR (voice input) | [`ai4bharat/indic-conformer-600m-multilingual`](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual) | **MIT** | 22 languages; all seven covered |
| TTS (voice output) | [`ai4bharat/indic-parler-tts`](https://huggingface.co/ai4bharat/indic-parler-tts) | **Apache-2.0** | 21 languages; Punjabi is flagged "extended/unofficial" on the card — spot-check it |
| Hosted fallback | [Bhashini / ULCA](https://bhashini.gitbook.io/bhashini-apis) | Free tier is **explicitly PoC-only** per their own docs | Fine for an SIH demo; flag the production caveat if asked |

**Avoid:** `ai4bharat/IndicF5` (licence **UNVERIFIED**) and the older IIT-Madras donlab IndicTTS source (click-through licence terms could not be confirmed permissive; the *recordings* are CC BY 4.0 but the code licence is unclear). Gated IndicWhisper checkpoints require an access request — do not put a gated model on the critical path of a hackathon.

**Notification reality check.** SMS to Indian numbers requires **TRAI DLT registration** under TCCCPR 2018 — three layers (principal entity, sender header, exact content template), with carrier-side scrubbing that silently drops any message whose text differs from the registered template by even one character. It needs PAN/GST documents and takes days. WhatsApp Business API needs Meta business verification, template approval, a BSP, and per-message pricing since 1 July 2025. **Neither is achievable inside a hackathon window.** We demo with FCM push and ntfy, and we present DLT registration and WhatsApp as the documented path to production. Knowing this constraint is itself a credibility signal — most teams will promise SMS alerts without knowing DLT exists.

---

## 10. Resource links

### Datasets & geodata
- Mendeley IoT udder dataset (CC BY 4.0) — https://data.mendeley.com/datasets/kbvcdw5b4m/1
- MmCows multimodal dairy dataset — https://github.com/neis-lab/mmcows
- MasPA reference implementation — https://github.com/naeemmrz/MasPA.py
- data.gov.in livestock census — https://www.data.gov.in/catalog/20th-livestock-census
- DataMeet India boundaries (CC BY) — https://github.com/datameet/maps
- DataMeet village boundaries — https://github.com/datameet/indian_village_boundaries

### Standards
- ICAR Animal Data Exchange (Apache-2.0 JSON schemas) — https://github.com/adewg/ICAR
- ICAR ADE standards overview — https://www.icar.org/index.php/technical-bodies/working-groups/animal-data-exchange-wg/the-icar-ade-standards/
- ICAR milk recording guidelines §2 — https://www.icar.org/Guidelines/02-Overview-Cattle-Milk-Recording.pdf
- ICAR milk analysis guidelines §12 — https://www.icar.org/Guidelines/12-Milk-Analysis.pdf
- ISO 13366-1 (SCC reference method) — https://www.iso.org/standard/40259.html
- ISO 13366-2 (SCC flow cytometry) — https://www.iso.org/standard/40260.html
- ISO 20966 (automatic milking installations) — https://www.iso.org/standard/37191.html

### ML libraries
- LightGBM — https://github.com/microsoft/LightGBM
- XGBoost (incl. AFT survival) — https://xgboost.readthedocs.io/en/stable/tutorials/aft_survival_analysis.html
- CatBoost — https://github.com/catboost/catboost
- lifelines — https://github.com/CamDavidsonPilon/lifelines
- tsfresh — https://github.com/blue-yonder/tsfresh
- River (online learning) — https://github.com/online-ml/river
- imbalanced-learn — https://github.com/scikit-learn-contrib/imbalanced-learn
- SHAP — https://github.com/shap/shap
- InterpretML (EBM, glass-box alternative) — https://github.com/interpretml/interpret

### Infrastructure
- ChirpStack (MIT LoRaWAN NS) — https://www.chirpstack.io/project/
- Eclipse Mosquitto — https://mosquitto.org/
- ThingsBoard CE (Apache-2.0) — https://thingsboard.io/pricing/
- Node-RED — https://github.com/node-red/node-red
- TimescaleDB licences — https://www.tigerdata.com/legal/licenses
- PostGIS — https://github.com/postgis/postgis
- H3 — https://github.com/uber/h3
- MapLibre GL JS — https://github.com/maplibre/maplibre-gl-js
- deck.gl — https://github.com/visgl/deck.gl
- ntfy — https://github.com/binwiederhier/ntfy

### Indian language AI
- IndicTrans2 — https://github.com/AI4Bharat/IndicTrans2
- IndicConformer ASR — https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual
- Indic Parler-TTS — https://huggingface.co/ai4bharat/indic-parler-tts
- Bhashini API docs (PoC-only terms) — https://bhashini.gitbook.io/bhashini-apis

### Indian government livestock systems
- INAPH (NDDB) — https://www.nddb.coop/resources/inaph
- Bharat Pashudhan / NDLM — https://bharatpashudhan.ndlm.co.in/
- NDLM press release — https://www.pib.gov.in/PressReleasePage.aspx?PRID=2204580
- WOAH NDLM traceability presentation — https://rr-asia.woah.org/app/uploads/2023/11/7-ms-versha-joshi_livestock-traceability-v3.pdf
- TRAI DLT registration — https://trai.gov.in/government-entities
