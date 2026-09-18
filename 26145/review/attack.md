# Attack Simulation (`/attack`)

## What It Does
Launch 8 attack types (SYN Flood, UDP Flood, C2 Beaconing, DGA Domain, DNS Tunneling, Port Scan, Data Exfil, TLS Beaconing). Configurable parameters per attack (intensity, interval, port range, data size, jitter). Kill chain button runs 3 attacks sequentially. Real-time detection results panel. Attack history log. System console. DIODE MODE toggle that blocks all attacks.

## Data Flow
- **Attack launch:** POSTs to `window.location.origin + "/api/attack"` (i.e., backend `/api/attack`)
- **Detection updates:** WebSocket to `window.location.host + "/ws"` — subscribes to `alert` and `attack_update` messages
- **Fallback:** If POST to backend fails, simulates detection locally after 2-5 second random delay
- **DIODE mode:** Client-side only — blocks the POST call and logs a warning

## What Is Real
| Aspect | How |
|--------|-----|
| Backend `/api/attack` endpoint | Real — accepts `{attack_type, params, timestamp, detection_rule}` and triggers simulated attacks |
| Attack execution | Backend `simulator.py` generates real traffic patterns |
| Detection results | Backend `detector.py` analyzes flows and produces alerts |
| WebSocket alerts | Real-time alerts stream from backend |
| Time-to-detect | Measured from attack start to first detection alert |

## What Is Fake
| Aspect | How |
|--------|-----|
| Fallback detection | `randomDetection()` generates fake confidence/time if backend unreachable |
| Console log in fallback | Says "[SIM] Backend unavailable — simulating X" |
| Detection rule names | Hardcoded strings (R-001 through R-008) — labels only |

## Verdict
**~90% real when backend is connected.** Attack launch and detection are real backend operations. Only the fallback simulation (when backend is unreachable) is fake. This is the most data-real page in the app.
