# EKADHARA — 3-Minute Video Prototype Script
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**NTRO · SIH 2026**

---

## Shot List

| # | Shot | Duration | Visual |
|---|------|----------|--------|
| 1 | Title card | 0:00–0:08 | EKADHARA logo on dark background. Text: "PS-26145 · NTRO · SIH 2026" |
| 2 | The Problem | 0:08–0:30 | Data diode diagram. Text overlays explaining the challenge |
| 3 | Architecture | 0:30–1:05 | System architecture diagram — unidirectional flow |
| 4 | Dashboard Tour | 1:05–2:00 | Live dashboard — Operations Center → Live Threats → Attack Console |
| 5 | Detection Demo | 2:00–2:30 | Launching an attack, seeing it detected in real-time |
| 6 | Results & Closing | 2:30–3:00 | Detection statistics, model accuracy, closing statement |

---

## Detailed Script

### SHOT 1: Title Card (0:00–0:08)

**[Visual: EKADHARA logo animates in, shield icon glows cyan]**

**Narration:**
"EKADHARA. AI-Based Detection of Cyber Threats in Unidirectional IP Traffic. Problem Statement 26145. Designed for the National Technical Research Organisation."

**[Text on screen: PS-26145 · NTRO · SIH 2026 · Blockchain & Cybersecurity]**

---

### SHOT 2: The Problem (0:08–0:30)

**[Visual: Diagram showing production network → data diode → monitoring enclave. One-way arrow only.]**

**Narration:**
"Critical infrastructure operators use data diodes to monitor network traffic. Traffic flows one way only — into the enclave. No return path. No probes. No handshakes. No ability to push commands back."

**[Text on screen: NO RETURN PATH · NO DECRYPTION · PASSIVE OBSERVATION ONLY]**

**Narration:**
"Any threat detection system must work purely from what it can passively observe — flow records, DNS queries, TLS fingerprints. Without ever contacting the source."

---

### SHOT 3: Architecture (0:30–1:05)

**[Visual: System architecture diagram]**

**Narration:**
"EKADHARA's pipeline has five stages."

**[Stage 1 appears: TRAFFIC INGEST]**
"First, traffic ingest — reading NetFlow, IPFIX, and sFlow records passively from the diode mirror."

**[Stage 2 appears: FEATURE EXTRACTION]**
"Second, feature extraction — 47 features across flow statistics, DNS entropy, TLS fingerprinting, and behavioral patterns."

**[Stage 3 appears: ML INFERENCE]**
"Third, ML inference — a stacking ensemble combining Random Forest, XGBoost, and a deep neural network. Trained on CIC-IDS2017 with synthetic attack augmentation."

**[Stage 4 appears: THREAT CLASSIFICATION]**
"Fourth, threat classification — six classes: DDoS, C2 beaconing, DGA domains, DNS tunneling, TLS anomalies, port scanning, and data exfiltration."

**[Stage 5 appears: ALERT OUTPUT]**
"Fifth, structured alert output — timestamp, flow ID, threat class, confidence score, and supporting evidence."

---

### SHOT 4: Dashboard Tour (1:05–2:00)

**[Visual: Screen recording of the EKADHARA dashboard]**

**[Navigate to: Operations Center]**
"Here is the EKADHARA Operations Center. Real-time KPI cards show active connections, threats blocked, total flows processed, and system uptime. The degradation matrix shows detection performance per threat type."

**[Navigate to: Live Threats]**
"The Live Threat Feed displays detected alerts in real-time. Each alert shows the threat class, source and destination IPs, ports, confidence score, and validity status — all marked as measured, never injected."

**[Navigate to: Network Map]**
"The Network Map visualizes traffic topology — source-destination pairs, protocol distribution, and attack concentration."

**[Navigate to: AI Analyzer]**
"The AI Analyzer panel shows model confidence distributions and threat type breakdowns."

**[Navigate to: Diode Lab]**
"The Diode Lab confirms the enclave's air-gap integrity — no return path, no decryption, read-only monitoring."

**[Navigate to: Attack Console]**
"The Attack Console lets operators generate controlled attack traffic for testing. Select from eight attack types, configure target and intensity, and launch. Detections appear immediately on the Live Threats page."

---

### SHOT 5: Detection Demo (2:00–2:30)

**[Visual: Attack Console — select "SYN Flood", set target to localhost:8000, click Launch]**

**Narration:**
"Let me demonstrate. I'll launch a SYN flood attack targeting the detection pipeline."

**[Click Launch button — show loading state]**

**[Switch to Live Threats tab — new alerts appear]**
"Within seconds, the detection pipeline identifies the attack. Here we see multiple DDoS alerts — each with source IP, destination port, confidence score of over 90 percent, and severity marked critical."

**[Switch back to Attack Console — show result]**
"The Attack Console confirms the launch and shows the backend response — alerts generated, source address, and latency."

---

### SHOT 6: Results & Closing (2:30–3:00)

**[Visual: Statistics overlay]**

**Narration:**
"EKADHARA processes over 45,000 flows per minute with 128,000+ alerts generated. Average detection confidence is 73.3 percent across all threat types. The system detects DGA domains, DNS tunneling, data exfiltration, TLS anomalies, port scans, and volumetric DDoS — all from passive observation only."

**[Visual: Detection breakdown chart]**
"DGA detection: 84,000 alerts. DNS tunneling: 17,000. Data exfiltration: 20,000. TLS anomalies: 4,000. Port scans: 1,100."

**[Visual: EKADHARA logo returns]**

**Narration:**
"EKADHARA. Protecting critical infrastructure through intelligent, passive threat detection. No decryption. No return path. Just detection."

**[Text on screen: EKADHARA · PS-26145 · NTRO · SIH 2026]**

---

## Production Notes

1. **Screen recording**: Use OBS Studio at 1920x1080, 30fps
2. **Theme**: Keep dark mode throughout for consistency
3. **Pre-load data**: Run attack scripts for 30 seconds before recording to populate the dashboard
4. **Browser**: Chrome, zoom 100%, no extensions visible
5. **Narration**: Record in a quiet environment with a good microphone. Pace at ~150 words/minute
6. **Music**: Subtle ambient electronic track underneath at -20dB
7. **Transitions**: Simple cuts between scenes. No flashy effects — this is a technical demo

## Pre-Recording Checklist

- [ ] Backend running on port 8000 with 50K+ flows
- [ ] Frontend running on port 5180
- [ ] Attack scripts tested and working
- [ ] Theme set to dark mode
- [ ] Browser cache cleared
- [ ] Desktop notifications disabled
- [ ] Recording software ready (OBS)
- [ ] Microphone tested
