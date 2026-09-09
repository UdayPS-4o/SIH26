# EKADHARA — 1:45 Demo Video Script (v3 — Desktop App Edition)

## Setup
- Open `demo-recorder.html` in Chrome (full screen, 1920×1080)
- Start recording (Win+G)
- The app now looks like a native Windows desktop application

---

## TIMING  |  ACTION  |  VOICEOVER SCRIPT
---------|----------|--------------------------------------------------

0:00-0:10 | **App launches.** Show the native Win32-style window: title bar, menu bar (File, View, Capture, Analysis, Tools, Help), toolbar, sidebar. Let the console log at the bottom populate with boot messages.
| "EKADHARA is a purpose-built network threat detection system for Indian Railways' OT infrastructure. It runs entirely on-premise as a desktop application. No cloud dependency, no data leaving the network."

0:10-0:20 | **Dashboard view.** Show the four KPI cards — throughput at 47K flows/s, active alerts, 97.6% detection rate, 14ms latency. Point out the live throughput chart updating in real time.
| "The dashboard gives operators a unified view of network health. Throughput, active alerts, detection accuracy, response latency — all updating in real time as packets are analyzed."

0:20-0:30 | **Scroll to Threats Blocked counter** (847 threats). Then scroll to alert feed.
| "So far in this session, EKADHARA has blocked 847 threats. Each alert shows the threat type, source and destination IP, confidence score, and protocol."

0:30-0:40 | **Show alert search.** Type "DDoS" to filter. Show a critical alert, click it to open the detail modal. Close modal.
| "Click any alert for full packet details — source, destination, protocol, port, data volume, duration, and packet hash. The search filters in real time across all fields."

0:40-0:48 | **Click "Topology" in sidebar.** Show network map with 15 devices. Hover over a node.
| "The topology view maps all monitored devices — routers, switches, firewalls, IDS sensors, PLCs, SCADA systems, and gateways. Color-coded by health status. Click any node for full details."

0:48-0:55 | **Click "Packets" in sidebar.** Click a packet row to show inspector detail.
| "The packet inspector gives a live view of every packet on the network. Filter by IP or protocol. Click any row to inspect the full header — flags, TTL, window size, checksum."

0:55-1:02 | **Click "Traffic" in sidebar.** Show throughput chart and protocol breakdown.
| "Traffic analysis shows live throughput with real-time charts, protocol breakdown with data volumes, packet rate, and anomaly scores."

1:02-1:10 | **Click "Devices" in sidebar.** Show the 15-device health grid.
| "The device grid shows health status of all 15 monitored devices across the railway network — green for healthy, amber for warning, red for critical."

1:10-1:18 | **Click "Reports" in sidebar.** Show the stats, ML model table, and export buttons. Click "Export as JSON".
| "Reports include ML model performance metrics — six models with accuracy and F1 scores. Export threat data as CSV, JSON, or PDF for compliance."

1:18-1:25 | **Click "Settings" in sidebar.** Show detection toggles, sensitivity slider, diode mode interfaces.
| "Settings let you configure detection sensitivity, alert cooldown, maximum alerts, and per-interface diode mode for high-security segments."

1:25-1:35 | **Back to Dashboard. Toggle Diode Mode** — show the degradation warning, watch the matrix bars change. Toggle it off.
| "Diode mode enforces one-way data flow for high-security segments like signaling networks. When enabled, encrypted traffic can't be inspected, so detection accuracy drops. The system flags this degradation explicitly."

1:35-1:42 | **Toggle ACK-Shadow mode.** Toggle theme to light mode. Quick scroll through the dashboard.
| "ACK-Shadow monitors acknowledgment traffic for exfiltration patterns. The interface supports both dark and light modes for any operational environment."

1:42-1:45 | **Fade out on dashboard.**
| "EKADHARA. See everything. Touch nothing."

---

## Key points to emphasize during demo:
- This is a **desktop application** — not a web app
- **On-premise only** — no cloud, no data leaving the network
- **Real-time** — everything updates live as packets arrive
- **ML-powered** — 6 models, 12,847 signature rules
- **Railway-specific** — monitors signaling, SCADA, PLC devices
