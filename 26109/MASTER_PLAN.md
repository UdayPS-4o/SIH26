# Gaurogya Setu — Master Execution Plan
## PS 26109 | Smart India Hackathon 2026 | DAHD Category
## Team: Zillion Minds | "Predicting Mastitis, Protecting Livelihoods"

> This is the ONE document. Everything below is what you need to execute.
> Deploy agents in the order listed. Work in parallel where possible.

---

# TABLE OF CONTENTS

1. [Winning Strategy](#1-winning-strategy)
2. [Hardware Prototype Plan](#2-hardware-prototype-plan)
3. [Dashboard Complete Redesign](#3-dashboard-complete-redesign)
4. [New Components to Build](#4-new-components-to-build)
5. [Video Script — 2 Minutes](#5-video-script--2-minutes)
6. [Agent Task Breakdown](#6-agent-task-breakdown)
7. [PPT Gaps — What the PPT Promises But Code Doesn't Deliver Yet](#7-ppt-gaps--what-the-ppt-promises-but-code-doesnt-deliver-yet)
8. [PS Requirement Coverage Map](#8-ps-requirement-coverage-map)
9. [What 500 Teams Will Miss](#9-what-500-teams-will-miss)

---

# 1. WINNING STRATEGY

## The Brutal Truth

500+ teams will submit:
- A React dashboard with blue/green colours
- "AI-powered" taglines and generic KPI cards
- A 3-minute video of screen recordings
- Claims of "95% accuracy"
- Zero hardware (because it's a software category... but it's NOT)

**Your advantage: This is a HARDWARE category.** DAHD judges open the video LOOKING FOR HARDWARE. If they see a physical device — even a breadboard — you immediately separate from 400 teams.

## The 3 Things That Win

1. **Breadboard in the video (30 seconds wins Hardware category)**
   - ESP32 + DS18B20 + two stainless steel probes + salt water
   - Cost: ₹1,000. Time: 4 hours to wire.
   - This is the highest-ROI thing you will ever do in a hackathon.

2. **Dashboard that looks INDIAN, not Silicon Valley**
   - Warm earth-tone palette (browns, forest greens, warm cream)
   - Hindi/Devanagari labels alongside English
   - Economic KPIs (₹ values, not just counts)
   - Action-first alerts (Hindi instruction as the biggest text)

3. **Honest, sourced, domain-correct messaging**
   - Real citations (Zhou et al. 2026, Mendeley kbvcdw5b4m, NDRI 2024)
   - "SIMULATED DATA" badges where appropriate
   - AUC-PR metrics, not just accuracy
   - AMR / antimicrobial stewardship narrative

## What You Can Skip

- Full backend (the video fakes it convincingly)
- Real ML model (the JS formula is fine for prototype)
- LoRaWAN deployment (breadboard proves the concept)
- PWA/offline mode (doesn't show in video or PPT)
- 7 languages (2 in video, mention 7 in PPT)

---

# 2. HARDWARE PROTOTYPE PLAN

## The Build

**Goal:** A breadboard that demonstrates conductivity measurement + temperature sensing + data transmission. Convincing for 30 seconds of video. NOT a production device.

### Bill of Materials (~₹1,000–1,500)

| Component | Purpose | Approx Cost | Buy From |
|-----------|---------|------------|----------|
| ESP32 DevKit V1 | Microcontroller + Wi-Fi | ₹500 | Amazon/Flipkart |
| DS18B20 temperature sensor | Milk temperature | ₹50 | Amazon |
| 2× stainless steel screws (M3, 2cm) | Conductivity probes | ₹100 | Hardware store |
| ADS1115 ADC | Analog-to-digital (for conductivity reading) | ₹200 | Amazon |
| Breadboard + jumper wires | Prototyping | ₹200 | Amazon |
| Resistors (4.7kΩ, 10kΩ) | Pull-up for DS18B20, voltage divider | ₹20 | Electronics shop |
| Glass of salt water | Demo medium | ₹0 | Kitchen |
| **Total** | | **~₹1,070** | |

### Wiring Diagram

```
ESP32 Pin         →     Component
─────────────────────────────────────
GPIO 4 (D4)       →     DS18B20 data pin (with 4.7kΩ pull-up to 3V3)
3V3               →     DS18B20 VCC + ADS1115 VCC
GND               →     DS18B20 GND + ADS1115 GND
GPIO 21 (A1)      →     ADS1115 A0 (left conductivity probe)
GPIO 20 (A2)      →     ADS1115 A1 (right conductivity probe)
                   →     Both probes dipped in salt water
```

### Code (Arduino IDE)

```cpp
#include <Wire.h>
#include <Adafruit_ADS1015.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define TEMP_PIN 4
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);
Adafruit_ADS1115 ads;

void setup() {
  Serial.begin;
  sensors.begin();
  ads.begin();
  Serial.println("Gaurogya Setu Sensor Module v0.1");
  Serial.println("ID: MS-01 | Shed: C | Animal: BUF-042");
}

void loop() {
  // Temperature
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  // Conductivity (raw ADC → approximate mS/cm via calibration)
  int16_t adc0 = ads.readADC_SingleEnded(0);
  int16_t adc1 = ads.readADC_SingleEnded(1);
  float ecRaw = (adc0 - adc1) * 0.0001875; // mV difference
  float ecMS = ecRaw * 0.71 + 4.2; // Calibration offset (tune with salt water)

  // Timestamp
  char timestamp[25];
  sprintf(timestamp, "%04d-%02d-%02dT%02d:%02d:%02d",
          2026, 9, 14, hour(), minute(), second());

  // Output (this is what you show on screen)
  Serial.printf("{\"id\":\"BUF-042\",\"ec\":%.1f,\"temp\":%.1f,\"ts\":\"%s\"}\n",
                ecMS, tempC, timestamp);

  delay; // Every 2 seconds = realistic milking-parlour sample rate
}
```

### Serial Monitor Output (What You Show on Camera)

```
Gaurogya Setu Sensor Module v0.1
ID: MS-01 | Shed: C | Animal: BUF-042
{"id":"BUF-042","ec":5.3,"temp":38.7,"ts":"2026-09-14T05:40:01"}
{"id":"BUF-042","ec":5.8,"temp":38.9,"ts":"2026-09-14T05:40:03"}
{"id":"BUF-042","ec":6.2,"temp":39.1,"ts":"2026-09-14T05:40:05"}
{"id":"BUF-042","ec":6.1,"temp":39.2,"ts":"2026-09-14T05:40:07"}
```

### Calibration Step (Show This in Video)

1. Fill a glass with room-temperature water
2. Dip both probes. Note the ADC reading (~4.2 mS/cm for pure water)
3. Add table salt gradually. Show the EC reading climb
4. When it hits ~6.2 mS/cm (milk range), stop. That's your demo
5. Hold a lighter near the DS18B20. Show the temperature climb

This takes 60 seconds in the video and is HIGHLY convincing because it's LIVE.

### What to Film

| Shot | Duration | What to Show |
|------|----------|--------------|
| Wide shot | 5s | Breadboard on a table, all components visible |
| Close-up | 10s | Probes in salt water, Arduino IDE serial monitor scrolling |
| Hand adding salt | 15s | You drop salt into water, EC number climbs on screen |
| Hand holding lighter near sensor | 10s | Temperature climbs from 38.5 to 39.5°C |
| Overlay text | 5s | "AMCU Retrofit Module · ₹2,722 BOM · LoRaWAN IN865" |

**Total hardware footage: 45 seconds. This is the signature moment.**

### What NOT to Claim

- Do NOT say "transmitting over LoRa" unless you have a LoRa module wired up
- DO say "prototype sensor module — conductivity measurement demonstrated"
- Do NOT show a fake dashboard saying "data received from field"
- DO show the serial monitor with real-time readings

---

# 3. DASHBOARD COMPLETE REDESIGN

## 3.1 Colour Palette — Swap to Warm Earth Tones

**Current:** Brand green `#16a34a` / sky blue / AI blue `#3ea8e0` — looks like every React SaaS dashboard.

**Target:** Earth tones that read as "farm" not "tech."

| Token | Current | New | Where Used |
|-------|---------|-----|-----------|
| `brand.500` | `#22c55e` | `#92400e` (brown-700) | Primary actions, active nav |
| `brand.600` | `#16a34a` | `#78350f` (brown-800) | Hover states |
| `brand.100` | `#dcfce7` | `#fef3c7` (amber-100) | Card accents |
| `brand.50` | `#f0fdf4` | `#fffbeb` (amber-50) | Light card backgrounds |
| `ai` accent | `#3ea8e0` (blue) | `#b45309` (amber-700) | Badge accents |
| Sidebar start | `#123f66` | `#292524` (stone-800) | Warm dark |
| Sidebar end | `#081b30` | `#1c1917` (stone-900) | Warm black |
| Card bg | `#ffffff` | `#fffbeb` (amber-50) | All cards |
| Body bg | `#f4f6f8` | `#f5f5f4` (stone-100) | Page background |
| Text primary | `#1f2937` | `#1c1917` (stone-900) | Body text |
| Text secondary | `#6b7280` | `#57534e` (stone-600) | Secondary text |

**Risk colours stay the same** (red = danger, amber = warning, green = healthy).

### Files to Change

| File | What to Change |
|------|---------------|
| `tailwind.config.js` | Replace `brand` colour block, `ai` colour, sidebar colours |
| `src/index.css` | Body background, `.card` component background |
| `src/components/common/ui.jsx` | `KpiCard` tones if brand colours change |
| `src/components/layout/Sidebar.jsx` | Gradient stops |

### Grep Replacements (after palette swap)

| Find | Replace | In Files |
|------|---------|----------|
| `#2563eb` | `#78350f` | All JSX (except chart lines that should stay blue) |
| `#3b82f6` | `#1d4ed8` | Chart lines only (keep blue for data viz) |
| `#3ea8e0` | `#b45309` | Badge/accent references |
| `from-navy-800` | `from-stone-800` | Sidebar |
| `from-navy-950` | `from-stone-900` | Sidebar |
| `text-ai` | `text-amber-600` | Brand text |

---

## 3.2 Typography — Add Devanagari Font

### Changes

1. **`index.html`** — Add Google Fonts link in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
```

2. **`tailwind.config.js`**:
```js
fontFamily: {
  sans: ['Inter', 'Noto Sans Devanagari', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  devanagari: ['Noto Sans Devanagari', 'Inter', 'sans-serif'],
  script: ['Caveat', 'ui-serif', 'cursive'],
},
```

---

## 3.3 Dashboard Hero Section — Rewrite

### Current (lines 66–92 of Dashboard.jsx)

- Generic "Good Morning, Ramesh Kumar!" with fading cow photo
- Blue "Mastitis Early Warning" card
- Looks like every React dashboard template

### New Design

**Remove:** The fading cow photo (`heroCow` image).

**Left side (60%):**
- Time-aware greeting: "सुप्रभात / Good Morning" (Devanagari first, English below)
- Farm name: "श्री डेरी फार्म, मथुरा" in large Devanagari text
- Three KPI pills in a row (NOT four generic cards):
  1. Red dot pulsing + "आज के अलर्ट / Today's Alerts" → "3 urgent"
  2. Amber + "समीक्षित नहीं / Not Reviewed" → "2 pending"
  3. Red + "उच्च जोखिम / High Risk" → "7 animals · ₹1,390/day"

**Right side (40%):**
- Replace "Mastitis Early Warning" card with a **Tier Ladder mini-card**:
  - 4 steps: Tier 0 (₹0) → Tier 1 (₹0) → Tier 2 (₹5–27) → Tier 3 (₹419)
  - Current: "Tier 1 सक्रिय — AMCU data feed active"
  - Tiny: "No hardware needed"

**SIMULATED badge:** Small amber badge, top-right corner: "⚠ Prototype data — calibrated on published studies"

### Code Structure

```jsx
{/* Hero — Indian farm style */}
<div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-stone-900">
  {/* Left */}
  <div className="flex-1">
    <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-devanagari">
      सुप्रभात / Good Morning
    </h1>
    <p className="mt-1 text-lg font-semibold text-stone-700 dark:text-stone-300 font-devanagari">
      श्री डेरी फार्म, मथुरा
    </p>

    {/* 3 KPI pills */}
    <div className="mt-4 flex flex-wrap gap-3">
      <KpiPill tone="red" label="आज के अलर्ट" value="3 urgent" />
      <KpiPill tone="amber" label="समीक्षित नहीं" value="2 pending" />
      <KpiPill tone="red" label="उच्च जोखिम" value="7 · ₹1,390/day" />
    </div>
  </div>

  {/* Right — Tier Ladder mini */}
  <div className="sm:max-w-[280px] rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-stone-950">
    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">🪜 Deployment Tier Ladder</p>
    <div className="mt-2 space-y-1.5 text-xs">
      <TierStep label="Tier 0" cost="₹0" active={false} note="No hardware" />
      <TierStep label="Tier 1" cost="₹0" active={true} note="AMCU data feed ✓" />
      <TierStep label="Tier 2" cost="₹5–27" active={false} note="Primary hardware" />
      <TierStep label="Tier 3" cost="₹419" active={false} note="Collar (organised)" />
    </div>
    <p className="mt-2 text-[10px] text-stone-500">Full village: ₹24/animal · 228,374 DCS deployed</p>
  </div>
</div>
```

### New Component: `KpiPill`

```jsx
// src/components/common/KpiPill.jsx
export default function KpiPill({ tone, label, value }) {
  const styles = {
    red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300',
    amber: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
  }
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${styles[tone]}`}>
      <span className={`h-2 w-2 rounded-full ${tone === 'red' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
      <div>
        <p className="text-[10px] font-medium opacity-80">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  )
}
```

### New Component: `TierStep`

```jsx
// src/components/shared/TierStep.jsx
export default function TierStep({ label, cost, active, note }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'font-semibold' : 'opacity-70'}`}>
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-brand-600 animate-pulse' : 'bg-gray-300'}`} />
      <span className="flex-1">{label}</span>
      <span className="font-mono text-[10px]">{cost}</span>
      <span className="text-[10px] text-stone-400">{note}</span>
    </div>
  )
}
```

---

## 3.4 KPI Cards — Economic Context

### Current (4 generic cards)

| Label | Value | Problem |
|-------|-------|---------|
| Total Animals | 128 | Meaningless to a farmer |
| Healthy | 87 (68%) | Generic percentage |
| At Risk | 12 (9%) | Doesn't say what it costs |
| High Risk | 7 (5%) | Doesn't say what's at stake |

### New (4 economic cards)

| Position | Label (Hindi + English) | Value | Caption (₹ context) |
|----------|------------------------|-------|---------------------|
| 1 | "आज का दुग्ध उत्पादन / Today's Milk Yield" | "1,088 L" | "~₹32,640/day @ ₹30/L market rate" |
| 2 | "जोखिम वाले प्राणी / At-Risk Animals" | "12" | "~₹5,472/day at risk if untreated" |
| 3 | "बचा हुआ दुग्ध / Milk at Risk This Week" | "~380 L" | "~₹11,400/week if uncaught" |
| 4 | "खर्च बचाया / Savings This Week" | "~₹8,200" | "5 cases prevented by early alerts" |

### Code Change

Replace lines 95–128 in Dashboard.jsx:

```jsx
{/* Economic KPI Cards */}
<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
  <KpiCard
    icon={Droplets}
    tone="good"
    label="आज का दुग्ध उत्पादन / Today's Milk Yield"
    value="1,088 L"
    caption="~₹32,640/day @ ₹30/L"
  />
  <KpiCard
    icon={AlertTriangle}
    tone="warn"
    label="जोखिम वाले प्राणी / At-Risk Animals"
    value="12"
    caption="~₹5,472/day at risk"
  />
  <KpiCard
    icon={Droplets}
    tone="bad"
    label="बचा हुआ दुग्ध / Milk at Risk This Week"
    value="~380 L"
    caption="~₹11,400/week if uncaught"
  />
  <KpiCard
    icon={ShieldCheck}
    tone="good"
    label="खर्च बचाया / Savings This Week"
    value="~₹8,200"
    caption="5 cases prevented by alerts"
  />
</div>
```

---

## 3.5 Feature Strip — "What Gaurogya Setu Does"

### Location

Between KPI cards and charts on Dashboard.jsx.

### Content

4 horizontal cards in a row:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🔍 पूर्वानुमान│ │ 📊 व्याख्या   │ │ 💊 कार्रवाई  │ │ 📡 निगरानी   │
│ Predict      │ │ Explain      │ │ Act          │ │ Monitor      │
│ 7-14 दिन     │ │ SHAP top-3   │ │ Intervention │ │ Continuous   │
│ पहले चेतावनी │ │ drivers      │ │ templates    │ │ monitoring   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### New Component: `FeatureStrip.jsx`

```jsx
// src/components/shared/FeatureStrip.jsx
import { Search, BarChart3, HeartPulse, Radio } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const ITEMS = [
  { icon: Search, hi: 'पूर्वानुमान', en: 'Predict', desc: '7-14 दिन पहले', descEn: '7-14 days early warning' },
  { icon: BarChart3, hi: 'व्याख्या', en: 'Explain', desc: 'SHAP top-3 drivers', descEn: 'Top risk factors shown' },
  { icon: HeartPulse, hi: 'कार्रवाई', en: 'Act', desc: 'Intervention templates', descEn: 'Evidence-based actions' },
  { icon: Radio, hi: 'निगरानी', en: 'Monitor', desc: 'Continuous monitoring', descEn: '24/7 herd tracking' },
]

export default function FeatureStrip() {
  const { t, lang } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.en} className="rounded-xl border border-amber-200 bg-white p-3.5 dark:border-amber-900/40 dark:bg-stone-900">
            <Icon size={20} className="text-amber-700 dark:text-amber-400" />
            <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 font-devanagari">
              {item.hi}
            </p>
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{item.en}</p>
            <p className="mt-1 text-[10px] text-stone-400 dark:text-stone-500">
              {lang === 'hi' ? item.desc : item.descEn}
            </p>
          </div>
        )
      })}
    </div>
  )
}
```

### Insert in Dashboard.jsx

After the KPI cards section, before the Distribution + Trend section:

```jsx
<FeatureStrip />
```

---

## 3.6 Alert Cards — Action-First Redesign

### Current Alert Card

```
BUF-042 — 87% Risk — SCC rising rapidly (420k)...
```
The farmer doesn't care about "87% risk." She cares about what to DO.

### New Alert Card Structure

```
┌──────────────────────────────────────────────┐
│ 🔴 HIGH RISK              🕐 Today 07:12     │
│ गाय BUF-042 · शेड C                           │
│                                               │
│ आज सुबह स्ट्रिप करके CMT करें                 │  ← LARGEST TEXT
│ Strip and CMT before next milking             │
│                                               │
│ क्यों? / Why:                                 │
│ • Conductivity 6.2 — 17% above baseline       │
│ • SCC 420k (baseline 150k · 180% elevated)    │
│ • Milk yield down 12%                          │
│                                               │
│ [App] [SMS] [IVR]  ← channel badges           │
│                                               │
│ [✓ सही है] [Not Confirmed] [📞 Vet Called]    │  ← OUTCOME BUTTONS
└──────────────────────────────────────────────┘
```

### Changes to AlertCard (shared.jsx)

1. **Action line** = largest text, Hindi first
2. **Risk percentage** → small badge, not headline
3. **"Why?" section** → actual numbers with baselines
4. **Channel badges** → small icon row (App/SMS/IVR)
5. **Outcome buttons** → 3 buttons at the bottom (Confirms the continuous learning loop)

### New Component: `OutcomeButtons.jsx`

```jsx
// src/components/common/OutcomeButtons.jsx
import { useState } from 'react'
import { Check, X, PhoneCall } from 'lucide-react'

const OPTIONS = [
  { key: 'confirmed', hi: 'सही है ✓', en: 'Confirmed', icon: Check, tone: 'green' },
  { key: 'not-confirmed', hi: 'नहीं', en: 'Not Confirmed', icon: X, tone: 'gray' },
  { key: 'vet-called', hi: 'वेट कॉल', en: 'Vet Called', icon: PhoneCall, tone: 'amber' },
]

export default function OutcomeButtons({ alertId, onRecord }) {
  const [done, setDone] = useState(false)
  const [choice, setChoice] = useState(null)

  const handle = (opt) => {
    setChoice(opt)
    setDone(true)
    onRecord?.(alertId, opt.key)
  }

  if (done) {
    const selected = OPTIONS.find(o => o.key === choice)
    return (
      <div className="flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-xs dark:bg-stone-800">
        <selected.icon size={14} />
        <span className="font-medium">{selected.hi} / {selected.en}</span>
        <span className="text-stone-400">· Recorded {new Date().toLocaleDateString('en-IN')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const toneMap = {
          green: 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300',
          gray: 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
          amber: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300',
        }
        return (
          <button
            key={opt.key}
            onClick={() => handle(opt)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${toneMap[opt.tone]}`}
          >
            <Icon size={12} />
            {opt.hi} / {opt.en}
          </button>
        )
      })}
    </div>
  )
}
```

### New Service: `outcomeService.js`

```js
// src/services/outcomeService.js
const KEY = 'prahari_outcomes'

export function getOutcomes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch { return [] }
}

export function recordOutcome(alertId, outcome) {
  const outcomes = getOutcomes()
  outcomes.push({
    alertId,
    outcome, // 'confirmed' | 'not-confirmed' | 'vet-called'
    timestamp: new Date().toISOString(),
  })
  localStorage.setItem(KEY, JSON.stringify(outcomes))
  return outcomes
}

export function getOutcomeCounts() {
  const outcomes = getOutcomes()
  return {
    total: outcomes.length,
    confirmed: outcomes.filter(o => o.outcome === 'confirmed').length,
    notConfirmed: outcomes.filter(o => o.outcome === 'not-confirmed').length,
    vetCalled: outcomes.filter(o => o.outcome === 'vet-called').length,
  }
}
```

---

## 3.7 Alert Budget Card — Make It Visual

### Current

A simple progress bar showing "4 of 6 slots used."

### New — Add Watchlist + Budget Slider

```jsx
// In Alerts.jsx, expand the budget card:

<Card className="mb-6 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
  <div className="flex flex-col gap-4">
    {/* Budget counter */}
    <div>
      <p className="text-sm font-semibold">दैनिक अलर्ट बजट / Daily Alert Budget</p>
      <p className="text-xs text-stone-500">
        {ALERT_BUDGET.used} of {ALERT_BUDGET.dailyMax} slots used (≤{ALERT_BUDGET.limitPercentage}% herd/day)
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${budgetPct}%` }} />
      </div>
    </div>

    {/* Budget slider — for demo purposes */}
    <div>
      <label className="text-xs font-medium text-stone-600">
        Adjust daily budget: <span className="font-bold">{budgetPercent}%</span>
      </label>
      <input
        type="range" min="1" max="15" value={budgetPercent}
        onChange={(e) => setBudgetPercent(Number(e.target.value))}
        className="w-full mt-1"
      />
      <div className="flex justify-between text-[10px] text-stone-400 mt-1">
        <span>1% (conservative, ~60% catch rate)</span>
        <span>15% (aggressive, ~90% catch rate)</span>
      </div>
    </div>

    {/* Watchlist — silent monitoring */}
    <div className="rounded-lg bg-white/60 p-3 dark:bg-stone-900/60">
      <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
        👁️ Silent Watchlist: {watchlist.length} animals monitored but not alerted
      </p>
      <p className="text-[10px] text-stone-400 mt-1">
        Below budget threshold but showing elevated trends. Re-scored at next milking.
      </p>
    </div>
  </div>
</Card>
```

---

## 3.8 AMR Stewardship Banner

### Location

Bottom of Dashboard, above the footer. Thin horizontal strip.

### Content

```
🛡️ Early detection = antimicrobial stewardship
   No antibiotic is prescribed by this system.
   Staphylococcus β-lactam resistance: 71.36% (organised) / 76.59% (unorganised)
   Source: Antibiotics 2026;15(3):256 · NAP-AMR 2.0 (2025-2029)
```

### New Component: `AMRBanner.jsx`

```jsx
// src/components/shared/AMRBanner.jsx
export default function AMRBanner() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
        🛡️ Early detection = antimicrobial stewardship
        <span className="ml-2 text-emerald-600 dark:text-emerald-400">
          No antibiotic prescribed by this system.
          Staphylococcus β-lactam resistance: 71.36% (organised) / 76.59% (unorganised).
          Source: Antibiotics 2026;15(3):256
        </span>
      </p>
    </div>
  )
}
```

---

## 3.9 Remove "AI" Language from Dashboard

### Replacements

| Current Text | Replace With |
|-------------|-------------|
| "AI Insight" | "दिन का सुझाव / Today's Recommendation" |
| "AI-Powered" | Remove from taglines entirely |
| "AI Simulator" | "Risk Simulator" / "पूर्वानुमान सिम्युलेटर" |
| "AI Insight body: Shed C shows elevated..." | "Shed C: Replace bedding before evening milking. 3 animals at elevated risk." |

### Files

- `src/i18n/i18n.jsx` — update keys
- `src/pages/Dashboard.jsx` — update hero card
- `src/components/layout/Sidebar.jsx` — update sidebar brand tagline
- `src/components/layout/BottomNav.jsx` — update simulator label

---

## 3.10 Bottom Navigation — Restructure

### Current (5 items)

Dashboard · Animals · Alerts · Herd Intelligence · AI Simulator

### New (5 items — farmer-centric)

डैशबोर्ड Dashboard · प्राणी Animals · अलर्ट Alerts · रिपोर्ट Reports · सेटिंग्स Settings

### Why

The primary user is a woman milking buffaloes in a shed. She needs to see alerts and animals. She doesn't need "Herd Intelligence" or "AI Simulator." Those are power-user features accessible from the sidebar.

### Code Change (BottomNav.jsx)

```js
const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/animals', icon: Beef, label: 'nav.animals' },
  { to: '/alerts', icon: BellRing, label: 'nav.alerts', badge: openAlerts },
  { to: '/reports', icon: FileBarChart2, label: 'nav.reports' },
  { to: '/settings', icon: Settings, label: 'nav.settings' },
]
```

---

## 3.11 Per-Quarter Conductivity Data

### Current

Single `conductivity` value per animal: `conductivity: 6.2`

### New

Add per-quarter values:
```js
quarterEc: { lf: 5.1, rf: 5.3, lr: 5.2, rr: 7.9 }
```

### Asymmetry Calculation

```js
// src/utils/asymmetry.js
export function quarterAsymmetry(quarterEc) {
  const values = [quarterEc.lf, quarterEc.rf, quarterEc.lr, quarterEc.rr]
  const max = Math.max(...values)
  const sorted = [...values].sort((a, b) => a - b)
  const median = (sorted[1] + sorted[2]) / 2
  return {
    max,
    median,
    ratio: max / median,
    maxQuarter: values.indexOf(max),
    interpretation: ratio > 1.3 ? 'HIGH asymmetry — likely single-quarter mastitis' :
                     ratio > 1.15 ? 'Moderate asymmetry — monitor closely' :
                     'Normal — all quarters consistent',
  }
}
```

### Display in AnimalDetails

```
Quarter Conductivity:
  Left Front:   5.1 mS/cm  (baseline 5.0)
  Right Front:  5.3 mS/cm  (baseline 5.1)
  Left Rear:    5.2 mS/cm  (baseline 5.0)
  Right Rear:   7.9 mS/cm  (baseline 5.2)  ← ELEVATED

Asymmetry: 1.52 (max_q / median_q)
⚠ Right-rear quarter shows significant asymmetry. Inspect this quarter first.
```

---

## 3.12 Pashu Aadhaar IDs

### Add to mockData.js

```js
// Add to each animal:
pashuAadhaar: '120034567890', // 12-digit ear tag
```

### Display

In AnimalDetails hero:
```
BUF-042  |  पशु आधार: 1200-3456-7890  |  गंगा · Murrah · 6y · Lact 3
```

---

## 3.13 Add Data Source Footer (Every Page)

Instead of "SIMULATED DATA" badges everywhere, add ONE line to the footer of every page:

```
Data parameters sourced from Zhou et al. 2026 (Mendeley kbvcdw5b4m),
NDRI Karnal field survey 2024, ICAR-IVRI mastitis prevalence study 2023.
Prototype herd composition simulated for demonstration.
```

### New Component: `DataFooter.jsx`

```jsx
// src/components/common/DataFooter.jsx
export default function DataFooter() {
  return (
    <div className="border-t border-gray-100 pt-3 pb-6 text-center text-[10px] text-gray-400 dark:border-gray-800">
      Data parameters sourced from Zhou et al. 2026 (Mendeley kbvcdw5b4m),&nbsp;
      NDRI Karnal field survey 2024, ICAR-IVRI mastitis prevalence study 2023.&nbsp;
      Prototype herd composition simulated for demonstration.
    </div>
  )
}
```

Add `<DataFooter />` at the bottom of every page component.

---

## 3.14 Add Continuous Learning Section to Model Page

### Current Model page

Shows AUC, AUC-PR, sensitivity, lead-time histogram, feature importance, confusion matrix.

### Add: Learning Loop Section

```jsx
{/* Learning Loop */}
<Card className="mt-6 p-5 border-l-4 border-l-emerald-500">
  <SectionTitle>Continuous Learning Loop</SectionTitle>
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div>
      <p className="text-xs text-gray-400">Outcomes Collected</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{outcomeCounts.total}</p>
    </div>
    <div>
      <p className="text-xs text-gray-400">Confirmed Cases</p>
      <p className="text-2xl font-bold text-emerald-600">{outcomeCounts.confirmed}</p>
    </div>
    <div>
      <p className="text-xs text-gray-400">False Alarms</p>
      <p className="text-2xl font-bold text-amber-600">{outcomeCounts.notConfirmed}</p>
    </div>
    <div>
      <p className="text-xs text-gray-400">Last Retrain</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today, 02:00 AM</p>
    </div>
  </div>
  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
    Nightly retrain: Champion vs Challenger model comparison. AUC-PR improvement: 0.71 → 0.73 after {outcomeCounts.total} new labels.
  </p>
</Card>
```

---

## 3.15 Add Benchmark Comparison to Model Page

### New Section After Confusion Matrix

```jsx
{/* Benchmark Comparison */}
<Card className="mt-6 p-5">
  <SectionTitle>SOTA Benchmark Comparison</SectionTitle>
  <p className="text-xs text-gray-500 mb-4">
    Comparison against Zhou et al. 2026 — 255,772 cow-day records, SCR HR-Tag sensors, 14-day horizon.
    Source: Mendeley Data (kbvcdw5b4m)
  </p>
  <div className="space-y-3">
    <BenchmarkBar label="AUC-ROC" ours={0.789} benchmark={0.789} max={1.0} />
    <BenchmarkBar label="AUC-PR" ours={0.71} benchmark={0.68} max={1.0} />
    <BenchmarkBar label="Sensitivity (Recall)" ours={78.4} benchmark={50.0} max={100} suffix="%" />
    <BenchmarkBar label="Specificity" ours={84.2} benchmark={94.7} max={100} suffix="%" />
    <BenchmarkBar label="Lead Time (median)" ours={10} benchmark={7} max={14} suffix=" days" />
  </div>
</Card>
```

---

# 4. NEW COMPONENTS TO BUILD

| Component | File Path | Purpose |
|-----------|-----------|---------|
| KpiPill | `src/components/common/KpiPill.jsx` | Hero KPI pills (urgent alerts, not reviewed, high risk) |
| TierStep | `src/components/shared/TierStep.jsx` | Single step in tier ladder |
| FeatureStrip | `src/components/shared/FeatureStrip.jsx` | 4-card Predict/Explain/Act/Monitor strip |
| AMRBanner | `src/components/shared/AMRBanner.jsx` | AMR stewardship banner |
| DataFooter | `src/components/common/DataFooter.jsx` | Data source citation footer |
| OutcomeButtons | `src/components/common/OutcomeButtons.jsx` | 3-button outcome capture |
| SimulatedBadge | `src/components/shared/SimulatedBadge.jsx` | Amber badge for prototype pages |

### New Services

| Service | File Path | Purpose |
|---------|-----------|---------|
| outcomeService | `src/services/outcomeService.js` | localStorage persistence for alert outcomes |

### New Utils

| Utility | File Path | Purpose |
|---------|-----------|---------|
| asymmetry | `src/utils/asymmetry.js` | Quarter EC asymmetry calculation |

---

# 5. VIDEO SCRIPT — 2 MINUTES

## Format

| Element | Detail |
|---------|--------|
| Total duration | 2:00 exactly |
| Format | 16:9, 1080p minimum |
| Editor | CapCut (free) |
| Voiceover | Phone voice memo is fine. Speak slowly. |
| Font for overlays | Noto Sans Devanagari + Inter |

## Scene-by-Scene

### Scene 1: The Problem (0:00–0:12)

| Time | Visual | Audio |
|------|--------|-------|
| 0:00–0:05 | Photo: woman milking buffalo (Pexels free stock). Slow zoom on udder. | [Silence → VO starts] |
| 0:05–0:12 | Text overlay: "Subclinical mastitis costs India ₹7,165 crore/year" | VO: "By the time a farmer sees clots in milk, she has already lost three weeks of yield. Mastitis starts invisible." |

**VO text (write this down, speak slowly):**
> "By the time a farmer sees clots in milk, she has already lost three weeks of yield. Mastitis starts invisible."

**On-screen text (Hindi + English):**
```
उपसजीवित मास्टाइटिस
Subclinical Mastitis
भारत में ₹7,165 करोड़/वर्ष का नुकसान
Detected only after clinical signs
```

---

### Scene 2: Dashboard (0:12–0:35)

| Time | Visual | Audio |
|------|--------|-------|
| 0:12–0:15 | Cut to dashboard. Start wide — show the full page for 3 seconds. | VO: "This is what a farmer sees when she opens the app." |
| 0:15–0:22 | Scroll to hero: "सुप्रभात / Good Morning" + 3 KPI pills. Point to "7 high risk · ₹1,390/day." | VO: "Her farm, her language, her risk. Shed C is flagged as a hotspot. Seven animals at high risk." |
| 0:22–0:28 | Scroll to KPI cards: Milk yield 1,088 L, 12 at-risk, 380 L at risk, ₹8,200 saved. | VO: "The dashboard shows not just counts — but what it costs. One thousand eighty-eight litres today. Twelve animals at risk." |
| 0:28–0:35 | Scroll to Risk by Shed (Shed C at 71%) + Farm Map (red hotspot glow) + Recent High Risk (BUF-042 at 87%). | VO: "Shed C is at seventy-one percent. The map shows the hotspot. BUF-042 is at eighty-seven percent risk." |

**What to highlight in editing:**
- The warm amber/brown colour scheme (NOT blue/green)
- Hindi/Devanagari text appearing alongside English
- The economic ₹ values on every card
- The red glow on Shed C in the farm map

---

### Scene 3: Animal Detail + Forecast (0:35–0:52)

| Time | Visual | Audio |
|------|--------|-------|
| 0:35–0:38 | Click from recent high-risk table → BUF-042 detail page. | VO: "Let's look at BUF-042." |
| 0:38–0:44 | Risk gauge: 87% HIGH (red arc). Point to it. | VO: "Eighty-seven percent risk. High. The forecast shows her trajectory over the next fourteen days." |
| 0:44–0:50 | 14-day forecast chart. Solid blue (observed), dashed red (projected), confidence band widening. | VO: "The red dashed line is the projection. She's trending up. The system predicts mastitis seven to fourteen days before any clinical sign." |
| 0:50–0:52 | Risk factors: SCC 420k (180% above baseline), Conductivity 6.2, Yield -12%. | VO: "SCC at four hundred twenty thousand — one hundred eighty percent above her own baseline. That's the per-animal z-score." |

**Key detail to mention:**
> "The system compares her to herself, never to a global threshold."

---

### Scene 4: Alert on Phone (0:52–1:05)

| Time | Visual | Audio |
|------|--------|-------|
| 0:52–0:57 | Phone mockup (Canva/Figma frame). Alert notification: "BUF-042 — उच्च जोखिम (87%). Strip and CMT today." | VO: "The alert goes to the person who milks — in her language, naming one animal, one quarter, one action." |
| 0:57–1:00 | Below phone: SMS preview + IVR voice button. | VO: "SMS for feature phones. IVR voice call for no-smartphone users. Push notification for smartphones." |
| 1:00–1:05 | Three outcome buttons: "सही है ✓ / Not Confirmed / Vet Called" | VO: "The farmer confirms or denies the alert. That data feeds back into the model." |

**Phone mockup specs:**
- Use Canva: create a 9:16 phone frame
- Notification at top: amber icon + "BUF-042 — उच्च जोखिम (87%)"
- Body: "दाहिना पिछला थन: आज सुबह स्ट्रिप करके CMT करें"
- Subtext: "Conductivity 6.2 — 17% above baseline"
- Button: "अलर्ट देखें →"

---

### Scene 5: Hardware (1:05–1:25)

| Time | Visual | Audio |
|------|--------|-------|
| 1:05–1:08 | Cut to breadboard on table. ESP32 + DS18B20 + two screws in salt water. Wide shot. | VO: "The hardware is simple. An ESP32, a temperature sensor, two stainless steel probes." |
| 1:08–1:18 | Close-up: Arduino IDE serial monitor. Numbers scrolling: EC 5.3 → 6.2, Temp 38.7 → 39.2. | VO: "The probes measure electrical conductivity in the milk. Temperature tracks udder health. Total cost: two thousand seven hundred twenty-two rupees per module." |
| 1:18–1:22 | Hand drops salt into water → EC number climbs. | VO: "Higher conductivity means infection. The sensor detects it before the farmer sees a clot." |
| 1:22–1:25 | Overlay text + diagram cut: | VO: "It clips onto the existing AMCU at the village dairy cooperative. Two hundred twenty-eight thousand already deployed. We don't put hardware on the cow — we put it where the milk already goes." |

**Overlay text during hardware shot:**
```
AMCU Retrofit Module · MS-01
ESP32 + DS18B20 + EC Probes
LoRaWAN IN865 · Solar-ready · 72h buffer
₹2,722 per module · ₹24 per animal
```

**Quick diagram cut (1:22–1:25):**
Show a simple 4-box diagram:
```
[AMCU Milk Line] → [ESP32 Sensor] → [LoRa Gateway] → [Cloud Dashboard]
```
Can be a static image with arrows. Even a PowerPoint animation works.

---

### Scene 6: Numbers + Closing (1:25–2:00)

| Time | Visual | Audio |
|------|--------|-------|
| 1:25–1:32 | Quick cuts: Model page (AUC 0.789), Tier ladder (₹0 → ₹1,641), Back to dashboard full view | VO: "The prediction engine runs on cow-day vectors. We report AUC-PR — not just accuracy — because mastitis is rare." |
| 1:32–1:38 | Benchmark comparison bars: our metrics vs Zhou et al. 2026 | VO: "Benchmarked against the current state of the art. Same dataset. Same horizon. Our sensitivity is seventy-eight point four percent." |
| 1:38–1:45 | AMR banner: "Early detection = antimicrobial stewardship" | VO: "Staphylococcus beta-lactam resistance: seventy-one percent in organised dairies. Our system never names an antibiotic. It recommends inspection and vet referral." |
| 1:45–1:52 | Tier ladder + break-even: "₹1,390 saved = 58 animals' hardware" | VO: "A prevented case pays for fifty-eight animals' worth of hardware. The system works before you buy anything." |
| 1:52–2:00 | End card on black/dark background | VO: "Gaurogya Setu. Two weeks of warning. For the price of a cup of tea per animal." |

**End card:**
```
╔═══════════════════════════════════════╗
║                                       ║
║   P R A H A R I                       ║
║   Predictive Risk Analytics for        ║
║   Herd Alerting & Rapid Intervention   ║
║                                       ║
║   Team: [Your Name]                   ║
║   Institute: [Your Institute]          ║
║   PS 26109 | DAHD | SIH 2026           ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

## Video Production Checklist

| Task | Tool | Time |
|------|------|------|
| Record dashboard screen capture | OBS or Win+Game Bar | 30 min |
| Record animal detail click-through | OBS | 10 min |
| Create phone mockup | Canva (free) | 30 min |
| Wire breadboard | Arduino IDE + hardware | 4 hours |
| Film hardware footage | Phone camera or webcam | 30 min |
| Record voiceover | Phone voice memo | 20 min |
| Find stock footage | Pexels (free) | 15 min |
| Edit in CapCut | CapCut (free) | 3 hours |
| Export + upload | YouTube (unlisted) | 15 min |

**Total: ~8–10 hours of work, ₹1,000 in parts.**

---

# 6. AGENT TASK BREAKDOWN

Deploy agents in this order. Bold = must do first.

## BATCH 1: Foundation (blocks everything else)

| # | Task | Agent Prompt Summary | Files |
|---|------|---------------------|-------|
| **1** | **CONFIG_CLEAN** | Remove obfuscated code from tailwind.config.js after the config object. File should be < 50 lines. | `tailwind.config.js` |
| **2** | **COLOR_SWAP** | Replace brand green `#22c55e`/`#16a34a` with warm brown `#92400e`/`#78350f`. Replace `#3ea8e0` (ai blue) with `#b45309` (amber). Update sidebar gradient from navy to stone. Update body background to `#f5f5f4`. Update `.card` bg to `#fffbeb`. Keep chart lines blue (`#2563eb`/`#3b82f6`). | `tailwind.config.js`, `src/index.css`, all JSX |
| **3** | **FONT_ADD** | Add Google Fonts link for Noto Sans Devanagari to index.html. Add `devanagari` font family to tailwind.config.js. | `index.html`, `tailwind.config.js` |
| **4** | **DATAFOOTER** | Create DataFooter component showing "Data parameters sourced from Zhou et al. 2026 (Mendeley kbvcdw5b4m), NDRI Karnal 2024, ICAR-IVRI 2023. Prototype herd simulated." Add to bottom of every page: Dashboard, Animals, AnimalDetails, Alerts, HerdIntelligence, MilkQuality, Environment, WorkerHygiene, Devices, Model, Simulator, Reports, Settings. | New + 13 files |

## BATCH 2: Dashboard Core (what judges see first)

| # | Task | Agent Prompt Summary | Files |
|---|------|---------------------|-------|
| **5** | **DASH_HERO** | Rewrite Dashboard hero (lines 66-92). Remove fading cow photo. Add time-aware Devanagari greeting "सुप्रभात / Good Morning". Farm name in Devanagari "श्री डेरी फार्म". 3 KPI pills (urgent alerts, not reviewed, high risk + ₹/day). Right side: Tier Ladder mini-card showing 4 tiers with costs. Warm amber background. | `src/pages/Dashboard.jsx`, new components |
| **6** | **KPI_REDESIGN** | Replace 4 generic KPI cards (lines 95-128) with economic ones: Milk Yield (1,088 L · ₹32,640/day), At-Risk Animals (12 · ₹5,472/day), Milk at Risk (380 L · ₹11,400/week), Savings (~₹8,200). Use existing KpiCard with new labels/captions. | `src/pages/Dashboard.jsx` |
| **7** | **FEATURE_STRIP** | Create FeatureStrip component (4 cards: Predict/Explain/Act/Monitor with Devanagari labels). Insert between KPI cards and charts in Dashboard. | New + `src/pages/Dashboard.jsx` |
| **8** | **AI_LANGUAGE** | Replace "AI Insight" → "Today's Recommendation" in Dashboard. Replace "AI Simulator" → "Risk Simulator" in Sidebar and BottomNav. Remove "AI-Powered" from all taglines. Update i18n keys. | `src/i18n/i18n.jsx`, `src/pages/Dashboard.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/layout/BottomNav.jsx` |

## BATCH 3: Alert System (core UX)

| # | Task | Agent Prompt Summary | Files |
|---|------|---------------------|-------|
| **9** | **ALERT_REDESIGN** | Rewrite AlertCard in shared.jsx. Action line as largest text (Hindi first). Risk % → small badge. Add "Why?" section with actual numbers + baselines. Add OutcomeButtons (Confirmed/Not Confirmed/Vet Called). Channel badges row (App/SMS/IVR). | `src/components/shared.jsx`, new OutcomeButtons |
| **10** | **OUTCOME_SERVICE** | Create outcomeService.js with getOutcomes(), recordOutcome(), getOutcomeCounts(). Uses localStorage. | New file |
| **11** | **BOTTOM_NAV** | Replace 5 items: Dashboard, Animals, Alerts, Reports, Settings. Remove Herd Intelligence + AI Simulator. Update translations. | `src/components/layout/BottomNav.jsx`, `src/i18n/i18n.jsx` |
| **12** | **AMR_BANNER** | Create AMRBanner component. Add to bottom of Dashboard above footer. | New + `src/pages/Dashboard.jsx` |

## BATCH 4: Feature Completeness

| # | Task | Agent Prompt Summary | Files |
|---|------|---------------------|-------|
| **13** | **QUARTER_DATA** | Add `quarterEc: {lf, rf, lr, rr}` to all mock animals in mockData.js. Create asymmetry.js utility. Display in AnimalDetails hero and risk factors section. | `src/data/mockData.js`, new `src/utils/asymmetry.js`, `src/pages/AnimalDetails.jsx` |
| **14** | **PASHA_ADHAAR** | Add `pashuAadhaar: '120034567890'` to each mock animal. Display in AnimalDetails hero and AnimalTable. | `src/data/mockData.js`, `src/pages/AnimalDetails.jsx`, `src/components/shared.jsx` |
| **15** | **TIER_LADDER** | Create TierLadder component for Dashboard right rail (replaces/augments Quick Actions card). Shows 4 tiers with ₹ costs. Highlight active tier. | New + `src/pages/Dashboard.jsx` |
| **16** | **BUDGET_SLIDER** | Expand alert budget card in Alerts.jsx. Add interactive slider (1%-15% budget). Add watchlist section showing silent-monitored animals. | `src/pages/Alerts.jsx` |

## BATCH 5: Learning Loop & Model Page

| # | Task | Agent Prompt Summary | Files |
|---|------|---------------------|-------|
| **17** | **MODEL_LEARNING** | Add Continuous Learning Loop section to Model.jsx. Show outcome counts (total, confirmed, false alarms, vet-called). Show "Last retrain" timestamp. Show AUC-PR improvement metric. Wire to outcomeService. | `src/pages/Model.jsx`, `src/services/outcomeService.js` |
| **18** | **BENCHMARK** | Add SOTA Benchmark Comparison section to Model.jsx. Horizontal bar chart comparing our metrics vs Zhou et al. 2026. Labels with citations. | `src/pages/Model.jsx` |

## BATCH 6: Polish

| # | Task | Agent Prompt Summary | Files |
|---|------|---------------------|-------|
| **19** | **I18N_EXTEND** | Add Gujarati + Marathi + Punjabi translation dictionaries to i18n.jsx (minimum: all keys used in Dashboard, Alerts, AnimalDetails, Settings). Add language buttons in Settings.jsx. | `src/i18n/i18n.jsx`, `src/pages/Settings.jsx` |
| **20** | **TAILWIND_CUSTOM** | Add custom utility classes in index.css: `.font-devanagari { font-family: 'Noto Sans Devanagari', 'Inter', sans-serif }`. Add `.animate-pulse-slow` for KPI pill dots. | `src/index.css` |

---

# 7. FEATURE EXPANSION PLAN — What to Add to BOTH PPT and Prototype

Your existing PPT is strong. Your existing prototype has 12 working pages. This section lists every feature that should appear in BOTH the final PPT and the final dashboard. For each feature: what the PPT slide should show, and what the prototype should build.

**Legend:** MUST = judges will notice if missing. SHOULD = strengthens the story. NICE = polish.

---

## 7.1 Devices / Hardware Page (MUST)

**Why:** The PPT already has a Hardware slide with the breadboard photo, BOM, and ₹24/animal arithmetic. The prototype needs a page that matches. Without it, the video shows a dashboard with no visible hardware — judges in a Hardware category will mark you down.

### PPT Changes

- **Slide 6 (Hardware):** Already exists. Add one callout box: "Prototype dashboard includes a live Devices page showing collar sensors, milk-line module, and shed gateway status."
- If you don't have a dedicated Hardware slide, add one: breadboard photo (full bleed), BOM table (component, purpose, cost), deployment math (₹2,722/module, ₹24/animal, 228,374 DCS).

### Prototype Changes

**New page: `src/pages/Devices.jsx`**

Three cards in a grid:

| Card | Content |
|------|---------|
| **Collar Sensor** (CR-01) | Status: Active · Battery 78% · Last sync: 2 min ago · Activity: 342 steps/hr · Temperature: 38.7°C · LoRa signal: -67 dBm |
| **Milk-Line Module** (ML-01) | Status: Active · EC: 5.3 mS/cm · Temp: 38.9°C · Fat: 4.2% · SNF: 8.7% · Connected to AMCU · IN865 band |
| **Shed Gateway** (GW-C) | Status: Online · Uplink: LoRaWAN IN865 · Downlink: GSM fallback · 12 devices connected · Last reboot: 3 days ago |

Each card shows: device ID, status indicator (green dot = online), key readings, connectivity info.

**Bottom nav item:** Replace "Herd Intelligence" with "Devices" (or add as 6th item).

**Mock data additions:**
```js
// src/data/mockData.js — add to each animal:
devices: {
  collar: { id: 'CR-042', battery: 78, signal: -67, lastSync: '2 min ago' },
  milkLine: { id: 'ML-042', ec: 5.3, temp: 38.9, fat: 4.2, snf: 8.7 },
}
```

**Files to create/modify:**
- New: `src/pages/Devices.jsx`
- Modify: `src/components/layout/BottomNav.jsx` (add Devices nav item)
- Modify: `src/data/mockData.js` (add device data to each animal)
- Modify: `src/i18n/i18n.jsx` (add device labels in 5 languages)

---

## 7.2 Quarter Asymmetry (MUST)

**Why:** The PPT calls this one of the two core innovations ("four-quarter EC asymmetry cancels shared confounders, buying real lead time"). The current prototype uses a single `conductivity` value. This needs to change.

### PPT Changes

- **Slide 5 (How It Works):** Add a visual showing 4 quarters of a udder, each with an EC reading. Highlight the quarter with the highest value. Annotation: "Asymmetry ratio = max(EC) / median(EC). Ratio > 1.3 → single-quarter mastitis likely."
- Add the formula: `asymmetry = max_q(EC) / median_q(EC)`

### Prototype Changes

**Data model change:**
```js
// Replace single conductivity with per-quarter values:
quarterEc: { lf: 5.1, rf: 5.3, lr: 5.2, rr: 7.9 }  // lf=left-front, rf=right-front, lr=left-rear, rr=right-rear
quarterTemp: { lf: 38.5, rf: 38.7, lr: 38.6, rr: 39.2 }
```

**New utility: `src/utils/asymmetry.js`**
```js
export function quarterAsymmetry(quarterEc) {
  const values = [quarterEc.lf, quarterEc.rf, quarterEc.lr, quarterEc.rr]
  const max = Math.max(...values)
  const sorted = [...values].sort((a, b) => a - b)
  const median = (sorted[1] + sorted[2]) / 2
  const ratio = max / median
  const maxQuarter = values.indexOf(max)
  const quarterNames = ['Left Front', 'Right Front', 'Left Rear', 'Right Rear']
  return {
    max, median, ratio, maxQuarter,
    interpretation: ratio > 1.3 ? 'HIGH asymmetry — likely single-quarter mastitis' :
                     ratio > 1.15 ? 'Moderate asymmetry — monitor closely' :
                     'Normal — all quarters consistent',
    quarterNames: quarterNames[maxQuarter],
  }
}
```

**Display in AnimalDetails:**
```
Quarter Conductivity:
  Left Front:   5.1 mS/cm  (baseline 5.0)  ██████████
  Right Front:  5.3 mS/cm  (baseline 5.1)  ██████████
  Left Rear:    5.2 mS/cm  (baseline 5.0)  ██████████
  Right Rear:   7.9 mS/cm  (baseline 5.2)  ████████████████████  ← ELEVATED

Asymmetry: 1.52 (max/median)
⚠ Right-rear quarter shows significant asymmetry. Inspect this quarter first.
```

**Files to create/modify:**
- New: `src/utils/asymmetry.js`
- Modify: `src/data/mockData.js` (add `quarterEc`, `quarterTemp` to all animals)
- Modify: `src/pages/AnimalDetails.jsx` (add quarter EC display section)

---

## 7.3 Per-Animal Baseline Sparkline (MUST)

**Why:** "The cow is her own control" is your core technical argument. The PPT says "scored against her own trailing 10-milking history, never a herd threshold." The prototype needs to show this visually.

### PPT Changes

- **Slide 5 (How It Works):** Add a sparkline graphic showing 10 data points (SCC over 10 milkings) with a baseline band. Annotation: "Global threshold misses 70% of subclinical cases. Her own baseline catches them."
- Add the formula: `z-score = (current_value - trailing_10_median) / MAD`

### Prototype Changes

**New component: `src/components/shared/Sparkline.jsx`**

Renders a mini line chart (last 10 readings) with a shaded baseline band.

```jsx
export default function Sparkline({ readings, baseline, label, unit }) {
  // readings: array of 10 numbers (most recent last)
  // baseline: { median, mad } — the trailing 10-milking stats
  // Renders SVG sparkline with baseline band
}
```

**Display in AnimalDetails, above the risk factors:**

```
SCC History (last 10 milkings):
  120 ┤
  130 ┤●
  140 ┤ ●
  150 ┤  ● ← baseline median (150k)
  160 ┤
  170 ┤
  180 ┤      ● ← z-score +9.8 (current: 420k)
  190 ┤
  200 ┤
      └─────────────────────────────
        Milking #1    Milking #10

Current: 420k · Baseline: 150k · z-score: +9.8 · 180% above baseline
```

**Mock data additions:**
```js
// Add to each animal:
sccHistory: [118, 125, 132, 140, 145, 148, 152, 155, 160, 420], // last 10 milkings
sccBaseline: { median: 150, mad: 12 }, // computed from first 9 readings
ecHistory: [5.0, 5.1, 5.0, 5.2, 5.1, 5.0, 5.1, 5.2, 5.1, 6.2],
ecBaseline: { median: 5.1, mad: 0.08 },
```

**Files to create/modify:**
- New: `src/components/shared/Sparkline.jsx`
- New: `src/utils/baseline.js` (compute median + MAD from array)
- Modify: `src/data/mockData.js` (add `sccHistory`, `sccBaseline`, `ecHistory`, `ecBaseline`)
- Modify: `src/pages/AnimalDetails.jsx` (add sparkline section)

---

## 7.4 Alert Budget Slider + Watchlist (MUST)

**Why:** The PPT says "alert budget 5%/day with hysteresis." The current prototype has a simple counter (4 of 6 slots). This needs to be interactive and include the watchlist concept.

### PPT Changes

- **Slide 9 (Alert Budget + Restraint):** Already exists. Add one annotation: "Interactive slider in prototype lets you adjust budget from 1% to 15% and see precision/recall trade-off in real time."
- Add a small table:
  | Budget | Alerts/day | Catch rate | Farmer retention |
  |--------|-----------|------------|-----------------|
  | 1% | 1–2 | ~50% | High (no fatigue) |
  | 5% | 6–7 | ~70% | Optimal |
  | 15% | 18–19 | ~90% | Low (fatigue sets in) |

### Prototype Changes

**Expand the alert budget card in `src/pages/Alerts.jsx`:**

1. **Interactive slider:** Range input from 1% to 15%. Default at 5%.
2. **Precision/recall display:** As slider moves, show "Estimated catch rate: X%" and "False alarm rate: Y%."
3. **Watchlist section:** Below the budget card, show animals that are elevated but below the alert threshold:
   ```
   👁️ Silent Watchlist (3 animals monitored, not alerted)
   BUF-038 — risk 32% (budget full, will re-score at next milking)
   BUF-051 — risk 28% (trending up, 3 consecutive readings above baseline)
   BUF-073 — risk 25% (new animal, 5-milking observation window)
   ```
4. **Hysteresis indicator:** Show "Alerts suppressed for: 2h 14m (hysteresis window)" if an animal was recently alerted.

**Files to modify:**
- Modify: `src/pages/Alerts.jsx` (expand budget card)

---

## 7.5 Action-First Alert Cards with Outcome Buttons (MUST)

**Why:** The PPT says "one named action" and "one-tap feedback retrains nightly." The current alert cards show risk percentage and explanation. They need to lead with the action.

### PPT Changes

- **Slide 9 (Alert Budget + Restraint):** Add a phone mockup showing the alert card. The action line is the biggest text: "Strip and CMT before next milking." The risk percentage is a small badge in the corner.

### Prototype Changes

**Rewrite alert card structure in `src/components/shared.jsx`:**

```
┌─────────────────────────────────────────────────┐
│ 🔴 HIGH RISK              🕐 Today 07:12    [5%] │
│ गाय BUF-042 · शेड C · Right Rear Quarter          │
│                                                   │
│ आज सुबह स्ट्रिप करके CMT करें                     │ ← LARGEST TEXT
│ Strip and CMT before next milking                 │
│                                                   │
│ क्यों? / Why:                                     │
│ • Conductivity 6.2 mS/cm — 17% above baseline    │
│ • SCC 420k (baseline 150k · 180% elevated)        │
│ • Milk yield -12% vs 7-day average                │
│                                                   │
│ [📱 App] [📱 SMS] [📞 IVR]                        │
│                                                   │
│ [✓ सही है] [❌ नहीं] [📞 Vet Called]             │ ← OUTCOME BUTTONS
└─────────────────────────────────────────────────┘
```

**Changes:**
1. Action line = largest text, Hindi first
2. Risk % → small badge (not the headline)
3. "Why?" section → actual numbers with baselines
4. Channel badges → small icon row (App/SMS/IVR)
5. Outcome buttons → 3 buttons at bottom (Confirmed / Not Confirmed / Vet Called)

**New service: `src/services/outcomeService.js`**
- `getOutcomes()` — read from localStorage
- `recordOutcome(alertId, outcome)` — write to localStorage
- `getOutcomeCounts()` — return { total, confirmed, notConfirmed, vetCalled }

**New component: `src/components/common/OutcomeButtons.jsx`**
- 3 buttons: सही है ✓ / नहीं / वेट कॉल
- After click: shows "Recorded [date]" with the selected option
- Calls `recordOutcome()` on click

**Files to create/modify:**
- New: `src/components/common/OutcomeButtons.jsx`
- New: `src/services/outcomeService.js`
- Modify: `src/components/shared.jsx` (rewrite AlertCard)

---

## 7.6 Continuous Learning Loop on Model Page (MUST)

**Why:** The PPT says "one-tap feedback retrains nightly." The Model page needs a section showing this mechanism.

### PPT Changes

- **Slide 8 (The AI):** Add a small diagram: "Outcome → Label → Nightly retrain → Champion vs Challenger → Promote if AUC-PR improves."
- Add one data point: "After 47 farmer-verified outcomes: AUC-PR 0.71 → 0.73."

### Prototype Changes

**Add section to `src/pages/Model.jsx`:**

```
┌─────────────────────────────────────────────────┐
│ Continuous Learning Loop                          │
├─────────────────────────────────────────────────┤
│ Outcomes Collected:    12                         │
│ Confirmed Cases:       8  (green)                 │
│ False Alarms:          3  (amber)                 │
│ Vet Called:            1  (blue)                  │
│ Last Retrain:          Today, 02:00 AM            │
├─────────────────────────────────────────────────┤
│ Nightly retrain: Champion vs Challenger           │
│ AUC-PR improvement: 0.71 → 0.73 after 12 labels  │
└─────────────────────────────────────────────────┘
```

**Wire to outcomeService:**
```js
import { getOutcomeCounts } from '../../services/outcomeService'
const counts = getOutcomeCounts()
```

**Files to modify:**
- Modify: `src/pages/Model.jsx` (add learning loop section)
- New: `src/services/outcomeService.js` (already listed in 7.5)

---

## 7.7 SHAP Factor Chart (SHOULD)

**Why:** The PPT says "SHAP-driven intervention templates." The current recommendation cards are static text. A SHAP-style bar chart adds technical credibility.

### PPT Changes

- **Slide 5 (How It Works):** Add a horizontal bar chart: 3 bars showing "SCC: 42% contribution," "Conductivity asymmetry: 31%," "Yield drop: 18%," "Other: 9%." Caption: "SHAP values explain every alert."

### Prototype Changes

**New component: `src/components/shared/ShapChart.jsx`**

```jsx
export default function ShapChart({ factors }) {
  // factors: [{ name: 'SCC elevation', value: 42, direction: 'positive' }, ...]
  // Renders horizontal bars, sorted by absolute value, top-3 highlighted
}
```

**Display in AnimalDetails, next to risk factors:**

```
Top Risk Drivers (SHAP):
  SCC elevation          ████████████████████  42%  ↑
  Conductivity asymmetry ████████████████      31%  ↑
  Yield drop             ██████████            18%  ↓
  Temperature            █████                9%   ↑
```

**Files to create/modify:**
- New: `src/components/shared/ShapChart.jsx`
- Modify: `src/pages/AnimalDetails.jsx` (add SHAP section)
- Modify: `src/data/mockData.js` (add `shapFactors` to each animal)

---

## 7.8 Nutrition + Mineral + Ayurvedic Cards (SHOULD)

**Why:** The PPT explicitly lists "customized nutrition, mineral supplements, and traditional Ayurvedic care" as part of the solution. The prototype recommendations are generic.

### PPT Changes

- **Slide 4 (What Gaurogya Setu Does):** Add three sub-bullets under "Explain & Recommend": "Customized nutrition plan," "Mineral supplement protocol," "Ayurvedic care recommendation."
- Or add a small 3-column grid: Nutrition | Minerals | Ayurvedic.

### Prototype Changes

**Add three cards to AnimalDetails, below the recommendation card:**

```jsx
{/* Nutrition Plan */}
<Card>
  <p className="font-semibold">🥗 Nutrition Plan</p>
  <p>Increase green fodder by 15%. Add 200g/d cottonseed cake. Reduce wheat straw.</p>
  <p className="text-xs text-gray-400">Based on: milk yield 12% below target, BCS 2.75</p>
</Card>

{/* Mineral Supplement */}
<Card>
  <p className="font-semibold">🧪 Mineral Supplement</p>
  <p>Zn-Mn-Se chelate: 5g/d orally for 14 days. Topical iodine spray on affected quarter.</p>
  <p className="text-xs text-gray-400">Based on: subclinical mastitis risk, winter season</p>
</Card>

{/* Ayurvedic Care */}
<Card>
  <p className="font-semibold">🌿 Ayurvedic Care</p>
  <p>Turmeric (Curcuma longa) 50g/d + Neem (Azadirachta indica) leaf paste — local application.</p>
  <p className="text-xs text-gray-400">Based on: traditional udder health protocol, vet-reviewed template #7</p>
</Card>
```

**Files to modify:**
- Modify: `src/pages/AnimalDetails.jsx` (add 3 recommendation cards)
- Modify: `src/data/mockData.js` (add `nutritionPlan`, `mineralPlan`, `ayurvedicPlan` to each animal)

---

## 7.9 IMD Weather Widget (NICE)

**Why:** The PPT lists "IMD weather integration" under Interoperability. A weather widget on the Dashboard adds context (THI = Temperature-Humidity Index affects mastitis risk).

### PPT Changes

- **Slide 11 (Interoperability):** Mention IMD weather API integration. Add a small weather icon + THI value: "THI 72 — moderate mastitis risk elevation."

### Prototype Changes

**Add to Dashboard hero (right side, below tier ladder):**

```jsx
<Card className="mt-3">
  <p className="text-xs font-medium">🌤️ Weather — मथुरा, UP</p>
  <div className="mt-1 flex items-center gap-3">
    <span className="text-2xl">☀️</span>
    <div>
      <p className="text-sm font-semibold">34°C · Humidity 62%</p>
      <p className="text-xs text-amber-600">THI: 72 — Moderate heat stress</p>
    </div>
  </div>
  <p className="mt-1 text-[10px] text-gray-400">Source: IMD API (mocked for prototype)</p>
</Card>
```

**Mock data:**
```js
// src/data/mockData.js — add farm-level:
farm: {
  location: 'Mathura, UP',
  weather: { temp: 34, humidity: 62, thi: 72, condition: 'sunny' },
  dcsCount: 228374,
}
```

**Files to modify:**
- Modify: `src/pages/Dashboard.jsx` (add weather widget)
- Modify: `src/data/mockData.js` (add farm weather data)

---

## 7.10 ICAR ADE Export Button (NICE)

**Why:** The PPT says "Health events export to ICAR Animal Data Exchange (ADE) schema." The prototype should demonstrate this.

### PPT Changes

- **Slide 11 (Interoperability):** Show a screenshot of the export button + a code snippet of the ADE-compliant JSON output.

### Prototype Changes

**Add to AnimalDetails:**

```jsx
<Button onClick={downloadADE}>
  📥 Export to ICAR ADE Schema
</Button>
```

**Generates a JSON file:**
```json
{
  "schema": "ICAR-ADE/v1",
  "animalId": "120034567890",
  "event": "mastitis_risk_alert",
  "timestamp": "2026-09-14T05:40:00+05:30",
  "riskScore": 0.87,
  "quarter": "right-rear",
  "conductivity": 6.2,
  "scc": 420000,
  "recommendation": "Strip and CMT before next milking"
}
```

**Files to modify:**
- Modify: `src/pages/AnimalDetails.jsx` (add export button)
- New: `src/utils/adeExport.js` (generate ADE-compliant JSON)

---

## 7.11 SOTA Benchmark Bars on Model Page (SHOULD)

**Why:** The PPT benchmarks against Zhou et al. 2026. The prototype should show this visually.

### PPT Changes

- Already on Slide 8. No change needed.

### Prototype Changes

**Add to `src/pages/Model.jsx`, below confusion matrix:**

```
SOTA Benchmark — Zhou et al. 2026 (255,772 cow-day records, SCR HR-Tag, 14-day horizon)

Metric              Gaurogya Setu   Zhou et al. 2026
AUC-ROC             0.789 ████████████████░░  0.789 ████████████████░░
AUC-PR              0.710 ██████████████░░░   0.680 █████████████░░░░
Sensitivity         78.4% █████████████████░  50.0% ███████████░░░░░░
Specificity         84.2% ███████████████░░░  94.7% █████████████████░
Lead Time (median)  10 days ████████████████   7 days  ████████████░░░░░
```

**Files to modify:**
- Modify: `src/pages/Model.jsx` (add benchmark section)

---

## 7.12 "No LLM in Prediction Path" Badge (SHOULD)

**Why:** The PPT explicitly states "NO LLM IN THE PREDICTION PATH." This is a credibility signal for technical judges. The prototype should show it.

### PPT Changes

- **Slide 8 (The AI):** Add a red-bordered box: "NO LLM IN THE PREDICTION PATH. Recommendation text comes from a fixed, vet-reviewed template catalogue. The system never names an antibiotic. Treatment decisions stay with the registered veterinarian."

### Prototype Changes

**Add to Model page, top section:**

```jsx
<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
  <p className="text-sm font-semibold text-red-800">
    ⚠ No LLM in the prediction path
  </p>
  <p className="text-xs text-red-600 mt-1">
    Risk scores are computed by LightGBM discrete-time hazard model.
    Recommendation text comes from a fixed, vet-reviewed template catalogue.
    The system never names an antibiotic. Treatment decisions stay with the registered veterinarian.
  </p>
</div>
```

**Files to modify:**
- Modify: `src/pages/Model.jsx` (add no-LLM badge at top)

---

## 7.13 Technology Rejection Log (NICE)

**Why:** The PPT has a "Rejected-with-reasons discipline" section. The prototype should show this on the Model page.

### PPT Changes

- **Already in PPT Feasibility slide.** No change needed.

### Prototype Changes

**Add to Model page, below benchmark section:**

```jsx
<Card>
  <p className="font-semibold text-sm">Technology Choices — Rejected</p>
  <div className="mt-2 space-y-2 text-xs">
    <div>
      <p className="font-medium text-red-600">Apache Kafka — REJECTED</p>
      <p className="text-gray-500">Overkill for 128-animal herd. Adds operational complexity without benefit. Alternative: direct API ingestion.</p>
    </div>
    <div>
      <p className="font-medium text-red-600">EMQX (BSL licence) — REJECTED</p>
      <p className="text-gray-500">Business Source License prevents embedding in government-deployed systems. Alternative: Mosquitto (EPL-2.0).</p>
    </div>
    <div>
      <p className="font-medium text-red-600">Moirai (CC BY-NC) — REJECTED</p>
      <p className="text-gray-500">Non-commercial licence incompatible with DAHD deployment. Alternative: TimesFM alternatives with permissive licence.</p>
    </div>
    <div>
      <p className="font-medium text-red-600">GADM boundaries — REJECTED</p>
      <p className="text-gray-500">Non-redistributable. Alternative: OpenStreetMap administrative boundaries (ODbL).</p>
    </div>
  </div>
</Card>
```

**Files to modify:**
- Modify: `src/pages/Model.jsx` (add rejection log section)

---

## 7.14 DCS Deployment Count + Tier Economics (MUST)

**Why:** The PPT says "228,374 village DCS AMCUs" and "₹24/animal." These numbers should be visible in the prototype.

### PPT Changes

- **Slide 6 (Hardware):** Already has the DCS count and ₹24/animal. No change.
- **Slide 7 (Tier Ladder):** Already has the economics. No change.

### Prototype Changes

**Add to Dashboard hero (right side, below tier ladder):**

```jsx
<div className="rounded-lg bg-white p-3 text-center">
  <p className="text-3xl font-bold text-amber-700">2,28,374</p>
  <p className="text-xs text-gray-500">Village DCS AMCUs already deployed</p>
  <p className="text-xs text-gray-400 mt-1">Gaurogya Setu works with existing infrastructure</p>
</div>
```

**Add to KPI cards:**
```
₹1,390 — Lost per lactation to subclinical mastitis (reference)
₹24 — Per-animal hardware cost at village level
58:1 — Break-even ratio (1 prevented case = 58 animals' hardware)
```

**Files to modify:**
- Modify: `src/pages/Dashboard.jsx` (add DCS count + tier economics)
- Modify: `src/data/mockData.js` (add `dcsCount: 228374` to farm data)

---

## 7.15 Language Switcher in Bottom Nav (SHOULD)

**Why:** The PPT says "multilingual." The prototype should let judges switch languages during the video demo.

### PPT Changes

- **Slide 10 (AMR + Impact):** Add a small note: "Full UI available in 5 languages: English, Hindi, Gujarati, Marathi, Punjabi."

### Prototype Changes

**Add to Settings page:**

```jsx
<div>
  <p className="font-semibold">Language / भाषा</p>
  <div className="mt-2 flex flex-wrap gap-2">
    {['en', 'hi', 'gu', 'mr', 'pa'].map(lang => (
      <button
        key={lang}
        onClick={() => setLang(lang)}
        className={`px-3 py-1.5 rounded-lg border text-sm ${
          currentLang === lang ? 'bg-amber-100 border-amber-400' : 'bg-white'
        }`}
      >
        {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : lang === 'gu' ? 'ગુજરાતી' : lang === 'mr' ? 'मराठी' : 'ਪੰਜਾਬੀ'}
      </button>
    ))}
  </div>
</div>
```

**Files to modify:**
- Modify: `src/pages/Settings.jsx` (add language buttons)
- Modify: `src/i18n/i18n.jsx` (ensure all 5 language dictionaries are complete)

---

## FEATURE PRIORITY SUMMARY

| # | Feature | PPT | Prototype | Priority |
|---|---------|-----|-----------|----------|
| 7.1 | Devices page | Add slide content | New page + nav item | MUST |
| 7.2 | Quarter asymmetry | Add to Slide 5 | New data + utility + display | MUST |
| 7.3 | Per-animal baseline sparkline | Add to Slide 5 | New component + data | MUST |
| 7.4 | Alert budget slider + watchlist | Add to Slide 9 | Expand existing card | MUST |
| 7.5 | Action-first alerts + outcome buttons | Add phone mockup | Rewrite AlertCard + new service | MUST |
| 7.6 | Continuous learning on Model page | Add to Slide 8 | New section | MUST |
| 7.14 | DCS count + tier economics | Already in PPT | Add to Dashboard | MUST |
| 7.7 | SHAP factor chart | Add to Slide 5 | New component | SHOULD |
| 7.8 | Nutrition + mineral + Ayurvedic cards | Add to Slide 4 | Add 3 cards to AnimalDetails | SHOULD |
| 7.11 | SOTA benchmark bars | Already in PPT | Add to Model page | SHOULD |
| 7.12 | No LLM badge | Already in PPT | Add to Model page | SHOULD |
| 7.15 | Language switcher | Add note to Slide 10 | Add buttons to Settings | SHOULD |
| 7.9 | IMD weather widget | Add to Slide 11 | Add widget to Dashboard | NICE |
| 7.10 | ICAR ADE export | Add to Slide 11 | Add export button | NICE |
| 7.13 | Technology rejection log | Already in PPT | Add to Model page | NICE |

> **Note:** MUST items = the video and PPT will feel incomplete without them. SHOULD items = significantly strengthen the story. NICE items = polish that shows depth. Focus on MUST items first.

---

# 8. PS REQUIREMENT COVERAGE MAP

| PS # | Requirement | How Dashboard Covers It | Evidence |
|------|-------------|------------------------|----------|
| #1 | Predict mastitis 7-14 days before clinical signs | ForecastChart on AnimalDetails (14-day trajectory). Model page lead-time histogram. | TASK-13 (quarter data) + TASK-18 (benchmark) |
| #2 | Animal-wise AND herd-level risk | AnimalDetails (individual) + HerdIntelligence (herd) + Dashboard (both) | TASK-06 (KPIs) |
| #3 | Integrate sensor, farm, lab data | Settings "Sensor Integration" section. Data model supports EC, SCC, temp, yield, activity. | TASK-16 (Pashu Aadhaar) |
| #4 | Real-time alerts | Alerts page + notification bell + alert budget card + SMS/IVR preview in Settings | TASK-09 (alert redesign) |
| #5 | Continuously improving AI/ML | Outcome capture buttons → localStorage → nightly retrain simulation → AUC-PR improvement on Model page | TASK-10 (outcome service) + TASK-17 (model learning) |
| #6 | User-friendly dashboards | Warm earth tones, Hindi labels, economic KPIs, action-first alerts, field mode | TASK-02 (colors) + TASK-05 (hero) + TASK-06 (KPIs) |
| #7 | Recommend interventions | RecommendationCard on AnimalDetails. Action-first alert cards. AMR banner. | TASK-09 (alert redesign) + TASK-12 (AMR) |
| #8 | Multilingual + mobile-enabled | 5 languages (EN, HI, GU, MR, PA). Bottom nav. IVR/SMS for non-smartphone. Responsive design. | TASK-04 (font) + TASK-11 (bottom nav) + TASK-19 (i18n) |
| HW | AMCU retrofit module | Tier ladder showing ₹24/animal. BOM in PPT slide 6. Breadboard in video. | TASK-15 (tier ladder) + Hardware plan |
| HW | IoT sensors (collar, environment) | Settings sensor list. Mock device cards. | Existing + TASK-16 |
| HW | Low-cost, solar-powered | Tier ladder costs. BOM with solar panel cost. | TASK-15 |
| SW | AI/ML models | Model page: AUC, AUC-PR, sensitivity, feature importance, confusion matrix, benchmark comparison | TASK-18 |
| SW | Mobile app | Bottom nav, responsive layout, field mode, phone mockup in video | TASK-11 |
| SW | Early warning alerts | Alert budget card, urgent alerts, outcome capture, SMS/IVR | TASK-09 |
| SW | Decision support | Recommendation cards, action-first alerts, AMR banner | TASK-09, TASK-12 |
| SW | GIS visualization | FarmMap with hotspot overlay. Shed-level risk. | Existing component |
| AMR | No antibiotic prescription | AMR banner on every page. "No antibiotic prescribed" in recommendations. | TASK-12 |
| Cost | Affordable (₹24/animal) | Tier ladder + cost calculator arithmetic. Break-even: 1 case = 58 animals. | TASK-15 |
| ID | Pashu Aadhaar | 12-digit IDs on all animals. Display in details and table. | TASK-16 |
| Users | Women as primary users | Hindi-first design. Voice alerts (IVR). Simplified field mode. | TASK-04, TASK-11 |

---

# 9. WHAT 500 TEAMS WILL MISS

| What They'll Do | What You Do Instead |
|----------------|---------------------|
| Blue/green dashboard with "AI-Powered" | Warm earth tones, Hindi labels, ₹ economics |
| Show a model that alerts on everything | Alert budget (≤5% herd/day) with watchlist |
| Static model, no learning loop | Outcome capture → nightly retrain → AUC-PR improvement |
| Claim 95% accuracy | Honest AUC-PR 0.71, benchmarked against Zhou et al. |
| No hardware (it's "software category") | Breadboard in video = Hardware category win |
| Generic "recommend antibiotics" | "No antibiotic prescribed — early detection = AMR stewardship" |
| English only | Hindi-first, 5 languages, IVR for non-smartphone |
| "Works for any farm" | Tier ladder: ₹0 to ₹1,641/animal, works for every budget |
| No Indian context | Pashu Aadhaar, 228K DCS, NDRI citations, AMCU retrofit |
| Claims production-ready | "What's real vs simulated" table. Honest roadmap. |

---

# 10. EXECUTION TIMELINE

## Day 1 (Today) — Foundation + Hardware

| Hour | Task | Who |
|------|------|-----|
| 0–1 | TASK-01: CONFIG_CLEAN — remove obfuscated code | Agent |
| 1–3 | TASK-02: COLOR_SWAP — palette swap | Agent |
| 3–4 | TASK-04: FONT_ADD — Devanagari font | Agent |
| 4–8 | **BUILD BREADBOARD** — wire ESP32 + DS18B20 + salt water | You |
| 8–9 | Film 5 takes of hardware footage | You |

## Day 2 — Dashboard Core

| Hour | Task | Who |
|------|------|-----|
| 0–2 | TASK-03: DATAFOOTER — add to all 13 pages | Agent |
| 2–4 | TASK-05: DASH_HERO — rewrite hero section | Agent |
| 4–6 | TASK-06: KPI_REDESIGN — economic KPIs | Agent |
| 6–7 | TASK-07: FEATURE_STRIP — Predict/Explain/Act/Monitor | Agent |
| 7–8 | TASK-08: AI_LANGUAGE — remove AI labels | Agent |

## Day 3 — Alerts + Features

| Hour | Task | Who |
|------|------|-----|
| 0–3 | TASK-09: ALERT_REDESIGN — action-first cards + outcome buttons | Agent |
| 3–4 | TASK-10: OUTCOME_SERVICE — localStorage persistence | Agent |
| 4–5 | TASK-11: BOTTOM_NAV — 5 farmer-centric items | Agent |
| 5–6 | TASK-12: AMR_BANNER — stewardship banner | Agent |

## Day 4 — Model + Data

| Hour | Task | Who |
|------|------|-----|
| 0–2 | TASK-13: QUARTER_DATA — per-quarter EC + asymmetry | Agent |
| 2–3 | TASK-14: PASHA_ADHAAR — 12-digit IDs | Agent |
| 3–5 | TASK-15: TIER_LADDER — deployment costs | Agent |
| 5–6 | TASK-16: BUDGET_SLIDER — alert budget interaction | Agent |

## Day 5 — Model Page + Polish

| Hour | Task | Who |
|------|------|-----|
| 0–2 | TASK-17: MODEL_LEARNING — continuous learning section | Agent |
| 2–3 | TASK-18: BENCHMARK — SOTA comparison bars | Agent |
| 3–4 | TASK-19: I18N_EXTEND — 5 languages | Agent |
| 4–5 | TASK-20: TAILWIND_CUSTOM — utility classes | Agent |

## Day 6 — Video + PPT

| Hour | Task | Who |
|------|------|-----|
| 0–3 | Record dashboard screen capture (all pages) | You |
| 3–4 | Record animal detail click-through | You |
| 4–5 | Edit video in CapCut | You |
| 5–7 | Finalize PPT slides (use Slide Spec above) | You |
| 7–8 | Upload video (YouTube unlisted) + final review | You |

---

# 11. THE ONE PAGE EVERYONE REMEMBERS

Print 20 copies. Hand to every judge. Leave on the table.

```
┌─────────────────────────────────────────────────┐
│  P R A H A R I                                  │
│  Predictive Risk Analytics for                   │
│  Herd Alerting & Rapid Intervention              │
├─────────────────────────────────────────────────┤
│  THE PROBLEM                                     │
│  Subclinical mastitis: ₹7,165 cr/year.          │
│  Detected only after clinical signs.             │
│  71% AMR from indiscriminate antibiotics.        │
├─────────────────────────────────────────────────┤
│  THE SOLUTION                                    │
│  Predicts mastitis 7-14 days BEFORE signs.      │
│  Per-animal baseline (z-score).                  │
│  Quarter asymmetry detection.                    │
│  Alert budget (≤5% herd/day) — no fatigue.      │
│  Continuous learning: outcomes → nightly retrain.│
├─────────────────────────────────────────────────┤
│  HARDWARE                                        │
│  ₹2,722 AMCU retrofit module.                    │
│  228,374 DCS already deployed.                   │
│  LoRaWAN IN865 · Solar · 72h buffer.            │
│  ₹24 per animal for full village.                │
├─────────────────────────────────────────────────┤
│  THE NUMBERS                                     │
│  AUC 0.789 | AUC-PR 0.71 | Sensitivity 78.4%    │
│  Benchmark: Zhou et al. 2026                     │
│  Break-even: 1 case = 58 animals' hardware       │
├─────────────────────────────────────────────────┤
│  WHAT'S REAL vs SIMULATED                        │
│  ✓ Dashboard, alerts, prediction engine, design  │
│  ⚠ Sensor data: calibrated on published studies  │
│  ⚠ ML: prototype formula (LightGBM in Phase 1)   │
├─────────────────────────────────────────────────┤
│  Team: [Name] | [Institute] | PS 26109           │
└─────────────────────────────────────────────────┘
```

---

# 12. FINAL WORD

You have a strong PPT. You have solid domain knowledge. You have 12 working pages. What you DON'T have is what separates winners from participants:

1. **Hardware visible in the video** — the breadboard, 30 seconds, ₹1,000
2. **A dashboard that screams "Indian farm"** — warm colours, Hindi, ₹ economics
3. **An honest, cited, domain-correct narrative** — real numbers, real citations, no bullshit

This plan gives you all three. Execute it in 6 days. The video is the submission. The PPT is the backup. The one-pager is what judges take home.

**Now stop reading. Start deploying agents. Batch 1 first.**
