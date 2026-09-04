# PRAHARI Demo Guide

PS 26109 · Category **Hardware** — which means the judges will look for hardware first. Lead with it.

---

## Quick start

```bash
docker compose up -d
docker compose exec api python -m app.seed --herds 3 --animals 300 --days 400
docker compose exec api python -m app.models.train --tier all
```

| | |
|---|---|
| Dashboard | http://localhost:3000 |
| API docs | http://localhost:8000/docs |
| Demo login | `demo@prahari.in` / `demo` — seeded, read-write, resets on restart |

**Bench hardware for the live moment:** the AMCU module (ESP32 + SS316 electrode pair + ADS1115 + DS18B20), a beaker of milk, a small pot of salt, and a USB power bank. Test it in the room you'll present in — WiFi in a demo hall is hostile, so have the module fall back to serial-over-USB into the API.

---

## The five-minute run

### 0:00–0:30 — The hardware, in your hand

Hold up the module. Dip the probe into plain milk; the conductivity reading appears live on screen. Add a pinch of salt, stir, dip again; the number moves.

> "This is the whole sensor. Two thousand seven hundred rupees, bolted to the milk collection unit a village already owns. It serves three hundred animals. Twenty-four rupees each."

**Why this first:** the category is Hardware, and a working physical device in the first thirty seconds earns you the next four and a half minutes. A slide of a render does not.

### 0:30–1:30 — The village view

Open the cooperative dashboard: 300 animals, banded No / Low / Moderate / High. **Two** HIGH alerts today.

> "Two alerts. Not sixty. The alert budget is five percent of the herd per day — a system that flags a fifth of the village gets uninstalled by Friday. Restraint is the feature."

Point at the watchlist count: the animals below the cut are still being scored, just not shouted about.

### 1:30–3:00 — One animal

Open Cow 47.

- **The risk trajectory** — fourteen days of calibrated probability, crossing into HIGH three days ago
- **The three SHAP drivers**, in plain language:
  - right-rear quarter conductivity is **1.5× the other three, at the same milking**
  - rumination is **down 38 minutes against her own baseline**
  - THI has been in the heat-stress band for **seven days**

> "She is not sick. Her milk looks normal and her udder feels normal. What we can see is that one quarter is behaving differently from the other three at the same milking — and that comparison cancels ambient temperature, vacuum, the operator, everything the four quarters share. That's where the two weeks come from."

**If a judge presses on conductivity — and one will:**

> "Conductivity alone is about sixty-six percent sensitive. Kandeel found AUC under 0.90 for every handheld meter and said they're not clinically useful on their own. We agree. That's why nothing here is a threshold on a raw value — every feature is a deviation from that animal's own history or a ratio within one udder."

### 3:00–4:00 — The instruction

Switch the app language to Gujarati. Tap the speaker icon; the alert is read aloud.

> "Cow 47, right-rear quarter. Strip it before the next milking and run a CMT. Milk her last. Post-milking teat dip on all four quarters. Do not start antibiotics — call the vet if the CMT scores 2 or more."

> "One animal, one quarter, one action, in her language, spoken — because sixty to eighty percent of Indian dairy labour, including the milking, is done by women, and literacy is not something we get to assume. And notice what the system never does: name a drug. Treatment stays with the vet. That's the AMR argument, not a limitation of it."

### 4:00–5:00 — Close the loop

Tap **CONFIRMED**. Show the outcome landing in `alert_outcome`, and the nightly retrain job queued in MLflow with champion/challenger.

> "Every alert becomes a training label. A retrained model is only promoted if it beats the incumbent on held-out-*herd* AUC-PR. That's capability five of the problem statement — 'continuously improving' — as a mechanism rather than a promise."

Finish on the model card at `/model/card`: version, training window, metrics, and its own stated limitations.

---

## What actually works in the demo

| Feature | Status |
|---|---|
| Live conductivity + temperature from real hardware over MQTT | **Real** |
| Ingest → features → hazard model → calibration → banding → SHAP → template | **Real** |
| Alert budget, hysteresis, watchlist | **Real** |
| Seven-language rendering; voice on the Hindi and Gujarati flows | **Real** |
| Outcome capture → nightly retrain, champion/challenger | **Real** |
| `/export/ade` ICAR Animal Data Exchange JSON | **Real** |
| District GIS hotspot layer (H3 + MapLibre + DataMeet boundaries) | **Real** |
| The herd's history and clinical outcomes | **SIMULATED — badge visible on every screen** |
| Collar rumination classification | Bench prototype; classifier trained on MmCows behaviour data |
| SMS / WhatsApp delivery | **Not built.** TRAI DLT and Meta verification are out of scope — say so |
| Live INAPH / Bharat Pashudhan integration | **Not built.** No public API exists — say so |

**Do not crop the SIMULATED badge out of screenshots.** Leaving it in is a strength; a judge who spots it cropped will stop believing everything else.

---

## Screenshot checklist for the deck

1. **A real photograph of the module on the bench**, probe in a beaker, laptop showing the live reading. Nothing in the deck matters more than this one.
2. Village dashboard — 300 animals, band distribution, two alerts.
3. Cow 47 detail — the risk trajectory and the three drivers.
4. The Gujarati alert card, with the speaker control visible.
5. The vet triage queue.
6. `/model/card` — showing the system reporting its own limitations.
7. The district hotspot map.

Screenshot at 2× device pixel ratio and crop to 16:9. Keep the risk-band colours identical to the deck palette in [`ppt-content.md`](ppt-content.md).

---

## Rehearsal notes

- **Rehearse the hardware failing.** Have a recorded 20-second clip of the live conductivity demo ready to play. Probes get knocked, USB ports get flaky, and a calm "here's the same thing from this morning" costs nothing.
- **Time the language switch.** It should be one tap. If it takes four, cut it and show a static Gujarati card.
- **Volunteer the weaknesses in this order** if asked for limitations: conductivity alone is weak → no Indian labelled dataset exists and here is the partnership plan → the state of the art at 14 days is AUC 0.79 and we measure against it. Saying these first is the strongest move available; being caught on any of them is the weakest position.
- **Know the five killer questions cold.** [`domain-brief.md`](domain-brief.md) §8.
- **Have the [DAHD Mastitis Strategy Document](https://dahd.gov.in/sites/default/files/2025-02/StrategyDocumentonthePreventionandControlofMastitisV-Final.pdf) open in a tab.** Quoting a DAHD judge their own department's document, by page, is worth more than any slide.

---

## If you have ten minutes instead of five

Insert, in this order:

1. **The tier ladder** (slide 7) — how the system is useful at ₹0 before any hardware is bought.
2. **The label-window diagram** (slide 8) — the blanking window, and why a model that looks too good is a broken one.
3. **The interoperability slide** (slide 15) — Pashu Aadhaar keying, live ICAR ADE export, and the plain statement that no public government API exists.
