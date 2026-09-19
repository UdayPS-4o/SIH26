# Attack Lab (`/attack`)

## What It Does
A control panel for simulating and monitoring network attacks. Select from 8 attack types (SYN Flood, UDP Flood, C2 Beacon, DGA Domain, DNS Tunnel, Port Scan, Data Exfil, TLS Beacon), configure parameters, launch simulated attacks, and observe real-time detection results in a live detection feed table.

## Data Flow
- **Component state** — `attackLogs` (array of AttackLog), `runningAttack` (current attack ID), `allDetections` (flat detection events), `totalDetected` counter.
- **Simulated detection** — Each attack launch triggers a timeout (800-2300ms) that generates a DetectionEvent with rule match, severity, confidence, latency, src/dst IPs, and evidence string.
- **Demo mode** — Auto-rotates through all 8 attack types every 3.5 seconds, generating a continuous stream of detections for showcase purposes.

## What Is Real
- Attack type catalog (8 types) with rule IDs, severity labels, and icon mapping.
- Launch button triggers per-attack detection simulation with realistic delays.
- Detection events include: rule ID, severity, confidence score (70-100%), latency (8-128ms), random src/dst IPs, and context-specific evidence strings.
- Stats panel tracks: attacks launched, detected count, detection rate %, and average latency.
- Detection feed is a scrollable table with row-in animations.

## What Is Fake
| Aspect | How |
|---|---|
| Detection timing | setTimeout-based simulation (800-2300ms), not real ML inference |
| Evidence strings | Pre-written templates randomly selected per attack type |
| Confidence/latency | Random values within realistic ranges |
| IP addresses | Randomly generated from prefix pools |
| Demo mode | Automated attack rotation, not real traffic |

## Verdict
~60% functional realism. The attack catalog, detection pipeline simulation, and evidence generation are all working. However, detections are simulated rather than real ML inference, and there's no actual network traffic generation.
