# Domain Brief — What NTRO Actually Wants

> Written for someone new to cybersecurity. Read this first. Everything else in `docs/` assumes you understand this page.

---

## 1. The physical setup

Picture a highway carrying all the traffic in and out of a power-grid control network. Beside it, in a sealed soundproof glass booth, sits a security guard.

The guard **can see every vehicle** that goes past. The guard **cannot** stop a car, radio a driver, chase anyone, or step onto the road. There is no door.

That booth is the **monitoring enclave**. It has no door on purpose: if an attacker ever compromises the guard's booth, they still cannot get onto the highway. The booth is a dead end.

```
     PRODUCTION NETWORK  ══════════════════════════════════════
     (power grid / telecom core / defence network)
                              ║
                              ║  copy of traffic
                              ▼  ── ONE WAY ONLY, no return path ──
                    ┌──────────────────────┐
                    │   MONITORING ENCLAVE │   ← our software lives here
                    │   "the glass booth"  │
                    └──────────────────────┘
```

Two ways operators build this:

| Mechanism | What it is |
|---|---|
| **Network TAP / SPAN port** | A switch port that photocopies traffic to a monitoring port. Cheap, software-configurable. |
| **Hardware data diode** | A fibre link with a transmitter on one end and a receiver on the other, and **no return fibre**. One-way-ness is a law of physics, not a config setting. |

NTRO uses these on gateway and peering links — the points where a protected network touches the outside world.

## 2. Why this breaks every product they could buy

Every commercial network-detection product (Darktrace, ExtraHop, Vectra, Corelight...) enriches its detections by *reaching out*: reverse-DNS lookups, threat-intel API calls, active scans, cloud API queries, endpoint-agent telemetry.

In this enclave **none of those resolve**. There is no internet, no route to the production network, no agents.

So NTRO needs an intelligence layer whose *entire* feature set is derivable from passive observation, with **zero outbound network calls of any kind**. That is the real ask hiding behind the PS text.

## 3. What "everything you can see" actually gets you

**Packets** — individual envelopes of data. Source address, destination address, ports, size, timestamp, contents.

**Flows** — the receipt of an entire conversation. *"Machine A talked to Machine B on port 443 from 10:02:11 to 10:02:19, 412 packets, 380 KB."* No contents, just who/when/how much. Exported in standard formats called **NetFlow**, **IPFIX**, and **sFlow**.

**The catch:** roughly 90% of traffic today is encrypted with **TLS** (the "S" in HTTPS). Even with full packets, the contents are sealed. And the PS explicitly forbids decrypting them anyway.

So we work with **metadata only**: sizes, timings, directions, addresses, frequencies, rhythms. Like a postal inspector who can weigh envelopes and note who sends what to whom and when, but may never open one.

That turns out to be plenty. **Behaviour leaks through metadata.**

## 4. The six threats, in plain language

### (a) Volumetric / protocol DDoS
Ten thousand people call your shop at once so real customers can't get through.

- **SYN flood** — Every TCP connection starts with a three-step handshake: `SYN` → `SYN-ACK` → `ACK`. The attacker sends millions of `SYN`s and never sends step 3, leaving the server holding half-open connections until it collapses.
- **UDP reflection / amplification** — The attacker sends a small request to a public server (DNS, NTP, memcached) but **forges the return address** to be the victim's. The server sends a much larger reply to the victim. Small push, huge shove.
- **Spoofed-source flood** — Fake sender addresses so the flood can't be filtered by source.

**How you spot it:** a sudden rate spike *plus* source addresses that look **random**. "Entropy" is just a number that measures randomness — real traffic comes from a fairly stable set of addresses; a spoofed flood's addresses look like a random number generator.

### (b) Botnet C2 beaconing
A machine got infected. Every so often it "phones home" to the attacker's server to ask for orders. Like an employee who steps outside to check their phone **every 60 seconds, exactly**.

- **C2** = command-and-control, the attacker's server.
- The tell is **regularity**. Humans and normal apps are irregular. Malware is metronomic.
- Competent malware adds **jitter** (random ±20% wobble) specifically to hide this, which is why naive detectors miss it.

### (c) DGA domains and DNS tunnelling
**DNS** is the internet's phone book — it turns `google.com` into an IP address.

- **DGA (Domain Generation Algorithm)** — Instead of hardcoding one C2 server name that defenders could block, malware *algorithmically generates* thousands of throwaway names — `xkfjqwmz.com`, `qpvbnzrt.net` — and tries them until one resolves. **Tell:** the names look like keyboard mashing. Real domains have pronounceable letter patterns; generated ones don't. That is what "entropy / n-gram analysis" measures.
- **DNS tunnelling** — Firewalls almost always allow DNS out. So attackers smuggle stolen data *inside* DNS queries, encoded into the domain name itself. **Tell:** abnormally long query names, unusual record types (`TXT`, `NULL`), and enormous query volume to a single domain.

### (d) Malware inside encrypted sessions
We cannot read contents. So we fingerprint **how the conversation begins**.

When any program opens a TLS connection it sends a `ClientHello` listing which ciphers it supports, in a particular order, with particular extensions. Chrome's hello differs from Firefox's, which differs from a Python script's, which differs from a specific malware family's. Hash that hello and you get a fingerprint — that is what **JA3** and **JA4** are.

