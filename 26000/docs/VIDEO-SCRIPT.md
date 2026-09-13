# Demo Video — 2:00, shot by shot

**Hard limit: 120 seconds.** NTRO's sibling problem statements specify "Demo Video (Max 2 Minutes)." Assume it is enforced and that a judge watches it **once, possibly muted, possibly at 1.5×**.

Everything below is designed for that.

---

## Production rules

| Rule | Why |
|---|---|
| **Screen recording only. No talking head. No webcam.** | Every second of face is a second not showing the product. |
| **Burn in captions for every spoken line.** | Judges watch muted, in a queue, on a laptop. A muted video with no captions communicates nothing. |
| **1080p minimum, 60 fps, no zoom-blur.** | Terminal text must be legible when YouTube re-encodes it. |
| **No music, or one quiet bed at −25 dB.** | Music over a technical demo reads as a marketing video and lowers trust. |
| **Real screen, real timestamps, no mockups.** | If a frame is fake, say so on screen. One caught fake kills the whole submission. |
| **No intro animation. No logo splash. No "Team X presents".** | You have 120 seconds; the first 8 decide whether they keep watching. |
| **Terminal font ≥ 18 pt, dashboard zoomed to 125%.** | Assume a small window on a shared screen. |
| **One cut every 8–15 s.** | Static screens for 30 s lose attention even when the content is good. |
| **Cursor highlight on.** | The judge must see what you're clicking without narration. |

---

## The shot list

### 0:00 – 0:08 · COLD OPEN — the kill shot, no preamble

**On screen:** black card, white text, held 3 s, then the bar chart animates in.

```
        The standard approach to this problem
        scores 0.9 on full-duplex traffic.

        On the data diode NTRO actually described,
        it scores 0.4 — and never reports a problem.
```

Then: the two-group bar chart from Slide 1 fills the frame. Red bar drops.

**VO:** *"The standard approach to this problem loses more than half its detection capability on a real data diode — and never tells you."*

> **Why open here:** most demo videos open with "Hello, we are team X, our problem statement is…" and lose the judge in 10 seconds. We open with the single most interesting fact in the entire submission. Everything after is watched more carefully.

---

### 0:08 – 0:20 · THE SETUP — what a diode is, in one visual

**On screen:** FIG-1 animates — production network → diode → enclave, then the red dashed "no return path" arrow appears and a ✗ stamps over it.

**Caption + VO:** *"NTRO monitors critical infrastructure through hardware data diodes. Traffic is copied one way. There is no path back — so no lookups, no probes, no decryption. Ever."*

---

### 0:20 – 0:32 · PROOF OF CONSTRAINT — the kernel kills us

**On screen:** terminal, full frame.

```bash
$ docker run --rm --network none --cap-add NET_RAW ekadhara:demo \
      --self-test-egress
```

Output scrolls:
```
[egress-test] attempting outbound connection to 8.8.8.8:53 ...
[seccomp]     SIGSYS — syscall 'connect' denied by policy
[audit]       egress attempt logged · pid 1 · terminated
[result]      READ-ONLY ENFORCED ✔
```

**VO:** *"Every team will claim read-only. We let the kernel enforce it. That process just tried to phone home — and was killed."*

> Record this for real. It takes ten minutes to set up a seccomp profile and it is the most credible 12 seconds in the video.

---

### 0:32 – 0:50 · LIVE DETECTION + EVIDENCE

**On screen:** dashboard. Replay running. HUD visible top-right: `47,200 flows/s · drop 0.00% · p99 84 ms`.

Alerts scroll in. Click a beaconing alert → evidence panel opens.

Show, with the cursor moving deliberately:
- inter-arrival histogram — visibly regular
- `60 s interval · 30% jitter`
- top-3 SHAP features
- `evidence SHA-256: 9f2c…`
- **the validity chips: `MEASURED` / `ESTIMATED` / `MISSING`** ← linger here 2 s

**VO:** *"Live replay, forty-seven thousand flows a second, zero drops. Every alert carries its own evidence — because in an air gap the analyst cannot verify anything independently. Including whether each number was measured or estimated."*

---

### 0:50 – 1:35 · ★ THE PAYLOAD — the diode toggle ★

**This is 45 seconds of the 120. Everything else exists to set it up.**

**0:50 — VO:** *"Everything so far assumed we can see both directions of every conversation. NTRO described a diode. So let's make the diode real."*

**0:54 — the click.** Cursor moves to a physical-looking toggle labelled `DIODE MODE`. Click. **Slow-motion for 1 second on the click** — this is the moment of the video.

**0:56 – 1:08 —** the degradation panel populates live, row by row, with a subtle counting animation:

```
   Recon / port scan        0.94 → 0.94     ✔ unaffected
   Volumetric DDoS          0.93 → 0.92     ✔ unaffected
   C2 beaconing             0.91 → 0.87     ✔ minor
   DGA / DNS tunnel         0.88 → 0.84     ✔ minor
   Encrypted malware        0.86 → 0.55     ⚠ JA4S lost — no fix exists
   Data exfiltration        0.89 → ...
```

