# What We Are Building — the plain-English version

> For the whole team. No jargon that isn't explained. If you can't explain our project to a friend after reading this, the doc has failed — tell whoever wrote it.

---

## 1. The situation, in one picture

A power grid (or a defence network, or a telecom core) has a wall around it. To watch for attacks, the operator makes a **photocopy of all traffic** and sends it into a sealed room next door.

The copy machine only works one way. There is **no door** from the sealed room back into the network.

```
   THE PROTECTED NETWORK              THE SEALED ROOM
   ┌────────────────────┐            ┌──────────────────┐
   │                    │  ────────► │   our software   │
   │  power grid /      │  photocopy │   lives here     │
   │  defence network   │            │                  │
   │                    │     ✗      │                  │
   └────────────────────┘  no way back └────────────────┘
```

Why no door? Because if a hacker breaks into the sealed room, there's nowhere for them to go. The room is a dead end. That's the whole point.

**Our job:** sit in that sealed room, watch the photocopy, and figure out who's attacking — using only what we can see.

---

## 2. What makes this hard (three things)

### Hard thing 1 — we can't ask questions
Normal security software cheats constantly. It sees a suspicious IP address and *looks it up* on the internet. It sees a weird program and *asks an agent on that computer*. It sees an unknown domain and *queries a threat database*.

We can do **none of that**. No internet. No agents. No lookups. Ever.

Everything we know, we have to work out from the traffic itself.

### Hard thing 2 — everything is encrypted
About 90% of modern traffic is scrambled. We can't read what people are saying.

But we *can* see: how big each message is, how often they're sent, who they're sent to, and the rhythm of the conversation. Like a postal inspector who can weigh envelopes and note the addresses, but never open one.

Turns out that's enough. **Behaviour leaks even when content doesn't.**

### Hard thing 3 — we might only see half of every conversation ★
This is the important one, and it's the reason our project exists.

A conversation between two computers has two directions: what the client says, and what the server says back. **The photocopier might only copy one of those directions.**

That breaks things badly. Imagine trying to work out whether someone is stealing data by comparing how much they upload versus download — when you can only see uploads.

---

## 3. The mistake almost everyone will make

There's a standard recipe that ~200 teams will follow for this problem:

1. Take a famous public dataset of network attacks (CIC-IDS2017)
2. Run a standard tool over it that produces ~80 numbers per conversation (CICFlowMeter)
3. Train a standard machine-learning model on those numbers
4. Report "99% accuracy"
5. Build a dashboard

**Here's the problem.** A big chunk of those 80 numbers describe *the direction we can't see*. Things like "bytes received", "download-to-upload ratio", "how fast the server replied".

When you only see one direction, those numbers all become **zero**.

The model doesn't crash. It doesn't warn you. It just quietly starts using a bunch of zeros as if they were real measurements, and keeps printing confident-looking answers.

> **It fails silently.** That is the single worst way software can fail, and nobody in the competition will notice it's happening to them.

---

## 4. Our two big ideas

### Big Idea #1 — Test in both worlds ("Diode-Twin")

We generate our own attack traffic in a lab, and we **record it twice**:
- **Version A:** both directions (the easy world)
- **Version B:** one direction only (the real world)

Same traffic. Same attacks. Same labels. Just one has half the data removed.

Then we run our system on both and publish a table showing **exactly how much worse we get** when half the data disappears.

**Why this wins:** nobody else can produce this table, because nobody else made the recording twice. And measuring your own weakness — with real numbers — reads as serious engineering, not a student project.

It also gives us the best 10 seconds of our demo: a **toggle switch** on screen that deletes one direction of traffic live, and a panel showing which detectors survive.

---

### Big Idea #2 — Recover the direction we can't see ("ACK-Shadow")

This is the clever bit. Stay with me — it's simpler than it sounds.

When computers talk over TCP (which is most traffic), the receiver constantly sends little receipts saying:

> *"I have now received everything up to byte number 5,000,000."*

Those receipts travel in the direction **we can see**.

So even though we never see the server's messages, we see the client's receipts. And if the receipt number climbs from 1,000 to 5,001,000, we know — with arithmetic, not guesswork — that **the server sent about 5 megabytes**.

```
  What we CAN see (client → server)      What we CANNOT see (server → client)
  ┌──────────────────────────────┐        ┌──────────────────────────────┐
  │  "received up to byte 1,461" │  ◄──── │   1,460 bytes  (invisible)   │
  │  "received up to byte 5,001,000" │◄── │   ~5 MB        (invisible)   │
  └──────────────────────────────┘        └──────────────────────────────┘
              ▲
              └─ the receipt numbers tell us the size of what we can't see
```

**What this rescues:** data-theft detection. That detection is *defined* by comparing upload volume to download volume — and download is the invisible direction. Without this trick it simply cannot work. With it, it does.

**We name it ACK-Shadow** (ACK = acknowledgement, the technical name for those receipts). It's a shadow of traffic we never actually see.

---

## 5. What the system actually does, start to finish

