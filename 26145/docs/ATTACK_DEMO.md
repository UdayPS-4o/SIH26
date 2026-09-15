# EKADHARA — Two-Laptop Attack Demo Setup

## Overview

This guide covers running the **real attack demo** with two laptops on the same WiFi network.

**Laptop A** runs the dashboard (backend + frontend). **Laptop B** opens the dashboard in a browser and launches attacks at Laptop A's IP.

---

## Step 1: Get Laptop A's IP Address

On Laptop A, run:

```bash
ipconfig | findstr "IPv4"
```

Example output:
```
IPv4 Address. . . . . . . . . . . : 192.168.29.168
```

Write this down — **Laptop A IP** = `192.168.29.168` (or whatever yours is).

---

## Step 2: Start the Backend (Laptop A)

Open **PowerShell** on Laptop A and run:

```powershell
cd C:\Users\udayp\Documents\code\SIH26\26145\backend
venv\Scripts\python.exe demo_server.py --host 0.0.0.0
```

You should see:

```
+============================================================+
|  EKADHARA v2.1.0 -- Real-time Threat Detection             |
|  Mode: REAL CAPTURE                                        |
|  WebSocket: ws://0.0.0.0:8000/ws/dashboard                 |
|  API docs:  http://0.0.0.0:8000/docs                       |
+============================================================+
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Important:** `--host 0.0.0.0` makes the server accessible from other devices on the WiFi.

---

## Step 3: Start the Frontend (Laptop A)

Open **another PowerShell** on Laptop A and run:

```powershell
cd C:\Users\udayp\Documents\code\SIH26\26145\frontend
npm run dev -- --host
```

You should see:
```
VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5178/
  ➜  Network: http://192.168.29.168:5178/