**VO:** *"Scanning: unaffected. DDoS: unaffected. Encrypted malware degrades — we lose the server-side TLS fingerprint, and there's no trick that gets it back. We show that rather than hide it."*

**1:08 —** cursor moves to a second toggle: `ACK-SHADOW`. It is currently **ON**. Click it **OFF**.

The exfiltration row completes: `0.89 → 0.00`. The exfiltration alert stream **stops**. Screen goes quiet.

**Hold the silence for 2 full seconds.** No VO. Let the empty alert feed sit there.

**1:12 — VO, slower:** *"That is what every other solution looks like on a real diode. It doesn't error. It doesn't warn. It just quietly stops finding anything — while reporting high confidence on everything else."*

**1:20 —** click `ACK-SHADOW` back **ON**. Exfiltration alerts resume. The row fills to `0.83`. An alert appears reading `~4.1 GB egress · 10.2.4.9 → 203.0.113.9`.

**1:24 — VO:** *"TCP is a delivery-confirmation protocol. Every packet the client sends carries a receipt — 'I've received everything up to byte N.' Those receipts travel in the direction we can see."*

**1:28 —** split-screen overlay, the ACK-Shadow diagram animating alongside the live dashboard:

```
   VISIBLE                              INVISIBLE
   ack = 1,461         ◄──────────────  1,460 bytes
   ack = 5,001,000     ◄──────────────  ~5 MB
                    Δack = what we cannot see
```

**1:32 — VO:** *"We never see the server's packets. But we watch that number climb — and the climb tells us exactly how much came back. Four point one gigabytes, reconstructed from a channel we cannot observe."*

---

### 1:35 – 1:50 · THE MEMORY CHART

**On screen:** burst view. Offered load ramps 1× → 10×. Two lines draw simultaneously:
- red, climbing steeply, ending in `OOM ✗`
- blue, dead flat

**VO:** *"One more. Most detectors key a hash map on source IP — so a spoofed-source flood exhausts memory and the DDoS attack kills the DDoS detector. That red line is a naive implementation we built to show you. The flat line is ours."*

---

### 1:50 – 2:00 · CLOSE CARD

**On screen:** static card, held 10 s. No animation.

```
                      E K A D H A R A
                 See everything. Touch nothing.

     ✔  Runs with --network none.  No internet. Ever.
     ✔  Alerts emit as OCSF — plugs into any SIEM.
     ✔  Merkle-sealed ledger — no alert can be altered after the fact.
     ✔  Replay is deterministic — re-run our harness, get our numbers.

         SIH26145 · NTRO            github.com/<repo>
```

**VO:** *"Everything you saw ran with no network, from a container you could carry into a facility on a USB stick."*

---

## Timing table

| Segment | Start | Dur | Purpose |
|---|---|---|---|
| Cold open — kill shot | 0:00 | 0:08 | Hook. Best fact first. |
| Diode setup | 0:08 | 0:12 | Context |
| Egress lockdown proof | 0:20 | 0:12 | Credibility |
| Live detection + evidence | 0:32 | 0:18 | It works |
| **Diode toggle + ACK-Shadow** | **0:50** | **0:45** | **The whole submission** |
| Memory chart | 1:35 | 0:15 | Engineering depth |
| Close card | 1:50 | 0:10 | Deployability |

**If forced to 60 seconds:** cold open (8 s) + toggle sequence (45 s) + close card (7 s). Nothing else.

---

## Recording checklist

**Before:**
- [ ] Rehearse the full click path 5×. Every cursor movement deliberate, no hunting.
- [ ] Disable notifications, Slack, email, OS update banners
- [ ] Clean desktop, neutral wallpaper, no personal files visible in any path
- [ ] Terminal font ≥ 18 pt, high-contrast theme
- [ ] Dashboard at 125% zoom, browser chrome hidden (F11)
- [ ] Pre-load both PCAP twins so no loading spinner appears on camera
- [ ] Confirm the HUD numbers are real — never mock a metric

**During:**
- [ ] Record at 1080p60, one continuous take per segment
- [ ] Record VO separately in a quiet room; do not narrate live over typing
- [ ] Capture 3 takes of the toggle sequence, pick the cleanest

**After:**
- [ ] Burn in captions — every spoken line, high contrast, bottom third
- [ ] Colour-grade for projector: raise contrast, avoid pure-black backgrounds
- [ ] Export ≤ 100 MB where possible; upload unlisted to YouTube **and** keep an MP4 on a USB stick
- [ ] **Watch it once muted at 1.5× speed.** If the story still lands, ship it. If not, re-cut.
- [ ] Verify the link works from a phone on mobile data before submitting

---

## Rules

1. **Never fake a frame.** If something isn't built yet, don't show it. A mock caught in Q&A destroys the entire submission's credibility, including the parts that were real.
2. **If a number on screen disagrees with the deck, fix the deck.** The video is the source of truth because it's timestamped.
3. **The toggle is the hero.** Cut anything that steals seconds from 0:50–1:35.
4. **Silence is a tool.** The 2-second hold after exfiltration flatlines is the most persuasive moment in the video. Do not fill it.
5. **Show the weakness.** The encrypted-malware row degrading on camera is not a flaw in the video — it is the reason the rest of the numbers are believable.
