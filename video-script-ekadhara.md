# EKADHARA — Video Script
**Project:** EKADHARA — AI Threat Detection for Air-Gapped Networks
**Duration:** ~2 minutes
**Tone:** Technical confidence, urgency, clarity

---

## Scene 1 — The Problem (0:00–0:20)
> **[Visual: Dark, flickering screens. Red warning lights. Industrial control room.]**

**Voiceover:**
> "Every 11 seconds, a cyber attack happens somewhere in the world.
> But the most critical networks — power grids, railways, defense systems —
> run on air-gapped networks. No cloud. No internet. No visibility."

> **[Text overlay: 0% visibility into air-gapped networks]**

---

## Scene 2 — The Solution (0:20–0:40)
> **[Visual: Clean shot. Title card: EKADHARA. Glowing cyan highlights.]**

**Voiceover:**
> "Meet EKADHARA.
> A zero-dependency network threat detection engine
> built for the environments that security forgot.
> It runs entirely on a laptop. No server. No cloud. No compromises."

> **[Visual: Laptop screen shows the EKADHARA demo interface.]**

---

## Scene 3 — The Demo (0:40–1:10) ⭐ THE MOMENT
> **[Visual: Switch to the demo-recorder.html interface. Click "Suspicious" scenario.]**

**Voiceover:**
> "Watch what happens in 60 seconds.
> A mixed attack scenario — DDoS, beaconing, port scanning, DGA, and data exfiltration — all at once."

> **[Visual: Click "Start Demo". Timer begins. Panels populate in real-time.]**

> "Five detectors run simultaneously against every packet."

> **[Visual: Stat card shows "1,247 packets analyzed". Alert panel populates.]**

> "DDoS detected at 18 seconds — SYN flood from 300 unique IPs."

> **[Visual: Alert card highlights in red. DEG badge pulses.]**

> "C2 beaconing identified — periodic callbacks every 5 seconds with near-perfect jitter."

> **[Visual: Timeline chart shows rhythmic pattern.]**

> "Port scan caught — 60 ports in 18 seconds from a single source."

> **[Visual: Flow table highlights the scanner IP.]**

> "And exfiltration — 50 kilobytes of data heading to an external IP before the session ends."

> **[Visual: Blocked banner appears: "2 flows blocked by Data Diode validation."]**

---

## Scene 4 — Technical Depth (1:10–1:35)
> **[Visual: Clean diagram overlay. Animated flow: PCAP → Parse → 5 Detectors → DEG Validation → Alerts.]**

**Voiceover:**
> "Each alert goes through our Differential Expert Group — three independent detection methods that must agree before raising an alert. No false positives from a single rule."

> **[Visual: Stats grid shows: 1,247 packets | 4 alerts | 2.1ms processing | 5 detectors]**

> "Sub-two-millisecond processing per packet.
> Supports Ethernet, VLAN, IPv4, IPv6.
> Runs in Full Duplex or Data Diode mode for the most restrictive environments."

---

## Scene 5 — Impact & Close (1:35–2:00)
> **[Visual: Return to title card. Logos and team name.]**

**Voiceover:**
> "EKADHARA: See everything. Touch nothing.
> Security for the networks that matter most."

> **[Text: Zero dependencies | 5 detection types | <2.5ms/packet | Air-gap ready]**

> **[Fade to black. Text: Built for SIH 2026.]**

---

## Demo Walkthrough Notes (for presenter)
1. Open `demo-recorder.html` directly — no server needed.
2. Click **"Suspicious"** scenario → **"Start Demo"**.
3. Narrate as panels populate: packets first, then alerts.
4. Point out the **DEG badge** — explain the triple-validation concept.
5. Mention **Data Diode mode** as the differentiator for critical infrastructure.
6. Keep the "Attack" scenario in reserve if judges want to see maximum intensity.