```

The **Network** URL is what Laptop B will use.

---

## Step 4: Open Dashboard on Laptop B

On Laptop B, open any browser and go to:

```
http://192.168.29.168:5178/attack
```

(Replace `192.168.29.168` with Laptop A's actual IP from Step 1.)

You should see the EKADHARA dashboard with the Attack Panel page.

---

## Step 5: Set Target IP

In the Attack Panel on Laptop B:

1. Find the **Target IP** input field at the top
2. Enter **Laptop A's IP**: `192.168.29.168` (or whatever you got in Step 1)
3. Press Enter or click away to confirm

---

## Step 6: Launch Attacks

Click any attack button on Laptop B:

| Button | Attack Type | What Happens |
|--------|------------|-------------|
| 🌊 **SYN Flood** | DDoS | Sends 500+ TCP SYN packets to Laptop A in 8 seconds |
| 🔍 **Port Scan** | Port Scan | Scans 10 ports on Laptop A sequentially |
| 📡 **C2 Beaconing** | Beaconing | Connects to Laptop A every 2 seconds for 15 seconds |
| 🔗 **DNS Flood** | DNS Tunneling | Sends 50+ DNS queries with long/suspicious domains |
| 🔥 **HTTP Flood** | HTTP Flood | Rapid HTTP GET requests to Laptop A |

### What Laptop A Sees (switch to Live Threats page)

On Laptop A, navigate to **Live Threats** (`/live-threats`). As attacks are launched:

1. **Packet count** rises in real-time
2. **Alerts appear** in the alert feed with severity (CRITICAL / HIGH / MEDIUM)
3. Each alert shows: source IP, destination IP, port, protocol, confidence score
4. **Threat type** matches the attack you launched (e.g., "Port Scan" when you click Port Scan)

---

## Step 7: For the Hackathon Demo

### The 30-second demo sequence:

1. **Show Laptop A's dashboard** — Live Threats page, clean, no alerts yet
2. **"Now I'll launch a real attack"** — switch to Attack Panel
3. **Click Port Scan** — watch it scan 10 ports on Laptop A
4. **Click SYN Flood** — watch DDoS alert appear on Live Threats page
5. **Expand the alert** — show the evidence (SYN count, packet count, detection method)
6. **"And all of this is running in real-time"** — point to packet counter climbing

### For the video:

Record both laptop screens side-by-side:

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  LAPTOP A: Live Threats      │  │  LAPTOP B: Attack Panel      │
│  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │
│  │ THREAT DETECTED        │  │  │  │ ⚡ Attack Simulator    │  │
│  │ Port Scan              │  │  │  │                        │  │
│  │ 192.168.29.45 → 22    │  │  │  │  [🌊 SYN] [🔍 Port]   │  │
│  │ Confidence: 0.87       │  │  │  │  [📡 C2] [🔗 DNS]     │  │
│  │ Evidence: 10 ports     │  │  │  │  [🔥 HTTP]            │  │
│  └────────────────────────┘  │  │  └────────────────────────┘  │
│                              │  │                              │
│  CRITICAL  192.168.29.45→22  │  │  Target: 192.168.29.168     │
│  HIGH      192.168.29.45→80  │  │  Active: Port Scan (running) │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Laptop B can't reach Laptop A's IP | Make sure backend was started with `--host 0.0.0.0` (not default `localhost`) |
| Port Scan not detected | Need 8+ unique ports — the default scans exactly 10, should work |
| SYN Flood not detected | Need 20+ SYN packets — 8 second duration sends ~500 SYN packets |
| No alerts appear | Check Laptop A's firewall allows incoming TCP on port 8000 |
| "Connection refused" on Laptop B | Verify Laptop A's IP is correct in Target IP field |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Same WiFi (192.168.29.x)                  │
│                                                             │
│  Laptop A (192.168.29.168)         Laptop B (192.168.29.45)│
│  ┌──────────────────────────┐      ┌──────────────────────┐ │
│  │ demo_server.py :8000     │◄─────│ AttackPanel.tsx      │ │
│  │  - FastAPI backend       │ WS   │  - WebSocket client  │ │
│  │  - attack_gen.py         │      │  - Attack buttons    │ │
│  │  - real_capture.py       │      │  - Target IP input   │ │
│  │  - Mock backend          │      └──────────────────────┘ │
│  │  - Alert detection       │                              │
│  └──────────────────────────┘                              │
│         ▲                                                    │
│         │ Real packets captured (scapy)                      │
│         │ or generated by attack_gen.py                      │
│         │                                                    │
│  ┌──────────────────────────┐                               │
│  │ Vite dev :5178           │                               │
│  │  - Dashboard pages       │                               │
│  │  - AttackPanel            │                               │
│  │  - Live Threats           │                               │
│  │  - Network Map            │                               │
│  └──────────────────────────┘                               │
│                                                             │
│  Firewall: Allow inbound TCP 8000, 5178                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow for a Port Scan Attack

1. Laptop B user clicks **Port Scan** button
2. AttackPanel sends `{ action: "launch", type: "port_scan", target: "192.168.29.168", duration: 10 }` via WebSocket to Laptop A:8000
3. `demo_server.py` receives it, calls `attack_controller.launch("port_scan", target, duration)`
4. `attack_gen.py` opens TCP connections to ports 22, 80, 443, 3306, 5432, 8080, 8443, 3000, 5000, 8000 on Laptop A
5. Each connection is a **real TCP SYN packet** on the network
6. Laptop A's `real_capture.py` (scapy sniffer) sees these SYN packets
7. FlowTable counts unique destination ports from source IP
8. When ≥8 unique ports detected → emits `Port Scan` alert
9. Alert is pushed to all WebSocket `/ws/alerts` clients
10. Dashboard's Live Threats page receives and displays the alert

### Detection Methods

| Attack | Detection Method | Threshold |
|--------|-----------------|-----------|
| SYN Flood | SYN packet count per flow | ≥20 SYN packets |
| Port Scan | Unique destination ports from source | ≥8 unique ports |
| C2 Beaconing | Coefficient of variation of inter-arrival times | CV < 0.3, interval 0.5-10s |
| DNS Tunneling | Average DNS query name length | >30 chars average |
| HTTP Flood | Packet rate + HTTP method analysis | High rate, non-GET methods |
