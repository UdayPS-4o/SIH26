# EKADHARA Attack Traffic Generation Scripts

Standalone attack traffic generators for the EKADHARA cyber threat detection system (PS-26145, SIH 2026).

## Prerequisites

- Python 3.8+
- scapy (optional, provides better packet crafting) — `pip install scapy`
- Windows Terminal (for colored output)

## Safety

**These scripts generate REAL network traffic.** Only use against:
- `127.0.0.1` (localhost)
- Private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- Systems you own or have explicit written permission to test

All scripts include safety checks that warn before targeting non-local/non-private IPs.

---

## Scripts

### 1. SYN Flood — `syn_flood.py`

Sends spoofed TCP SYN packets with random source IPs. Triggers IDS SYN flood detection rules.

```bash
python syn_flood.py --target 127.0.0.1 --port 80 --count 5000 --rate 500
python syn_flood.py --target 192.168.1.100 --port 443 --count 10000
```

| Argument   | Default | Description                        |
|------------|---------|------------------------------------|
| `--target` | (req)   | Target IP or hostname              |
| `--port`   | 80      | Target port                        |
| `--count`  | 0       | Packet count (0 = unlimited)       |
| `--rate`   | 100     | Packets per second (0 = max speed) |

### 2. UDP Flood — `udp_flood.py`

Sends UDP packets with large payloads. Simulates DNS amplification and UDP flood attacks.

```bash
python udp_flood.py --target 127.0.0.1 --port 53 --size 4096 --rate 200
python udp_flood.py --target 192.168.1.100 --port 53 --count 5000 --mode dns_amp
```

| Argument   | Default | Description                              |
|------------|---------|------------------------------------------|
| `--target` | (req)   | Target IP or hostname                    |
| `--port`   | 53      | Target UDP port                          |
| `--count`  | 0       | Packet count (0 = unlimited)             |
| `--size`   | 1024    | Payload size in bytes                    |
| `--rate`   | 100     | Packets per second                       |
| `--mode`   | random  | Payload mode: random, repeated, zero, dns_amp |

### 3. DNS Tunneling — `dns_tunnel.py`

Sends high-entropy DNS queries simulating DGA (Domain Generation Algorithm) domains and DNS tunneling exfiltration.

```bash
python dns_tunnel.py --target 127.0.0.1 --count 500
python dns_tunnel.py --target 8.8.8.8 --count 200
```

| Argument | Default | Description                         |
|----------|---------|-------------------------------------|
| `--target` | (req) | DNS server IP or hostname           |
| `--count`  | 100   | Number of unique queries to cycle   |

### 4. Port Scanner — `port_scan.py`

Scans target ports using TCP connect (or SYN if run as Administrator).

```bash
python port_scan.py --target 127.0.0.1 --ports common
python port_scan.py --target 192.168.1.1 --ports 1-1000 --speed fast
python port_scan.py --target 10.0.0.1 --ports 22,80,443,8080 --speed slow
```

| Argument   | Default | Description                                  |
|------------|---------|----------------------------------------------|
| `--target` | (req)   | Target IP or hostname                        |
| `--ports`  | common  | Port spec: `common`, `80`, `1-1000`, `22,80` |
| `--speed`  | normal  | Scan speed: slow, normal, fast               |
| `--method` | connect | Scan method: connect, syn                    |
| `--timeout`| 2.0     | Per-port timeout in seconds                  |

### 5. C2 Beacon — `beacon.py`

Simulates periodic C2 beaconing with configurable jitter to mimic malware callbacks.

```bash
python beacon.py --target 127.0.0.1 --port 8080 --interval 10 --jitter 0.3
python beacon.py --target 10.0.0.50 --port 443 --interval 30 --jitter 0.5 --count 100
```

| Argument  | Default | Description                                    |
|-----------|---------|------------------------------------------------|
| `--target` | (req)  | Target C2 IP or hostname                       |
| `--port`   | 8080   | Target port                                    |
| `--interval` | 10.0 | Beacon interval in seconds                     |
| `--jitter` | 0.3    | Jitter percentage (0.0-1.0, default 30%)       |
| `--count`  | 0      | Number of beacons (0 = unlimited)              |
| `--timeout`| 5.0    | Connection timeout in seconds                  |

### 6. Launcher — `launcher.py`

Unified interface to run any attack from one command.

```bash
# Show usage
python launcher.py

# Launch attacks
python launcher.py syn_flood --target 127.0.0.1 --port 80
python launcher.py udp_flood --target 127.0.0.1 --port 53 --rate 500
python launcher.py dns_tunnel --target 127.0.0.1
python launcher.py port_scan --target 127.0.0.1 --ports 1-100
python launcher.py beacon --target 127.0.0.1 --port 8080 --interval 5

# Manage running attacks
python launcher.py list
python launcher.py stop              # stop all
python launcher.py stop syn_flood_1  # stop specific
```

---

## Architecture

Each attack script exposes a `run_attack(**kwargs)` function that:
1. Validates target safety
2. Starts a `threading.Thread(daemon=True)` background thread
3. Returns `(thread, stats_dict)` tuple

The stats dict includes live counters (`sent`, `rate`, `duration`, etc.) that update in real time.

## Scapy vs Raw Socket

All scripts attempt to import scapy first. If unavailable, they fall back to raw sockets (or standard socket operations for UDP). Raw socket modes may require Administrator/Root privileges.

## Stopping Attacks

Press **Ctrl+C** in the terminal running the attack. For launcher-managed attacks, use `python launcher.py stop <id>`.