So we can often say *"that is not a browser, that is a Go binary"* without decrypting a single byte. Combine with the **rhythm** — the sequence of packet sizes and inter-arrival times in the first ~20 packets — and you get surprisingly far.

**QUIC** is the newer UDP-based transport under HTTP/3; same idea, different framing.

### (e) Reconnaissance and port scanning
An attacker walks down a corridor rattling every doorknob to find one unlocked. One source address touching many destination hosts, or many ports on one host. This is called **fan-out** and it is the easiest class to detect.

### (f) Data exfiltration
Stealing data *out*. Normally a workstation downloads far more than it uploads — you consume web pages, you don't publish them. If a machine suddenly starts uploading gigabytes, that's the tell: an abnormal **upload-to-download ratio**.

## 5. The twist that decides who wins this PS

**"Unidirectional" is ambiguous, and NTRO did not notice.**

| Reading | Meaning | Difficulty |
|---|---|---|
| **Reading 1** | We see *both* sides of every conversation; we just can't transmit anything back. Guard sees both lanes, can't step out. | Moderate |
| **Reading 2** | We literally only see traffic flowing *one way*. We see the client's packets but never the server's replies. | Brutal |

Under **Reading 2**, huge amounts of data vanish:

- We see `SYN`s but never `SYN-ACK`s → cannot tell if a connection succeeded or was refused.
- Cannot measure round-trip time.
- Cannot fingerprint the server hello (`JA4S`) — only the client hello.
- **Threat (f) — the upload/download ratio — needs both directions and we only have one.**

Now look at the PS again. It demands "outbound-to-inbound byte ratios" (f) and "JA3/JA3S" fingerprints (d). **Both require the reverse direction. The problem statement contradicts its own constraint.**

Nobody in a room of 200 teams will point this out. We will — and we will solve both readings. See [`innovations.md`](innovations.md).

### Why this destroys the standard approach

Nearly every team will use a tool called **CICFlowMeter** to convert packet captures into ~80 numeric features, then train a model on the public **CIC-IDS2017** dataset.

But a large fraction of those 80 features are **bidirectional**: `bwd_packet_count`, `bwd_byte_rate`, `down_up_ratio`, `flow_iat_std` computed across both directions...

Train on bidirectional data, deploy on one-way capture, and those features silently become zeros. The model still emits confident-looking scores. It is simply **wrong, and nobody checks**.

## 6. Two ideas beginners usually get wrong

### "99% accuracy" is meaningless here
Process 100,000 flows/second where 99.9% are benign. A detector wrong 0.1% of the time produces **100 false alarms every second**. An analyst drowns in minutes.

The right question: *"of the 50 alerts I show a human per hour, how many are real?"* That is **precision at a fixed alert budget** (`P@k`). Reporting it instead of accuracy is genuinely more correct — and in a room where everyone says "99.7% accuracy," it is a differentiator.

### The alert must explain itself
In a normal SOC, an analyst who receives an alert can go investigate — check the endpoint, query threat intel, run a scan. **In this enclave they can do none of that.** The alert is all they get.

So every alert must carry its own proof: *"flagged because inter-arrival intervals were 60 s ± 2 s across 340 connections to a single destination, and the client JA4 fingerprint matches no known browser."*

That is what the PS means by "supporting evidence feature." It is an explainability requirement in disguise.

## 7. Vocabulary cheat sheet

| Term | Meaning |
|---|---|
| **Packet** | One envelope of data on the wire |
| **Flow** | One conversation, summarised (5-tuple + counters + timings) |
| **5-tuple** | src IP, dst IP, src port, dst port, protocol — the identity of a flow |
| **NetFlow / IPFIX / sFlow** | Standard export formats for flow summaries |
| **PCAP** | A saved file of raw captured packets |
| **Data diode** | Hardware that physically permits data one way only |
| **TAP / SPAN** | A port that photocopies network traffic for monitoring |
| **Enclave** | The isolated monitoring network |
| **Metadata** | Facts *about* traffic (size, timing, addresses), not contents |
| **Entropy** | A number measuring randomness/unpredictability |
| **TLS / QUIC** | The encryption behind HTTPS / HTTP-3 |
| **JA3 / JA4** | A fingerprint of *how* a program opens an encrypted connection |
| **C2** | Command-and-control — the attacker's server |
| **Beaconing** | Infected machine checking in with C2 on a schedule |
| **Jitter** | Deliberate random wobble added to beacon timing to evade detection |
| **DGA** | Malware algorithmically generating throwaway domain names |
| **NXDOMAIN** | A DNS reply meaning "that name does not exist" |
| **Exfiltration** | Stealing data out of a network |
| **Fan-out** | One source touching many destinations/ports (scanning) |
| **False positive** | An alert that turned out to be nothing |
| **Streaming** | Deciding as data arrives, not after collecting it all |
| **OCSF** | Open Cybersecurity Schema Framework — an open standard alert format |
| **SOC** | Security Operations Centre — the humans watching the alerts |

---

**Next:** [`../plan.md`](../plan.md) for what we are building, then [`innovations.md`](innovations.md) for why we win.
