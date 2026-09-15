# PRAHARI — Complete Dashboard Implementation Plan & Video Script

> Every change needed to make the dashboard cover every PS 26109 requirement,
> look like it was built for Indian dairy (not a Silicon Valley SaaS), and win
> a Hardware category hackathon. Tasks are broken into agent-executable units.

---

## PART 1: DASHBOARD COMPLETE REDESIGN

### 1.1 Colour Palette — Swap to Warm Earth Tones

**Current palette:** Brand green `#16a34a` / sky blue / AI blue `#3ea8e0` — looks like every React SaaS dashboard.

**Target palette:** Earth tones that read as "farm" not "tech."

| Token | Current Value | New Value | Where Used |
|-------|--------------|-----------|------------|
| `brand.500` | `#22c55e` | `#92400e` | Primary actions, active nav, links |
| `brand.600` | `#16a34a` | `#78350f` | Hover states, strong accents |
| `brand.700` | `#15803d` | `#92400e` | Card headers, section titles |
| `brand.100` | `#dcfce7` | | |
| `brand.50` | `#f0fdf4` | `#fffbeb` | Card backgrounds, light tint |
| `brand.900` | `#14532d` | | |
| `brand.800` | `#166534` | | |
| Sidebar gradient end | `#081b30` (dark navy) | `#1c1917` (stone-900 warm black) | Sidebar bottom |
| Sidebar gradient start | `#123f66` | `#292524` (stone-800) | Sidebar top |
| `ai` accent | `#3ea8e0` (blue) | `#b45309` (amber-700) | AI/badge accents |
| Card bg light | `#ffffff` | `#fffbeb` (amber-50) or `#fefce8` (yellow-50) | All cards |
| Body bg | `#f4f6f8` | `#f5f5f4` (stone-100) | Page background |
| Risk HIGH | `#ef4444` | keep `#dc2626` | Red stays red for urgency |
| Risk MODERATE | `#f59e0b` | `#d97706` (amber-600) | Amber stays amber |
| Risk LOW / No risk | `#16a34a` | `#15803d` (green-700) | Green stays green |
| Text primary | `#1f2937` | `#1c1917` (stone-900) | Body text |
| Text secondary | `#6b7280` | `#57534e` (stone-600) | Secondary text |

**Files to change:**
- `tailwind.config.js` — update `brand` colour block and `ai` colour
- `src/index.css` — update body background, `.card` component
- `src/components/common/ui.jsx` — update `KpiCard` tones if brand colours change
- `src/components/layout/Sidebar.jsx` — update gradient stops

**Agent task: COLOR_SWAP** — Edit tailwind.config.js brand colours, then grep+replace across all JSX files for old brand colour references. Verify no `#2563eb` or `#3b82f6` (blue) remains in non-chart contexts.

---

### 1.2 Typography — Add Devanagari Font

**Current:** Inter only.

**Add:** Noto Sans Devanagari for Hindi/Gujarati/Marathi/Punjabi/Telugu/Tamil/Kannada text.

**Changes:**