```
  ①  A copy of network traffic arrives (from a file, a live feed, or flow summaries)
              ↓
  ②  We group packets into "conversations" and tag each one:
         "I saw both directions" / "I saw only one"
              ↓
  ③  We turn each conversation into numbers (rate, timing, sizes, rhythm, names)
         → where a number needs the missing direction, ACK-Shadow fills it in
         → and every number is tagged: MEASURED / ESTIMATED / MISSING
              ↓
  ④  Six specialist detectors look at those numbers, each hunting one thing:
         • floods        • phone-home malware   • fake domain names
         • hidden malware in encryption          • scanning    • data theft
              ↓
  ⑤  We combine the results, work out how confident we really are,
      and link related detections into a single story
              ↓
  ⑥  Each alert gets its evidence attached: which numbers caused it,
      a fingerprint of the exact bytes, and a tamper-proof seal
              ↓
  ⑦  It appears on a dashboard for a human to act on
```

### Why six specialists instead of one big AI?

Because the six threats are completely different shapes:

| Threat | What it looks like | Time scale |
|---|---|---|
| Flood | volume explodes | seconds |
| Phone-home malware | too-regular timing | hours |
| Fake domain names | text that looks like keyboard-mashing | one message |
| Malware in encryption | a distinctive handshake + rhythm | one conversation |
| Scanning | one machine touching hundreds of others | minutes |
| Data theft | uploading far more than usual | hours to days |

One model that tries to spot all six at once will be mediocre at all six — and worse, it can't *tell you why* it fired. The problem statement specifically demands that every alert explains itself. Six specialists can.

---

## 6. Five more things we do that others won't

**1. We prove we can't send anything.**
Everyone will *claim* their system is read-only. We make it physically impossible: the container runs with networking switched off, and the operating system is configured to kill the program if it even *tries* to send. We demo this on stage by making it try, and letting it die.

**2. Our memory never grows.**
Most detectors keep a list of every IP address they've seen. During a flood with millions of fake addresses, that list eats all the memory and the detector crashes — **the attack kills the attack-detector.** We use clever fixed-size data structures instead, so our memory is flat whether we're seeing a thousand conversations a second or a million. We'll show the comparison as a graph.

**3. We report a number that's actually useful.**
"99% accuracy" sounds great and means nothing here. If only 1 in 10,000 conversations is an attack, a 99.9%-accurate detector still produces *a hundred false alarms per second*. So we report: **"of the 50 alerts we show a human each hour, how many are real?"** That's the number a real security team lives with.

**4. Our alerts can't be tampered with.**
Each alert is sealed with a cryptographic fingerprint that also covers every previous alert. Change or delete one old alert, and the seal breaks visibly. This matters because these logs might end up as legal evidence. *(It's also the honest way to touch the "Blockchain" theme — we use the underlying maths, not a pointless cryptocurrency.)*

**5. We publish where we break.**
We attack our own system on purpose — add random wobble to malware timing, pad messages to hide their size, scan very slowly — and publish the exact point where each detector stops working.

Sounds like a bad idea. It isn't. Every other team will claim their system has no weaknesses, which no expert believes. Showing measured limits is what makes the rest of your numbers believable.

---

## 7. What we're leaving behind

Beyond working software:

- **A dataset.** Because we generate our own traffic, we end up with something that doesn't exist publicly: attack recordings that come in matched pairs — both-directions and one-direction — with perfect labels. We publish it so the next team doesn't start from zero.
- **A method.** "Test your detector with half the data removed" is a technique any passive-monitoring project can reuse.

---

## 8. If you remember only three sentences

1. **We watch a one-way copy of network traffic and find attackers, without ever being able to send, ask, or decrypt anything.**
2. **Everyone else's solution quietly breaks when the copy is genuinely one-way — we prove it, we measure it, and we fix the worst of it with a trick called ACK-Shadow.**
3. **We report honest numbers, including the ones that make us look bad, because that's what makes the rest of them worth believing.**

---

## 9. Jargon decoder

| You'll hear | It means |
|---|---|
| **Packet** | One envelope of data |
| **Flow / conversation** | All the packets between two computers for one purpose |
| **Data diode** | The one-way copier |
| **Enclave** | The sealed room |
| **Passive** | We only watch; we never touch |
| **Metadata** | Facts about a message (size, time, who) — not its contents |
| **Unidirectional** | We only see one of the two directions |
| **ACK** | A receipt saying "got it, up to byte N" |
| **ACK-Shadow** | Our trick: using receipts to measure what we can't see |
| **Diode-Twin** | Our method: recording the same traffic both ways to compare |
| **Beaconing** | Malware phoning home on a schedule |
| **DGA** | Malware inventing random domain names |
| **Exfiltration** | Stealing data out |
| **Fan-out** | One machine touching lots of others (scanning) |
| **False positive** | An alarm that turned out to be nothing |
| **Calibration** | Making sure "80% confident" is actually right 80% of the time |
| **OCSF** | A standard format for security alerts, so other tools understand ours |
