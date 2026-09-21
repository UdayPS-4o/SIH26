# EKADHARA Attack Traffic Generator

**[EKADHARA]** Attack Traffic Generation Scripts — PS-26145 | SIH 2026 Hackathon Prototype

Real network traffic generators for demonstrating the EKADHARA cyber threat detection system. Each script generates authentic attack patterns that the backend monitoring pipeline can detect and alert on.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Safety & Legal](#safety--legal)
5. [Quick Start](#quick-start)
6. [Attack Scripts](#attack-scripts)
   - [SYN Flood](#1-syn_floodpy--syn-flood)
   - [UDP Flood](#2-udp_floodpy--udp-flood--amplification)
   - [DNS Tunneling](#3-dns_tunnelpy--dns-tunneling-simulator)
   - [Port Scanner](#4-port_scanypy--port-scanner)
   - [C2 Beaconing](#5-beaconpy--c2-beaconing-simulator)
7. [Unified Launcher](#6-launcherpy--unified-launcher)
8. [Usage with EKADHARA Dashboard](#usage-with-ekadhara-dashboard)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The attack scripts generate **real network packets** to simulate various cyber threats:

| Script | Attack Type | Protocol | Detection Signature |
|--------|------------|----------|---------------------|
| `syn_flood.py` | TCP SYN Flood | TCP | Rate-based threshold, spoofed IPs |
| `udp_flood.py` | UDP Amplification | UDP | High-bandwidth, large payloads |
| `dns_tunnel.py` | DNS Tunneling | UDP/DNS | High-entropy subdomains, TXT/NULL queries |
| `port_scan.py` | Port Scanning | TCP | Sequential port probe pattern |
| `beacon.py` | C2 Beaconing | TCP | Periodic connection intervals with jitter |

---

## Prerequisites

- **Python 3.8 or later** (3.10+ recommended)
- **Windows** (designed for Windows Terminal, works on macOS/Linux)
- **Scapy** (optional, for enhanced packet crafting)
- **Administrator/Root privileges** (for raw socket operations)

### Python Version Check

```powershell
python --version
```

### Install Scapy (Optional)

```powershell
pip install scapy
```

Scapy is optional. All scripts fall back to standard library modules (`socket`, `struct`) when scapy is not available.

---

## Installation

1. Clone or navigate to the EKADHARA project:

```powershell
cd C:\Users\udayp\Documents\code\SIH26\26145
```

2. Ensure the attack scripts directory exists:

```powershell
cd scripts\attack
```

3. Verify all scripts are present:

```powershell
dir *.py
```

You should see: `syn_flood.py`, `udp_flood.py`, `dns_tunnel.py`, `port_scan.py`, `beacon.py`, `launcher.py`

---

## Safety & Legal

> **WARNING:** These scripts generate **real network packets**. They are designed for use against `localhost (127.0.0.1)` or private network IPs that you own.

### Permitted Use

- Testing the EKADHARA detection system on your own machine
- Demonstration in controlled lab environments
- Educational purposes with explicit permission

### Prohibited Use

- Targeting systems you do not own
- Network disruption or denial of service
- Any unauthorized network activity

Each script includes a **target safety check** that will warn you when targeting external IPs and require explicit confirmation.

---

## Quick Start

### Start the EKADHARA Backend

Before generating attacks, ensure the backend is running:

```powershell
# In a separate terminal
cd C:\Users\udayp\Documents\code\SIH26\26145
python -m backend.main  # or however your backend starts
```

### Generate Attack Traffic

```powershell
# SYN Flood against localhost
python syn_flood.py --target 127.0.0.1 --port 8080 --count 1000

# UDP Flood against localhost
python udp_flood.py --target 127.0.0.1 --port 53 --size 4096

# DNS Tunneling against localhost
python dns_tunnel.py --target 127.0.0.1 --domain example.com --count 500

# Port Scan against localhost
python port_scan.py --target 127.0.0.1 --ports 1-1024 --speed fast

# C2 Beaconing against localhost
python beacon.py --target 127.0.0.1 --port 8080 --interval 3 --jitter 20
```

### Monitor with the Dashboard

Open the EKADHARA dashboard in your browser to see detected threats in real-time.

---

## Attack Scripts

### 1. `syn_flood.py` — SYN Flood

Sends TCP SYN packets with random spoofed source IPs to overwhelm the target's connection table.

#### Usage

```powershell
python syn_flood.py --target <ip> --port <port> [--count <num>] [--rate <pps>] [--verbose]
```

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--target` | Yes | — | Target IP address |
| `--port` | Yes | — | Target port |
| `--count` | No | 0 (unlimited) | Number of packets to send |
| `--rate` | No | 0 (unlimited) | Packets per second |
| `--verbose` | No | False | Enable detailed output |

#### Examples

```powershell
# Basic SYN flood, unlimited packets
python syn_flood.py --target 127.0.0.1 --port 8080

# Limited to 5000 packets at 200 pps
python syn_flood.py --target 127.0.0.1 --port 8080 --count 5000 --rate 200

# Verbose mode to see each packet
python syn_flood.py --target 127.0.0.1 --port 8080 --count 100 --verbose
```

#### Detection Signatures

- High rate of incoming SYN packets from diverse source IPs
- Low completion rate (SYN without ACK)
- Spoofed source addresses

---

### 2. `udp_flood.py` — UDP Flood / Amplification

Sends UDP packets with large payloads, simulating DNS amplification attacks.

#### Usage

```powershell
python udp_flood.py --target <ip> [--port <port>] [--count <num>] [--size <bytes>] [--rate <pps>] [--verbose]
```

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--target` | Yes | — | Target IP address |
| `--port` | No | 53 | Target port |
| `--count` | No | 0 (unlimited) | Number of packets |
| `--size` | No | 512 | Payload size in bytes |
| `--rate` | No | 0 (unlimited) | Packets per second |
| `--verbose` | No | False | Enable detailed output |

#### Examples

```powershell
# DNS amplification simulation on port 53
python udp_flood.py --target 127.0.0.1 --port 53 --size 4096

# High-rate flood on HTTP port
python udp_flood.py --target 127.0.0.1 --port 8080 --rate 500

# Limited small-packet flood
python udp_flood.py --target 127.0.0.1 --port 53 --count 1000 --size 64
```

#### Detection Signatures

- High UDP traffic volume to single destination
- Large payload sizes (amplification factor)
- High bandwidth utilization

---

### 3. `dns_tunnel.py` — DNS Tunneling Simulator

Generates DNS queries with high-entropy random subdomains, simulating DGA-based DNS tunneling for data exfiltration.

#### Usage

```powershell
python dns_tunnel.py --target <dns_server> [--domain <domain>] [--count <num>] [--verbose]
```

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--target` | Yes | — | DNS server IP address |
| `--domain` | No | example.com | Domain for query construction |
| `--count` | No | 0 (unlimited) | Number of queries |
| `--verbose` | No | False | Enable detailed output |

#### Query Types Used

- **TXT** (35%) — Most common for DNS tunneling
- **NULL** (25%) — Highly suspicious, rarely used legitimately
- **ANY** (20%) — Used for reconnaissance
- **A** (15%) — Standard queries with tunneling subdomains
- **MX** (5%) — Mixed for variety

#### Examples

```powershell
# Basic DNS tunneling simulation
python dns_tunnel.py --target 127.0.0.1 --domain example.com

# Using a suspicious domain
python dns_tunnel.py --target 127.0.0.1 --domain c2.tk --count 1000

# Verbose to see individual queries
python dns_tunnel.py --target 127.0.0.1 --domain evil.bot --verbose
```

#### Detection Signatures

- High-entropy subdomain names (random character sequences)
- Unusual DNS query types (NULL, ANY)
- High frequency of unique subdomain queries
- TXT queries with encoded data

---

### 4. `port_scan.py` — Port Scanner

Scans target ports with TCP connect probes. Uses concurrent threading for speed.

#### Usage

```powershell
python port_scan.py --target <ip> [--ports <range>] [--speed <fast|normal|slow>] [--verbose]
```

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--target` | Yes | — | Target IP address |
| `--ports` | No | 1-1024 | Port range(s) to scan |
| `--speed` | No | normal | Scan speed: fast, normal, slow |
| `--verbose` | No | False | Enable detailed output |

#### Speed Settings

| Speed | Workers | Timeout | Approx. Time (1-1024) |
|-------|---------|---------|----------------------|
| fast | 100 | 0.5s | ~5s |
| normal | 20 | 1.0s | ~30s |
| slow | 5 | 2.0s | ~3min |

#### Port Range Formats

```powershell
# Single port
--ports 80

# Port range
--ports 1-1024

# Multiple ranges/ports (comma-separated)
--ports 80,443,8080,3389

# Combined
--ports 1-100,443,8000-8100
```

#### Examples

```powershell
# Scan well-known ports
python port_scan.py --target 127.0.0.1 --ports 1-1024

# Scan specific ports at fast speed
python port_scan.py --target 127.0.0.1 --ports 80,443,3389,5900 --speed fast

# Slow stealth scan
python port_scan.py --target 127.0.0.1 --ports 1-65535 --speed slow
```

#### Detection Signatures

- Sequential port probe pattern
- Many ports scanned in rapid succession from single source
- Connection attempts to closed ports

---

### 5. `beacon.py` — C2 Beaconing Simulator

Simulates Command & Control beaconing — periodic TCP connections with keep-alive payloads and configurable jitter.

#### Usage

```powershell
python beacon.py --target <ip> --port <port> [--interval <sec>] [--jitter <percent>] [--count <num>]
```

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--target` | Yes | — | Target IP address |
| `--port` | Yes | 8080 | Target port |
| `--interval` | No | 5.0 | Base interval between beacons (seconds) |
| `--jitter` | No | 20 | Jitter percentage (0-50) |
| `--count` | No | 0 (unlimited) | Max number of beacons |
| `--verbose` | No | False | Enable detailed output |

#### Beacon Payload Format

Each beacon sends simulated C2 traffic:
```
BEACON|<num>|<hostname>|<user>|<os>|<random_id>|<is_admin>|<0\n
```

#### Examples

```powershell
# Basic beacon every 5 seconds
python beacon.py --target 127.0.0.1 --port 8080

# Fast beaconing with high jitter
python beacon.py --target 127.0.0.1 --port 8080 --interval 2 --jitter 40

# Limited beacons for testing
python beacon.py --target 127.0.0.1 --port 8080 --interval 10 --count 10
```

#### Detection Signatures

- Periodic TCP connections at regular intervals
- Consistent connection timing pattern with small jitter
- Small payload sizes at regular intervals
- Long-lived connection patterns

---

## 6. `launcher.py` — Unified Launcher

The unified entry point for all attacks. Provides subcommands for launching, listing, and stopping attacks.

### List Available Attacks

```powershell
python launcher.py info
```

Output:
```
Available Attack Types:
  syn_flood    SYN Flood — TCP SYN flood with spoofed source IPs
  udp_flood    UDP Flood — UDP flood with DNS amplification payloads
  dns_tunnel   DNS Tunnel — DNS tunneling with DGA subdomains
  port_scan    Port Scanner — TCP port scanning with concurrent probes
  beacon       C2 Beacon — C2 beaconing with periodic TCP connections
```

### Launch an Attack

```powershell
python launcher.py <attack_type> --target <ip> [options]
```

Examples:

```powershell
# SYN Flood
python launcher.py syn_flood --target 127.0.0.1 --port 8080 --count 1000

# UDP Flood
python launcher.py udp_flood --target 127.0.0.1 --port 53 --size 4096

# DNS Tunnel
python launcher.py dns_tunnel --target 127.0.0.1 --domain example.com

# Port Scan
python launcher.py port_scan --target 127.0.0.1 --ports 1-1024 --speed fast

# C2 Beacon
python launcher.py beacon --target 127.0.0.1 --port 8080 --interval 3
```

### List Active Attacks

```powershell
python launcher.py list
```

Output:
```
======================================================================
  ACTIVE ATTACKS
======================================================================
  ID          Type            PID      Target               Duration
  ------------------------------------------------------------------
  atk_001     SYN Flood       12345    127.0.0.1            15s
  atk_002     C2 Beacon       12346    127.0.0.1:8080       8s
======================================================================
  Total active: 2
```

### Stop Attacks

```powershell
# Stop all attacks
python launcher.py stop

# Stop specific attack
python launcher.py stop atk_001
```

---

## Usage with EKADHARA Dashboard

### Recommended Workflow

1. **Start the EKADHARA backend** (if not already running):
   ```powershell
   # Backend on port 8000
   python -m backend.main
   ```

2. **Start the frontend dashboard**:
   ```powershell
   # In another terminal
   npm run dev  # or equivalent
   ```

3. **Open multiple Windows Terminal tabs** for different attacks:

   ```powershell
   # Tab 1: SYN Flood
   python syn_flood.py --target 127.0.0.1 --port 8080 --count 5000 --rate 200

   # Tab 2: Port Scanner
   python port_scan.py --target 127.0.0.1 --ports 1-1024 --speed fast

   # Tab 3: C2 Beacon
   python beacon.py --target 127.0.0.1 --port 8080 --interval 3
   ```

4. **Observe the dashboard** for detected threats and alerts.

5. **Stop attacks** when done:
   ```powershell
   # Use Ctrl+C in each terminal, or:
   python launcher.py stop
   ```

### Windows Terminal Tips

- **Split panes**: `Alt+Shift+-` (horizontal) or `Alt+Shift+|` (vertical)
- **New tab**: `Ctrl+Shift+T`
- **Switch tabs**: `Ctrl+Tab`

---

## Troubleshooting

### "Raw sockets require Administrator privileges"

On Windows, raw socket operations need elevated privileges. Run PowerShell as Administrator:

```powershell
# Right-click PowerShell -> "Run as Administrator"
python syn_flood.py --target 127.0.0.1 --port 8080
```

### "Scapy not found"

Scapy is optional. Scripts will fall back to raw sockets. To install scapy:

```powershell
pip install scapy
```

### "Permission denied" on port binding

Some ports (< 1024) require elevated privileges. Use ports above 1024 for testing:

```powershell
# Instead of port 80, use 8080
python syn_flood.py --target 127.0.0.1 --port 8080
```

### Scripts not generating visible traffic

Ensure the EKADHARA backend is running and listening on port 8000:

```powershell
# Check if backend is running
Test-NetConnection -ComputerName localhost -Port 8000
```

### Colors not showing

Ensure you're running in Windows Terminal (not Command Prompt). Windows Terminal fully supports ANSI escape codes.

---

## Architecture Notes

```
scripts/attack/
├── syn_flood.py      # TCP SYN flood with IP spoofing
├── udp_flood.py      # UDP flood with DNS payloads
├── dns_tunnel.py     # DNS tunneling via DGA subdomains
├── port_scan.py      # Concurrent TCP port scanning
├── beacon.py         # C2 beaconing simulator
├── launcher.py       # Unified launcher with process management
└── README.md         # This file
```

### Design Principles

- **Standalone**: Each script runs independently
- **Fallback**: Scapy used when available, raw sockets as fallback
- **Thread-safe**: Daemon threads for background attacks
- **Import-safe**: Scapy imports wrapped in try/except
- **Safety-first**: Target validation with explicit warnings
- **Consistent interface**: Each script has `run_attack(**kwargs)` function

---

## EKADHARA System Integration

The attack scripts are designed to work with the EKADHARA detection pipeline:

| Attack | Detection Mechanism |
|--------|-------------------|
| SYN Flood | Rate-based SYN packet monitoring |
| UDP Flood | Bandwidth + packet rate thresholds |
| DNS Tunnel | Entropy analysis on DNS queries |
| Port Scan | Sequential port probe detection |
| C2 Beacon | Periodic connection pattern analysis |

The backend at `http://localhost:8000` receives and processes network events, applies detection rules, and pushes alerts to the dashboard.

---

*EKADHARA — Cyber Threat Detection System | PS-26145 | SIH 2026*