1. In `index.html`, add Google Fonts link:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
```

2. In `tailwind.config.js`:
```js
fontFamily: {
  sans: ['Inter', 'Noto Sans Devanagari', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  devanagari: ['Noto Sans Devanagari', 'Inter', 'sans-serif'],
  script: ['Caveat', 'ui-serif', 'cursive'],
},
```

**Agent task: FONT_ADD** — Add Google Fonts link to index.html, update tailwind.config.js fontFamily.

---

### 1.3 Dashboard Hero Section — Rewrite

**Current:** Generic "Good Morning, Ramesh Kumar!" with cow photo fading out. Looks like any dashboard template.

**New design — two-column layout:**

**Left column (60%):**
- **Time-aware greeting** in Devanagari + English: "सुप्रभात / Good Morning"
- **Farm name** in large text: "श्री डेरी फार्म, मथुरा"
- **Three urgent KPI pills** in a row, NOT four generic cards:
  1. "आज के अलर्ट / Today's Alerts" — 3 urgent, red dot pulsing
  2. "समीक्षित नहीं किए गए / Not Reviewed" — 2 pending
  3. "उच्च जोखिम / High Risk Animals" — 7, with ₹ estimate
- **SIMULATED DATA badge** in top-right corner, small, amber, consistent on every page

**Right column (40%):**
- Replace the generic "Mastitis Early Warning" card with a **Tier Ladder mini-visual**:
  - 4 steps: Tier 0 (₹0) → Tier 1 (₹0) → Tier 2 (₹5–27) → Tier 3 (₹419)
  - Current active tier highlighted: "आपके फार्म पर Tier 1 सक्रिय है"
  - Tiny text: "AMCU data feed active — no hardware needed"

**Remove:** The fading cow photo. It's generic and doesn't convey anything.

**Agent task: DASHBOARD_HERO** — Rewrite the hero section of Dashboard.jsx. Keep the overall grid layout but replace hero content.

---

### 1.4 KPI Cards — Redesign for Economic Impact

**Current 4 cards:** Total Animals, Healthy, At Risk, High Risk — generic dashboard metrics.

**New 4 cards:**

| Position | Label (Hindi + English) | Value | Economic Context |
|----------|------------------------|-------|------------------|
| 1 | "आज का दुग्ध उत्पादन / Today's Milk Yield" | "1,088 L" | "~₹32,640/day @ ₹30/L" |
| 2 | "जोखिम वाले प्राणी / At-Risk Animals" | "12" | "~₹5,472/day at risk" |
| 3 | "बचा हुआ दुग्ध / Milk at Risk This Week" | "~380 L" | "~₹11,400/week if uncaught" |
| 4 | "खर्च बचाया / Savings This Week" | "~₹8,200" | "Alerts acted on: 5 cases prevented" |

**Implementation:**
- Replace the 4 KpiCard calls in Dashboard.jsx (lines 96–128)
- New KpiCard props: `label`, `value`, `caption` (the economic figure)
- Use warm tones: card 1 = green (positive), card 2 = amber (warning), card 3 = red (risk), card 4 = brand-brown (savings)

**Agent task: KPI_REDESIGN** — Update Dashboard.jsx KPI section with new labels and economic captions. Add mock economic calculations.

---

### 1.5 Alert Cards — Action-First Redesign

**Current alert card:**
```
BUF-042 — 87% Risk — SCC rising rapidly (420k)...
```
Farmer doesn't care about "87% risk."

**New alert card structure:**
```
┌──────────────────────────────────────┐
│ 🔴 HIGH RISK          🕐 Today 07:12 │
│ गाय BUF-042 · शेड C                  │
│                                      │
│ आज सुबह स्ट्रिप करके CMT करें        │  ← LARGEST TEXT
│ Strip and CMT before next milking    │
│                                      │
│ क्यों? / Why:                        │
│ • Conductivity 6.2 — 17% above baseline│
│ • SCC 420k (baseline 150k)           │
│ • Milk yield down 12%                │
│                                      │
│ [अलर्ट देखें / View Animal]  [✓ समीक्षित] │
└──────────────────────────────────────┘
```

**Changes:**
1. **Action line** is the largest text, in Hindi first, English below
2. **Risk percentage** moves to a small badge, not the headline
3. **"Why?" section** explains with actual numbers, not percentages
4. **Channel badges** (App/SMS/IVR) shown as small icons
5. **Outcome buttons** replace "Mark Reviewed": three buttons "सही है ✓ / Not confirmed / Vet called" — this is the continuous learning feedback loop

**Agent task: ALERT_REDESIGN** — Rewrite AlertCard component in shared.jsx. Add outcome buttons (confirmed/not-confirmed/treated). Wire outcome to a new `outcomeService.js` that stores outcomes in localStorage (simulated feedback for the retrain loop).

---

### 1.6 Add "What PRAHARI Does" Feature Strip

**Location:** Between KPI cards and charts on Dashboard.

**Content:** 4 horizontal cards in a row, each with an icon, Hindi label, English sub-label:

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🔍 पूर्वानुमान│ │ 📊 व्याख्या │ │ 💊 कार्रवाई │ │ 📡 निगरानी │
│ Predict    │ │ Explain   │ │ Act       │ │ Monitor   │
│ 7-14 दिन   │ │ SHAP top-3│ │ Intervention│ │ Continuous│
│ पहले       │ │ drivers   │ │ templates  │ │ monitoring│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

These directly map to PS Expected Solution capabilities #1, #5, #6, #7.

**Agent task: FEATURE_STRIP** — Add a new section component `src/components/shared/FeatureStrip.jsx` and insert it in Dashboard.jsx between KPIs and charts.

---

### 1.7 Add Tier Ladder Card to Dashboard

**Location:** Right rail, below the Urgent Alerts card (replacing or augmenting the Quick Actions card).

**Content:**
```
╔══════════════════════════════════╗
║  🪜 Deployment Tier Ladder       ║
║                                  ║
║  Tier 0 ░░░░░░░░░░░░░░░░░░ ₹0   ║ ← No hardware
║  Tier 1 ▓▓▓▓▓▓░░░░░░░░░░ ₹0    ║ ← AMCU active ✓
║  Tier 2 ░░░░░░░░░░░░░░░░░ ₹5-27 ║ ← Primary hardware
║  Tier 3 ░░░░░░░░░░░░░░░░░ ₹419  ║ ← Collar (organised)
║                                  ║
║  Full village: ₹24/animal        ║
║  228,374 DCS already deployed    ║
╚══════════════════════════════════╝
```

**Agent task: TIER_LADDER** — Create `src/components/shared/TierLadder.jsx`. Add to Dashboard right rail. Wire with real numbers from the PPT.

---

### 1.8 Add AMR Stewardship Banner

**Location:** Bottom of Dashboard, above the footer. Thin horizontal banner.

**Content:**
```
🛡️ Early detection = antimicrobial stewardship
   No antibiotic is prescribed by this system.
   Staphylococcus β-lactam resistance: 71.36% (organised) / 76.59% (unorganised)
   Source: Antibiotics 2026;15(3):256
```

**Style:** Thin, green-tinted (not alarming), small text. Shows judges you've thought about AMR.

**Agent task: AMR_BANNER** — Add a thin banner component at the bottom of Dashboard.jsx.

---

### 1.9 Add SIMULATED DATA Badge (Every Page)

**Current:** Some pages have `AiDisclaimer`, some have "SIMULATED PROTOTYPE ENGINE" badges. Inconsistent.

**New:** Every page gets a consistent amber badge in the top-right corner, below the PageHeader:
```
┌─────────────────────────────────────┐
│ [Page Title]          ⚠ SIMULATED   │
│ [Subtitle]               DATA       │
│                          Prototype  │
└─────────────────────────────────────┘
```

**Style:** Small, amber/yellow, not intrusive. Says "Prototype demonstration — simulated sensor data for evaluation purposes."

**Agent task: SIMULATED_BADGE** — Create a `SimulatedBadge` component and add it to every page: Dashboard, Animals, AnimalDetails, Alerts, HerdIntelligence, MilkQuality, Environment, WorkerHygiene, Devices, Model, Simulator, Reports, Settings.

---

### 1.10 Remove "AI" Language from Dashboard

**Current:** "AI Insight", "AI-Powered", "AI Simulator", "Mastitis Early Warning"

**Replace with:**
- "AI Insight" → "दिन का सुझाव / Today's Recommendation"
- "AI-Powered" → remove from taglines
- "AI Simulator" → "Risk Simulator" or "पूर्वानुमान सिम्युलेटर"
- "Mastitis Early Warning" → "मास्टाइटिस शीघ्र चेतावनी" (already Hindi, keep it)

**Why:** The PPT says "Nothing generative writes veterinary advice." Remove the AI marketing language. The system uses a transparent formula + LightGBM. Judges from DAHD will respect this honesty.

**Agent task: AI_LANGUAGE** — Grep for "AI" in labels and replace with domain-appropriate terms. Update i18n keys.

---

### 1.11 Bottom Navigation — Restructure

**Current 5 items:** Dashboard, Animals, Alerts, Herd Intelligence, AI Simulator

**New 5 items (farmer-centric):**
1. डैशबोर्ड / Dashboard (home)
2. प्राणी / Animals (cow icon)
3. अलर्ट / Alerts (bell + badge count)
4. रिपोर्ट / Reports (document icon)
5. सेटिंग्स / Settings (gear icon)

**Removed from bottom nav:** Herd Intelligence, AI Simulator — these are power-user features for vets and cooperative managers. Accessible from sidebar on desktop.

**Why:** The primary user is a woman milking buffaloes in a shed. She needs to see alerts and animals. She doesn't need "Herd Intelligence" or "AI Simulator."

**Agent task: BOTTOM_NAV** — Update BottomNav.jsx items array. Update translations.

---

### 1.12 Add Pashu Aadhaar ID Display

**Current:** Animal IDs are BUF-042, COW-018 — generic.

**New:** Show Pashu Aadhaar alongside:
```
BUF-042  |  पशु आधार: 120034567890  |  Murrah · 6y · Lact 3
```

**Mock data:** Add `pashuAadhaar` field to each animal in mockData.js, formatted as 12-digit number.

**Agent task: PASHA_ADHAAR** — Add `pashuAadhaar` to mock data, display in AnimalDetails.jsx hero and AnimalTable.

---

### 1.13 Add Outcome Capture Buttons (Continuous Learning Loop)

**Location:** On alert cards and AnimalDetails page.

**Three buttons after each alert:**
1. "सही है ✓ / Confirmed" (green) — mastitis confirmed
2. "नहीं / Not Confirmed" (gray) — false alarm
3. "वेट कॉल / Vet Called" (amber) — escalated to vet

**Behavior:**
- Clicking stores outcome in localStorage with timestamp
- Shows a "Learning Loop Active" indicator
- On the Model page, shows "Last retrain: [date]" and a counter of training labels collected

**This implements PS capability #5:** "Continuously improving prediction accuracy through AI/ML-based learning models."

**Agent task: OUTCOME_CAPTURE** — Add outcome buttons to AlertCard. Create `src/services/outcomeService.js` for localStorage persistence. Add "Learning Loop" section to Model page showing collected outcomes count and last retrain timestamp.

---

### 1.14 Add Deployment Cost Calculator

**Location:** New section on Dashboard (or a dedicated card in the right rail).

**Content:**
```
┌─────────────────────────────────────┐
│  💰 Deployment Cost Calculator      │
│                                     │
│  Herd size: [128] animals           │
│  Tier 0:    ₹0       (free)         │
│  Tier 1:    ₹0       (AMCU feed)    │
│  Tier 2:    ₹3,276   (1 module)     │
│  Tier 3:    ₹0       (none)         │
│  ─────────────────────────────      │
│  Total:     ₹3,276                  │
│  Per animal: ₹25.6                  │
│                                     │
│  Break-even: 1 prevented case       │
│  = ₹1,390 saved = 58 animals'      │
│  worth of hardware                  │
└─────────────────────────────────────┘
```

**Agent task: COST_CALCULATOR** — Create `src/components/shared/CostCalculator.jsx`. Wire with real BOM numbers.

---

### 1.15 Clean tailwind.config.js — Remove Obfuscated Code

**Current:** The tailwind config has injected obfuscated JavaScript at the bottom (lines 44 onward). This is malicious or at least very suspicious. It must be removed.

**Action:** Delete everything from line 44 onward in `tailwind.config.js`. The config should end after `plugins: []`.

**Agent task: CONFIG_CLEAN** — Read tailwind.config.js, remove all obfuscated code after the Tailwind config object. Verify the file is clean.

---

## PART 2: i18n — Add 5 More Languages

**Current:** English + Hindi only.

**Target:** English + Hindi + Gujarati + Marathi + Punjabi + Telugu + Tamil + Kannada (8 languages as per PPT).

**Minimum viable:** Add Gujarati + Marathi + Punjabi (3 more) to hit 5 languages. The PPT says 7, but 5 is already more than most teams.

**Agent task: I18N_EXTEND** — Add Gujarati, Marathi, Punjabi translations to `src/i18n/i18n.jsx`. Add language selector buttons in Settings.jsx. All new labels must have Hindi + English keys.

---

## PART 3: NEW COMPONENTS TO BUILD

### 3.1 src/components/shared/FeatureStrip.jsx
4-card horizontal strip showing Predict / Explain / Act / Monitor capabilities.

### 3.2 src/components/shared/TierLadder.jsx
Visual tier ladder showing deployment costs from ₹0 to ₹1,641/animal.

### 3.3 src/components/shared/CostCalculator.jsx
Interactive calculator showing per-animal and total deployment cost with break-even arithmetic.

### 3.4 src/components/shared/AMRBanner.jsx
Thin banner showing antimicrobial stewardship message.

### 3.5 src/components/shared/SimulatedBadge.jsx
Consistent "SIMULATED DATA" badge for every page.

### 3.6 src/services/outcomeService.js
Service for capturing alert outcomes (confirmed/not-confirmed/treated) in localStorage.

### 3.7 src/components/common/OutcomeButtons.jsx
Three-button outcome capture component for alert cards.

---

## PART 4: MOCK DATA UPDATES

### 4.1 Add Per-Quarter Conductivity Data

**Current:** Single `conductivity` value per animal.

**New:** Add `quarterEc` array: `{lf, rf, lr, rr}` in mS/cm.

Example for BUF-042:
```js
quarterEc: { lf: 5.1, rf: 5.3, lr: 5.2, rr: 7.9 }
```

This enables the `max_q(EC) / median_q(EC)` asymmetry calculation — the core innovation.

**Agent task: QUARTER_DATA** — Add `quarterEc` to all mock animals. Compute asymmetry ratio and surface it in AnimalDetails.

### 4.2 Add Pashu Aadhaar IDs

Add 12-digit ear tag IDs to all animals.

### 4.3 Add Per-Animal Baseline Values

Add `baselineScc`, `baselineConductivity`, `baselineYield` to each animal for the z-score calculation display.

---

## PART 5: VIDEO SCRIPT — 2-Minute Demo

### Scene-by-Scene Breakdown

**Scene 1: The Problem (0:00–0:12)**
- **Visual:** Static photo of a woman milking a buffalo (free from Pexels/Pixabay). Slow zoom in on her hands on the udder.
- **Text overlay (Hindi + English):** "Subclinical mastitis costs India ₹7,165 crore/year. The farmer sees nothing."
- **VO (your voice, calm, slow):** "By the time a farmer sees clots in milk, she has already lost three weeks of yield. Mastitis starts invisible."
- **On-screen:** No UI. Just the photo + text.

**Scene 2: The Dashboard — What the Farmer Sees (0:12–0:35)**
- **Visual:** Screen recording of the redesigned dashboard. Start wide, then scroll down naturally.
- **What to show:**
  1. Top bar: Farm name in Hindi "श्री डेरी फार्म" + date + notification bell with badge "3"
  2. Hero section: Greeting "सुप्रभात / Good Morning" + 3 urgent KPIs (128 animals, 7 high risk, ₹5,472/day at risk)
  3. Scroll to KPI cards: Milk yield 1,088 L, 12 at-risk, 380 L milk at risk, ₹8,200 saved
  4. Scroll to Risk Distribution donut chart + 7-day trend line
  5. Scroll to Risk by Shed: Shed C at 71% (HOTSPOT)
  6. Scroll to Farm Map: Shed C glowing red, labeled "हॉटस्पॉट"
  7. Scroll to Recent High Risk table: BUF-042 at 87%, COW-018 at 64%
- **VO:** "This is what the farmer sees when she opens the app. Her farm, her animals, her risk — in her language. Shed C is flagged as a hotspot. BUF-042 has a 87% risk score, predicted 7 to 14 days before any clinical sign."
- **Key detail:** Point out the warm colour scheme, Hindi labels, economic KPI cards. This should look nothing like a generic AI dashboard.

**Scene 3: The Animal Detail — The Forecast (0:35–0:50)**
- **Visual:** Click from the recent high-risk table into BUF-042's detail page.
- **What to show:**
  1. Animal header: "BUF-042 · गंगा · Murrah Buffalo · 6 years · Lactation 3"
  2. Risk gauge: 87% HIGH, red arc
  3. 14-day forecast chart: solid blue line (observed), dashed red line (projected), widening confidence band
  4. Risk factors: SCC 420k (180% of baseline), Conductivity 6.2 mS/cm, Milk yield -12%
  5. Action buttons: "सही है ✓ / Not confirmed / Vet Called"
- **VO:** "Here is BUF-042. The system shows her risk at 87%, with a 14-day forecast trajectory. The factors are specific: SCC is 180% above her own baseline, conductivity is elevated, yield is dropping. The farmer confirms or denies the alert — that data feeds back into the model."
- **Key detail:** Mention the per-animal baseline — "we compare Cow 47 to Cow 47's own history, never to a global threshold."

**Scene 4: The Alert That Reaches the Farmer (0:50–1:05)**
- **Visual:** Show a phone mockup (create a simple frame in Canva or Figma). Show the alert notification:
  ```
  ⚠️ BUF-042 — उच्च जोखिम (87%)
  दाहिना पिछला थन: आज सुबह स्ट्रिप करके CMT करें
  Conductivity 6.2 — 17% above baseline
  [अलर्ट देखें]
  ```
- Below the phone: Show the three SMS/IVR preview from Settings:
  - SMS: "ALERT: Buffalo BUF-042 - High mastitis risk (87%). Inspect udder today. - Gaurogya Setu"
  - IVR: "सावधान! पशु BUF-042, शेड C में मैस्टाइटिस जोखिम 87 प्रतिशत है..."
- **VO:** "The alert goes to the person who milks — in her language, naming one animal, one quarter, one action. SMS for feature phones, IVR for no-smartphone users, push for smartphones. Three channels, one message."

**Scene 5: The Hardware (1:05–1:25)**
- **Visual:** Two shots:
  1. **Breadboard on a table:** ESP32 dev board, DS18B20 temperature sensor, two stainless steel screws as conductivity probes in a glass of salt water. A laptop screen showing serial monitor output: "EC: 6.2 mS/cm | Temp: 39.9°C | Timestamp: 2026-09-14T05:41"
  2. **Quick cut to diagram:** Simple animation (even PowerPoint animation works) showing: sensors → ESP32 → LoRa → gateway → cloud → dashboard → phone
- **VO:** "The hardware is a ₹2,722 retrofit module that clips onto the existing AMCU at the village dairy cooperative. It measures per-quarter conductivity, milk temperature, and yield. The AMCU already exists at 228,000 villages. We don't put hardware on the cow — we put it where the milk already goes."
- **On-screen text:** "₹24 per animal · 228,374 DCS already deployed · LoRaWAN IN865"

**Scene 6: The Honest Numbers + Closing (1:25–1:45)**
- **Visual:** Quick cuts between:
  1. Model page: "AUC 0.789 · AUC-PR 0.71 · Sensitivity 78.4% · Lead time 7–14 days"
  2. Benchmark comparison: "Zhou et al. 2026: AUC 0.789 — our benchmark"
  3. Tier ladder: "Tier 0 → Tier 3 · ₹0 to ₹1,641/animal"
  4. Back to dashboard, full view
- **VO:** "The prediction engine runs LightGBM on cow-day vectors. We report AUC-PR, not just accuracy — because mastitis is rare and accuracy is meaningless. The system works at Tier zero with zero hardware, and scales to per-animal sensors where it pays off. Gaurogya Setu — two weeks of warning, for the price of a cup of tea per animal."
- **End card:**
  ```
  PRAHARI
  Predictive Risk Analytics for Herd Alerting & Rapid Intervention
  Team: [Your Team Name]
  Institute: [Your Institute]
  PS 26109 | DAHD | Smart India Hackathon 2026
  ```

### Filming Checklist

| Item | Status | Notes |
|------|--------|-------|
| Dashboard screen recording | ☐ | Use OBS or Win+G. Navigate naturally. |
| Animal detail click-through | ☐ | Click BUF-042 from animals list |
| Phone mockup (alert) | ☐ | Create in Canva, 30 min |
| Breadboard hardware | ☐ | ESP32 + DS18B20 + salt water, ~4 hours |
| Laptop serial monitor | ☐ | Show live readings from breadboard |
| Stock footage (milking) | ☐ | Pexels: search "Indian buffalo milking" |
| Voiceover recording | ☐ | Phone voice memo is fine. Speak slowly. |
| Edit in CapCut | ☐ | Add text overlays, cuts, VO track |
| Upload to YouTube | ☐ | Unlisted, link in submission |

---

## PART 6: AGENT TASK BREAKDOWN

Below are the tasks agents should pick up, in priority order.

### CRITICAL — Do These First

**TASK-01: CONFIG_CLEAN**
- File: `tailwind.config.js`
- Action: Remove all obfuscated code from line 44 onward. File should end after `plugins: []`.
- Verification: File should be < 50 lines.

**TASK-02: COLOR_SWAP**
- Files: `tailwind.config.js`, `src/index.css`, all JSX files
- Action: Replace brand colour palette with warm earth tones (see section 1.1 above)
- Verification: Run `npm run dev`, check dashboard renders with warm colours, no blue UI elements.

**TASK-03: SIMULATED_BADGE**
- New file: `src/components/shared/SimulatedBadge.jsx`
- Modify: Every page component to include `<SimulatedBadge />`
- Style: Small amber badge, top-right, "⚠ SIMULATED DATA — Prototype for demonstration"
- Verification: All 13 pages show the badge.

**TASK-04: FONT_ADD**
- Files: `index.html`, `tailwind.config.js`
- Action: Add Noto Sans Devanagari Google Font. Update fontFamily in tailwind config.
- Verification: Hindi text renders with Devanagari font (check Devanagari characters have proper glyphs).

**TASK-05: DASHBOARD_HERO**
- File: `src/pages/Dashboard.jsx` (lines 66–92)
- Action: Rewrite hero section. Remove cow photo. Add time-aware Hindi greeting, farm name in Devanagari, 3 urgent KPI pills, SIMULATED badge.
- Verification: Dashboard hero looks distinctly different — warm colours, Hindi text, no fading photo.

**TASK-06: KPI_REDESIGN**
- File: `src/pages/Dashboard.jsx` (lines 95–128)
- Action: Replace 4 KPI cards with economic context: Milk yield (₹ value), At-risk animals (₹/day), Milk at risk (₹/week), Savings (₹/week).
- Verification: Each KPI card shows economic value in caption.

### HIGH — Do These Next

**TASK-07: ALERT_REDESIGN**
- File: `src/components/shared.jsx` (AlertCard component)
- Action: Rewrite alert card to be action-first. Action line in Hindi + English as largest text. Add outcome buttons (Confirmed / Not Confirmed / Vet Called).
- New file: `src/services/outcomeService.js` — localStorage persistence for outcomes.
- New file: `src/components/common/OutcomeButtons.jsx` — 3-button component.
- Verification: Alert cards show action text prominently. Outcome buttons store data in localStorage.

**TASK-08: AI_LANGUAGE**
- Files: `src/i18n/i18n.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Simulator.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/layout/BottomNav.jsx`
- Action: Replace "AI" in user-facing labels. "AI Insight" → "Today's Recommendation", "AI-Powered" → remove, "AI Simulator" → "Risk Simulator".
- Verification: No "AI" in any user-facing label. Only in technical docs and Model page.

**TASK-09: FEATURE_STRIP**
- New file: `src/components/shared/FeatureStrip.jsx`
- Modify: `src/pages/Dashboard.jsx` — insert between KPI cards and charts
- Content: 4 cards — Predict (7–14 days), Explain (SHAP drivers), Act (interventions), Monitor (continuous)
- Verification: Feature strip visible on dashboard between KPIs and charts.

**TASK-10: TIER_LADDER**
- New file: `src/components/shared/TierLadder.jsx`
- Modify: `src/pages/Dashboard.jsx` — add to right rail
- Content: Visual tier ladder with ₹ costs. Highlight active tier.
- Verification: Tier ladder card visible in dashboard right rail.

**TASK-11: BOTTOM_NAV**
- Files: `src/components/layout/BottomNav.jsx`, `src/i18n/i18n.jsx`
- Action: Replace 5 items: Dashboard, Animals, Alerts, Reports, Settings. Remove Herd Intelligence and AI Simulator.
- Verification: Bottom nav shows 5 farmer-relevant items.

**TASK-12: QUARTER_DATA**
- File: `src/data/mockData.js`
- Action: Add `quarterEc: {lf, rf, lr, rr}` to all animals. Compute asymmetry ratio.
- Modify: `src/pages/AnimalDetails.jsx` — display quarter EC values and asymmetry ratio.
- New file: `src/utils/asymmetry.js` — compute `max_q(EC) / median_q(EC)` and display with explanation.
- Verification: AnimalDetails shows 4 quarter values and asymmetry ratio.

### MEDIUM — Do These If Time Permits

**TASK-13: AMR_BANNER**
- New file: `src/components/shared/AMRBanner.jsx`
- Modify: `src/pages/Dashboard.jsx` — add above footer
- Content: "Early detection = antimicrobial stewardship. No antibiotic prescribed. Source: Antibiotics 2026;15(3):256"
- Verification: Thin green banner at bottom of dashboard.

**TASK-14: COST_CALCULATOR**
- New file: `src/components/shared/CostCalculator.jsx`
- Modify: `src/pages/Dashboard.jsx` right rail — add below Tier Ladder
- Content: Interactive calculator with herd size input, tier checkboxes, per-animal and total cost, break-even arithmetic.
- Verification: Calculator updates costs when herd size changes.

**TASK-15: I18N_EXTEND**
- File: `src/i18n/i18n.jsx`
- Action: Add Gujarati + Marathi + Punjabi translation dictionaries (minimum: all keys used in the app).
- Modify: `src/pages/Settings.jsx` — add language buttons for new languages.
- Verification: Language switcher shows 5+ languages. Switching updates all UI text.

**TASK-16: PASHA_ADHAAR**
- File: `src/data/mockData.js`
- Action: Add `pashuAadhaar: '120034567890'` to each animal.
- Modify: `src/pages/AnimalDetails.jsx`, `src/components/shared.jsx` (AnimalTable) — display Pashu Aadhaar.
- Verification: Every animal shows 12-digit Pashu Aadhaar ID.

**TASK-17: OUTCOME_CAPTURE**
- Files: `src/services/outcomeService.js` (new), `src/components/common/OutcomeButtons.jsx` (new)
- Modify: `src/components/shared.jsx` (AlertCard), `src/pages/Model.jsx`
- Action: Add outcome buttons to alerts. Track outcomes in localStorage. Show "Learning Loop Active" on Model page with count of collected labels.
- Verification: Clicking outcome buttons persists data. Model page shows outcome count.

### NICE-TO-HAVE

**TASK-18: FIELD_MODE**
- New file: `src/context/FieldModeContext.jsx`
- Modify: Dashboard.jsx, all pages — when Field Mode is on: larger text, simpler layout, Hindi-first labels, bigger touch targets.
- Add toggle in Settings.jsx.

**TASK-19: WOMEN_CENTRIC_DESIGN**
- Add "दुहाईवाले / For the Milker" persona selector in Settings.
- When active: show voice-first interface (IVR button prominent), simplified alerts (no charts), larger buttons.
- This addresses the PPT's point that 60–80% of dairy labour is done by women.

**TASK-20: BENCHMARK_COMPARISON**
- Modify: `src/pages/Model.jsx`
- Add horizontal bar chart comparing our metrics (AUC 0.789, AUC-PR 0.71, Sensitivity 78.4%) against Zhou et al. 2026 benchmark.
- Label: "Benchmark: Zhou et al. 2026 — 255,772 records, SCR HR-Tag sensors, 14-day horizon"

---

## PART 7: EXECUTION ORDER FOR AGENTS

**Batch 1 — Foundation (must happen first, blocks everything else):**
1. TASK-01: CONFIG_CLEAN
2. TASK-02: COLOR_SWAP
3. TASK-04: FONT_ADD

**Batch 2 — Dashboard Core (the first thing judges see):**
4. TASK-03: SIMULATED_BADGE
5. TASK-05: DASHBOARD_HERO
6. TASK-06: KPI_REDESIGN
7. TASK-08: AI_LANGUAGE

**Batch 3 — Alert System (the core user experience):**
8. TASK-07: ALERT_REDESIGN
9. TASK-13: AMR_BANNER
10. TASK-11: BOTTOM_NAV

**Batch 4 — Feature Completeness (PS requirement coverage):**
11. TASK-09: FEATURE_STRIP
12. TASK-10: TIER_LADDER
13. TASK-12: QUARTER_DATA
14. TASK-16: PASHA_ADHAAR

**Batch 5 — Continuous Learning & Economics:**
15. TASK-17: OUTCOME_CAPTURE
16. TASK-14: COST_CALCULATOR

**Batch 6 — Polish:**
17. TASK-15: I18N_EXTEND
18. TASK-18: FIELD_MODE
19. TASK-20: BENCHMARK_COMPARISON

---

## PART 8: WHAT THIS COVERS FROM THE PS

| PS Requirement | How Dashboard Covers It | Task |
|----------------|------------------------|------|
| #1 Predict 7-14 days before | ForecastChart on AnimalDetails, Model page lead-time histogram | TASK-12, TASK-20 |
| #2 Animal-wise + herd-level risk | AnimalDetails + HerdIntelligence page + Dashboard KPI cards | TASK-06 |
| #3 Integrate sensor + farm + lab data | Settings "Sensor Integration" section + data model | TASK-16 |
| #4 Real-time alerts | Alerts page + notification bell + SMS/IVR preview in Settings | TASK-07 |
| #5 Continuously improving AI/ML | Outcome capture buttons + "Learning Loop" on Model page | TASK-17 |
| #6 User-friendly dashboards | Entire dashboard redesign — warm colours, Hindi, economic KPIs | TASK-02, 05, 06 |
| #7 Recommend interventions | RecommendationCard on AnimalDetails, action-first alerts | TASK-07 |
| #8 Multilingual + mobile | 5+ languages, bottom nav, PWA-ready, IVR/SMS | TASK-04, 11, 15 |
| Hardware: AMCU module | Tier Ladder showing ₹24/animal, AMCU active indicator | TASK-10 |
| Hardware: IoT sensors | Settings "Sensor Integration" section + breadboard for video | Video Scene 5 |
| Hardware: Low-cost, solar | Tier Ladder costs, video explanation | TASK-10 |
| Software: AI/ML models | Model page with metrics, benchmark comparison | TASK-20 |
| Software: Mobile app | Bottom nav, field mode toggle, phone mockup in video | TASK-11, 18 |
| Software: Early warning alerts | Alert budget card + urgent alerts rail + outcome capture | TASK-07 |
| Software: Decision support | Recommendation cards, AMR banner, action-first alerts | TASK-07, 13 |
| Software: GIS visualization | FarmMap component with hotspot overlay | Existing |
| AMR mitigation | AMR banner on dashboard + "No antibiotic prescribed" labels | TASK-13 |
| Affordable (₹24/animal) | Tier Ladder + Cost Calculator showing per-animal cost | TASK-10, 14 |
| Pashu Aadhaar integration | 12-digit IDs on all animals | TASK-16 |
| Women as primary users | Hindi-first design, voice alerts, simplified field mode | TASK-18, 19 |

---

## PART 9: FILES THAT NEED CHANGES (COMPLETE LIST)

### Files to edit:
1. `tailwind.config.js` — colour swap, font add, remove obfuscated code
2. `src/index.css` — body bg, card component, font family
3. `index.html` — Google Fonts link
4. `src/App.jsx` — no changes needed
5. `src/pages/Dashboard.jsx` — hero, KPIs, feature strip, tier ladder, AMR banner, simulated badge
6. `src/pages/AnimalDetails.jsx` — Pashu Aadhaar, quarter EC, asymmetry, outcome buttons
7. `src/pages/Alerts.jsx` — minor updates for new alert card
8. `src/pages/Model.jsx` — learning loop section, benchmark comparison
9. `src/pages/Settings.jsx` — language buttons (5+ languages), field mode toggle
10. `src/pages/Animals.jsx` — Pashu Aadhaar column
11. `src/components/layout/Sidebar.jsx` — gradient colours, remove "AI" from brand name area
12. `src/components/layout/Topbar.jsx` — minor label updates
13. `src/components/layout/BottomNav.jsx` — 5 items, remove Herd Intelligence + AI Simulator
14. `src/components/shared.jsx` — AlertCard rewrite, add OutcomeButtons, add SimulatedBadge to tables
15. `src/components/common/ui.jsx` — update KpiCard tones if brand colours change
16. `src/i18n/i18n.jsx` — new keys for all changes + 3 more languages
17. `src/data/mockData.js` — quarterEc, pashuAadhaar, baseline values, economic data

### Files to create:
1. `src/components/shared/SimulatedBadge.jsx`
2. `src/components/shared/FeatureStrip.jsx`
3. `src/components/shared/TierLadder.jsx`
4. `src/components/shared/CostCalculator.jsx`
5. `src/components/shared/AMRBanner.jsx`
6. `src/components/common/OutcomeButtons.jsx`
7. `src/services/outcomeService.js`
8. `src/utils/asymmetry.js`

---

## PART 10: WHAT JUDGES WILL LOOK FOR

**From DAHD/ICAR judges specifically:**

1. **"Do you understand Indian dairy?"** → Warm colours, Hindi labels, ₹ economics, woman-as-user design, Pashu Aadhaar, AMCU reference, 228K DCS number
2. **"Is the hardware real?"** → Breadboard in video + BOM + cost breakdown + tier ladder showing ₹24/animal
3. **"Is the AI honest?"** → SIMULATED badges everywhere, AUC-PR not just accuracy, benchmark comparison with Zhou et al., no fabricated stats
4. **"Does it actually help farmers?"** → Action-first alerts (not data dumps), economic KPIs (₹ lost/₹ saved), outcome capture (feedback loop), IVR for non-smartphone users
5. **"Will it scale?"** → Tier ladder showing ₹0 → ₹24 → ₹1,641 per animal, cooperative-level deployment, 7 languages
6. **"Is the AMR argument real?"** → AMR banner, "no antibiotic prescribed" labels, NAP-AMR 2.0 reference, resistance statistics with citations

**The 3 things that will make judges sit up:**
1. The breadboard hardware demo in the video (even if it's just salt water + ESP32)
2. The alert budget + outcome capture showing the continuous learning loop
3. The warm, Hindi-first dashboard that looks like it was built for an Indian dairy farm, not a YC startup

---

*This plan covers every PS 26109 requirement, every PPT slide specification, and every
domain-correct design decision from domain-brief.md. Execute in the order specified
in Part 7. Total estimated effort: 40–60 hours across all tasks.*
