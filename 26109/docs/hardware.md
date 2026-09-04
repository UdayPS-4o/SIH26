# PRAHARI — Hardware Design & Costed BOM (PS 26109)

SIH 2026 · PS 26109 · **Category: Hardware**

Prices checked **4 September 2026** against Indian retailers, in INR, excluding shipping unless noted. **Every price carries a source URL.** Lines with no directly-fetched price are marked **UNVERIFIED** and are planning estimates, not quotes — §7 lists all of them in one place. Do not put an UNVERIFIED number on a slide without re-checking it.

---

## 1. The design decision that everything else follows from

Every commercial mastitis-detection system in the world — DeLaval Herd Navigator, Lely MQC-C, Afimilk MPC — is an in-line sensor in a robotic or rotary parlour, installed for **$50,000–150,000**. They work. They are also irrelevant to India, because:

- **86% of Indian dairy farmers hold 1–5 animals**, and the national average is **under two milking cows per household** (USDA GAIN 2021/22).
- **85.5% of milking is by hand**, twice a day, mostly by women.
- The shed has no reliable power. Rural outages still average ~90 minutes in states like UP.

A ₹1,800 collar on a two-animal household is ₹900 per animal against an annual subclinical loss of about ₹1,390 per lactation. The payback exists on paper, but it requires a farmer with no prior reason to trust us to make the capital outlay first. That is a pilot, not a national programme.

**What already exists at national scale is the collection point.** There are roughly **228,374 village Dairy Cooperative Societies** (NDDB, 2021-22). Each has an **Automatic Milk Collection Unit** that already measures **fat and SNF per farmer per shift** and computes payment in real time — and NDDB's own [AMCU technical specification](https://www.nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf) explicitly designs for *"no regular power supply, non-IT-savvy operators, dusty environments."*

So PRAHARI's primary hardware deliverable is **a retrofit module for the AMCU sample path**, serving 100–500 animals per village at single-digit rupees per animal. Per-animal hardware stays in the design for organised and commercial herds, where it genuinely pays for itself. That ordering is the whole hardware thesis.

| | Unit cost | Animals served | **Per animal** |
|---|---:|---:|---:|
| **AMCU retrofit module** (Tier 2) | ~₹2,720 | 100–500 | **₹5–27** |
| Handheld quarter wand (Tier 3a) | ~₹1,340 | 1 household (1–5) | ₹270–1,340 |
| Collar node (Tier 3b) | ~₹1,640 | 1 | ₹1,640 |
| Farm/village gateway | ~₹4,350 DIY | 1 village | ₹9–44 |

---

## 2. Sensor technology — what works, what doesn't, and why

### 2.1 Electrical conductivity — the signal everyone reaches for

**The physiology is real.** Mastitis damages the blood–milk barrier's tight junctions, letting Na⁺ and Cl⁻ leak into milk while K⁺ falls, raising conductivity by roughly 10–15%.

**The performance alone is not good enough, and our pitch must say so before a judge does.** Meta-analysis puts EC alone at **~66% sensitivity / ~94% specificity** ([PubMed 1532805](https://pubmed.ncbi.nlm.nih.gov/1532805/)), and Kandeel et al. 2019 found **AUC < 0.90 for every hand-held EC/ion meter tested**, concluding they are not clinically useful standalone ([PMC6766502](https://pmc.ncbi.nlm.nih.gov/articles/PMC6766502/)). See [`domain-brief.md`](domain-brief.md) §2.

| Option | Cost | Verdict |
|---|---|---|
| **DFRobot Gravity Analog EC Meter V2** (K=1), glass/platinum probe | **₹7,668 incl. GST** ([DNA Technology](https://www.dnatechindia.com/dfrobot-gravity-analog-conductivity-meter-v2.html)) | Accurate and calibrated, but it costs more than the rest of the BOM combined and the glass probe is fragile in a milking environment |
| **SS316 electrode pair + ADS1115 16-bit ADC** — **our pick** | probe ~₹1,000 **UNVERIFIED** ([IndiaMART range ₹950–1,200](https://dir.indiamart.com/impcat/conductivity-electrode.html)) + **₹159** ADS1115 ([Robokits](https://robokits.co.in/development-board/accessories-for-boards/ads1115-16-bit-i2c-adc-analog-to-digital-converter-module)) | The realistic build path. **Drive it with AC excitation, never DC** — DC polarises the electrodes and electrolyses the milk. SS316 (not SS304 with exposed solder) for food contact |
| **AD5933 impedance converter** — bio-impedance spectroscopy | $22–45 (~₹1,900–3,900), **UNVERIFIED for India** | The production upgrade. Frequency-dependent response separates fat/protein interference from true ionic conductivity. Worth naming as the roadmap item |

> **Why absolute accuracy matters less than you'd think.** PRAHARI never compares a reading to a fixed threshold. It compares each animal (or each farmer's pooled milk) to **her own trailing baseline**, and compares quarters within one udder at one milking. A cheap electrode with a stable *relative* response and a modest drift beats an expensive one used against a global cut-point. That is a design argument, not an excuse — but it is a real one, and it is why the DIY route is defensible here.

### 2.2 Milk temperature

| Part | Price | Source |
|---|---|---|
| **DS18B20 stainless waterproof probe** (1-Wire, ±0.5 °C) — **our pick** | **₹64** (₹54 + 18% GST) | [ElectronicsComp](https://www.electronicscomp.com/ds18b20-water-proof-temperature-sensor-probe-india) |
| PT100 + MAX31865 | **₹610 incl. GST** | [DNA Technology](https://www.dnatechindia.com/max-31865-pt-100-pt-1000-rtd-to-digital-module-buy-in-india.html) |

DS18B20 is more than adequate across the 30–40 °C milk range. Temperature is also required for **EC temperature compensation** — conductivity is strongly temperature-dependent, so this sensor is not optional even though it looks like a nice-to-have.

### 2.3 pH — deliberately demoted

DFRobot Gravity Analog pH kit: **₹2,005 incl. GST** ([ElectronicsComp](https://www.electronicscomp.com/analog-ph-sensor-kit-for-arduino)).

Glass-bulb pH probes **foul with milk protein**, drift with temperature, and need daily buffer recalibration. Commercial mastitis systems largely do not use pH as a primary signal, for exactly this reason. We carry it as an **optional secondary channel on the demo bench only**, and we say plainly why it is not in the production BOM. Including a sensor you know will drift, without saying so, is the kind of thing a judge catches.

### 2.4 Yield

| Part | Price | Source | Note |
|---|---|---|---|
| **20 kg straight-bar load cell** — **our pick** | **₹99 incl. GST** | [Robocraze](https://robocraze.com/products/20kg-load-cell) | Weigh the can. No moving parts in the milk |
| **HX711 amplifier** | **₹42** (₹36 + GST) | [ElectronicsComp](https://www.electronicscomp.com/hx711-load-cell-amplifier-module) | |
| YF-S201 inline flow sensor | ₹183 | [Robocraze](https://robocraze.com/products/water-flow-sensor) | Assumes a pipeline parlour — rare on Indian smallholdings. Skip |

Bucket weighing is the right answer for a hand-milking country: tare, milk, read. It also works unchanged at the AMCU, where the farmer's can is already being handled.

### 2.5 Behaviour — accelerometer and rumination

| Part | Price | Source |
|---|---|---|
| **MPU6050 (GY-521)** — pragmatic hackathon pick | **₹151** | [Robocraze](https://robocraze.com/products/mpu-6050-triple-axis-accelerometer-gyroscope-module) |
| LSM6DS3 / ADXL345 — better bias stability, lower power for a real collar | ~₹150–400, **UNVERIFIED** | Robu.in / Mouser India |

**Deriving rumination from a 3-axis accelerometer — the accepted method.** Rumination chewing has a fairly constant ~1 Hz cadence, distinct from eating and from idle. Two established routes: FFT/frequency-domain features, or time-domain statistics (variance, zero-crossing rate) into a light classifier. Published results: **KNN at 93.7% precision** across feeding/ruminating/other (Shen et al.); SVM on bolus-derived motion at 86%; FBG + decision tree at 94% across five chewing patterns. The validated commercial reference is **RumiWatch** (noseband pressure + triaxial accelerometer, Itin+Hoch) — cite it as the gold standard we are approximating with a cheaper sensor, rather than pretending a ₹151 IMU matches it.

### 2.6 Udder / body surface temperature

| Part | Price | Source | Verdict |
|---|---|---|---|
| **MLX90614 (GY-906)** non-contact IR, ±0.5 °C | **₹863** | [Robokits](https://robokits.co.in/sensors/temperature-humidity/infrared-temperature-sensor-gy-906-mlx90614) | **Mount it at the collection point / milking station, shared across the herd** — not one per collar. It needs unobstructed line-of-sight to skin, which a collar rarely has |
| AMG8833 8×8 thermal array | ~₹1,200–2,500, **UNVERIFIED** | [Techtonics](https://techtonics.in/product/amg8833-ir-8x8-thermal-imager-array-temperature-sensor-module/) | Wider field of view — genuinely useful for imaging the whole udder at the parlour. Stretch goal |
| FLIR Lepton | ~₹15,000–25,000, **UNVERIFIED**; [SparkFun $179.95](https://www.sparkfun.com/flir-lepton-2-5-thermal-imaging-module.html) | Export-controlled, hard to source in India | Out of scope. Name it only as "what production could add" |

Sharing one MLX90614 at the milking point instead of putting one on every collar saves **₹863 per animal** and works better. This is the same amortisation logic as the AMCU module, one level down.

### 2.7 Ingestible boluses — benchmark only

**smaXtec** (Austria) measures core temperature, rumination via reticulum contractions, and water intake. Pricing is quote-based and inconsistent across sources (one reports $89 device + $2.49/cow/month; a 2025 research pH-bolus reference cites $3,500) — **UNVERIFIED, treat as vendor-quote only**. Bolus manufacture is sealed, ingestible, biocompatible production; it is not a hackathon build. Cite it as the physiological gold standard, never as something we are replicating.

### 2.8 Commercial benchmarks — all quote-based

| Product | Reported pricing | Status |
|---|---|---|
| **Stellapps SmartMoo / mooON** (Bengaluru) | ~**$1/cow/month** device + support (2020-era figure, likely stale) — [DairyNews7x7](https://dairynews7x7.com/news/stellapps-created-a-step-counter-for-cows-in-100-b-usd-wearables-market); >50,000 units deployed | **The most relevant Indian benchmark.** Note the *pricing model* — low recurring fee, not large upfront capex. Ours should match it |
| **Prompt Equipments BovSmart** (Ahmedabad) | No public pricing; B2B dealer network | **UNVERIFIED**. Prompt also builds the AMCU/AMCS hardware our module retrofits — a partner, not just a competitor |
| Moocall (Ireland, calving) | €267 / £239 / $329 ex-VAT + annual renewal €135–166 | No India price |
| Allflex / SCR SenseHub | Bundled monthly per-cow subscription | Quote-based |

---

## 3. Connectivity, power and hardening

### 3.1 MCU

| Part | Price | Source | Use |
|---|---|---|---|
| **ESP32-WROOM-32**, 30-pin | **₹399** | [Robocraze](https://robocraze.com/products/esp32-development-board) | **AMCU module and milk node.** WiFi + BLE, deep sleep in the tens of µA |
| ESP32-WROOM-32, 38-pin | ₹489 | same | Collar |
| Raspberry Pi Pico W | **₹734 incl. GST** | [Robu.in](https://robu.in/product-tag/raspberry-pi-pico-w/) | Gateway compute |
| Seeed XIAO nRF52840 | **₹1,209** | [Robocraze](https://robocraze.com/products/seeed-studio-xiao-nrf52840-development-board-supports-bluetooth-5-0) | Production collar — best BLE + ultra-low-power. Not the 3-day build |

### 3.2 Radio — and the India band rule that trips everyone up

| Part | Price | Source |
|---|---|---|
| RA-02 (SX1278, **433 MHz**) | **₹479** | [rcduniya / Robu resale](https://rcduniya.com/product/robu-sx1278-lora-series-ra-02-spread-spectrum-wireless-module) |
| **865–867 MHz SX1276 module** (e.g. EBYTE E32) — the legally correct India part | ~₹400–800, **UNVERIFIED** | [Robu LoRa category](https://robu.in/product-category/iot-and-wireless/lora-module) |
| SIM800L GSM (2G) | **₹184** | [Robokits](https://robokits.co.in/wireless-solutions/gsm-gprs/sim800l-gprs-gsm-module-micro-sim-card-core-board-quad-band-ttl-serial-port-antenna) |
| NEO-6M GPS | ₹624–850 | [price tracker](https://buyhatke.com/amazon-robocraze-neo-6m-3v-5v-9600-gy-gps6mv2-price-in-india-63-36581796) — skip for stall-fed herds |

> **🇮🇳 The IN865 rule.** India's licence-exempt band for LoRa is **865–867 MHz — not the 868 MHz used across Europe.** This is set by the WPC's *"Use of Low Power Equipment in the Frequency Band 865–868 MHz for Short Range Devices (Exemption from Licence) Rules, 2021"*, permitting up to **1 W transmitter / 4 W e.r.p.**, 200 kHz channels, shared with UHF RFID ([gazette PDF](https://thc.nic.in/Central%20Governmental%20Rules/use%20of%20low%20power%20Equipment%20in%20the%20frequency%20band%20865%20to%20868%20MHz%20for%20Short%20Range%20Devices%20Exemption%20from%20Licence%20Rules,2021.pdf); [explainer](https://www.valetron.com/868-mhz-frequency-is-not-license-free-in-india-lora-in-india/)).
>
> **Practically:** firmware must use the **IN865 channel plan** (865.0625 / 865.4025 / 865.985 MHz, 125 kHz BW), not the EU868 plan that ships as the default in most LoRa tutorials and libraries. Most teams will demo on EU868 without realising. Knowing this — and saying it on the hardware slide — is a cheap, real credibility win.

> **NB-IoT is not available to us.** Jio and Airtel operate NB-IoT networks, but as of 2025-26 access is **B2B / bulk-SIM only**, and field reports describe inconsistent attach reliability even for enterprise testers ([developer report](https://www.hackster.io/vinayyn/testing-nb-iot-connectivity-in-india-with-nrf9160-and-airtel-ebfeb4)). Do not bet the build on it. LoRa farm-local + WiFi/2G backhaul, with NB-IoT named as the upgrade path once carrier access is secured.

> **2G sunset is a medium-term risk.** SIM800L depends on 2G. Airtel and Vi have signalled gradual urban 2G sunset from 2025-26; rural coverage is expected to persist for years and BSNL has committed to rural 2G. Flag it as a risk, not a blocker.

### 3.3 Power

| Part | Price | Source |
|---|---|---|
| 18650 Li-ion 2000 mAh | **₹59** | [Robocraze](https://robocraze.com/products/3-7v-2000mah-18650-li-ion-battery) |
| TP4056 charger/protection | **₹13** | [Robokits](https://robokits.co.in/batteries-chargers/charge-protection-circuit/tp4056-1.2a-5v-li-ion-battery-charge-discharge-protection-module) |
| CN3791 MPPT solar charger | **₹235 incl. GST** | [KTRON](https://www.ktron.in/product/cn3791-12v-mppt-solar-charger-module/) |
| 20 W 12 V solar panel | **₹1,149 incl. taxes** | [Moglix](https://www.moglix.com/solar-universe-india-20w-solar-panel/mp/msn2km142ge89v) |
| LiFePO4 26650 | **UNVERIFIED** — no India retail price found | Specialist suppliers, not hobby retailers |

**LiFePO4 vs Li-ion for a collar:** LiFePO4 has a flatter discharge curve, 2,000–5,000 cycles vs ~500, and is intrinsically safer at the 40–45 °C ambient an Indian cattle collar actually sees. It costs ~25% energy density and is harder to source. **Production choice: LiFePO4. Hackathon choice: 18650**, and say why.

**Battery-life arithmetic for the collar** (illustrative, not lab-measured):

```
  ESP32 deep sleep            ~10–20 µA
  MPU6050 idle                ~5 µA (gateable via MOSFET)
  Wake cycle: every 5 min → 287 wakes/day
    · 2 s accelerometer sampling @ ~20 mA
    · ~100 ms LoRa TX @ ~120 mA
  Average current  ≈ 1–2 mA
  On a 2000 mAh 18650  →  roughly 40–80 days
```

For contrast, a peer-reviewed ESP32 + ADXL345 + SX1278 livestock collar running **near-continuous** sampling measured **~104 hours (4.3 days)** ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S277237552600506X)). **Duty-cycling is not an optimisation, it is the difference between a product and a paperweight.** Even at 40–80 days, production still wants solar top-up or a swap-and-recharge service model — which is exactly the field-service pattern Stellapps already runs in India.

### 3.4 Enclosure and field-hardening

| Item | Price | Source |
|---|---|---|
| IP67 ABS enclosure, ~100×68×50 mm | **₹400** (price anchor; listing was out of stock at check — re-source) | [IndiaMART](https://www.indiamart.com/proddetail/ip67-plastic-enclosure-1251122491.html) |
| Larger gateway enclosure | ~₹900, **UNVERIFIED (estimate)** | scaled |
| Food-grade silicone potting | ~₹250, **UNVERIFIED (estimate)** | Indian B2B suppliers exist; no per-unit INR retrievable |

Production enclosures must be **UV-stabilised** ABS or polycarbonate — plain ABS embrittles in direct Indian sun within 1–2 years. Not required for a 3-day demo; required for the honesty of the production slide.

---

## 4. Costed BOMs

### 4.1 AMCU retrofit module — **the primary hardware deliverable**

Taps the AMCU's existing sample path. Mains-powered from the society's supply with a battery ride-through, because the NDDB spec assumes power is unreliable. One module per society.

| Component | Part | Qty | Unit ₹ | GST | Source |
|---|---|---:|---:|---|---|
| MCU | ESP32-WROOM-32 (30-pin) | 1 | 399 | incl. | [Robocraze](https://robocraze.com/products/esp32-development-board) |
| EC probe | SS316 electrode pair, ready-made | 1 | 1,000 | **UNVERIFIED** | [IndiaMART](https://dir.indiamart.com/impcat/conductivity-electrode.html) |
| EC front end | ADS1115 16-bit ADC | 1 | 159 | **UNVERIFIED** | [Robokits](https://robokits.co.in/development-board/accessories-for-boards/ads1115-16-bit-i2c-adc-analog-to-digital-converter-module) |
| Milk temp (also EC compensation) | DS18B20 stainless probe | 1 | 64 | incl. | [ElectronicsComp](https://www.electronicscomp.com/ds18b20-water-proof-temperature-sensor-probe-india) |
| Sample-path fitting | SS316 tee + gland | 1 | 300 | **UNVERIFIED (est.)** | — |
| Power | 12 V→5 V buck + 18650 ride-through + TP4056 | 1 | 150 | **UNVERIFIED (est.)** | — |
| Enclosure | IP65/67 ABS box | 1 | 400 | **UNVERIFIED** | [IndiaMART](https://www.indiamart.com/proddetail/ip67-plastic-enclosure-1251122491.html) |
| Potting | Food-grade silicone | 1 | 250 | **UNVERIFIED (est.)** | — |
| **Subtotal — WiFi/serial uplink via the society's existing AMCU connectivity** | | | **≈ ₹2,722** | | |
| Optional GSM uplink where the society has no connectivity | SIM800L | 1 | +184 | **UNVERIFIED** | [Robokits](https://robokits.co.in/wireless-solutions/gsm-gprs/sim800l-gprs-gsm-module-micro-sim-card-core-board-quad-band-ttl-serial-port-antenna) |
| Optional shared udder-temp station at the collection point | MLX90614 | 1 | +863 | | [Robokits](https://robokits.co.in/sensors/temperature-humidity/infrared-temperature-sensor-gy-906-mlx90614) |

**≈ ₹2,722 serving 100–500 animals = ₹5–27 per animal.** The CMT-assist capture costs nothing extra — it reads the operator's existing phone camera against a printed reference card.

### 4.2 Handheld quarter wand — Tier 3a, per household

Four-electrode wand the farmer dips into each quarter's strip-cup sample at milking. This is what unlocks **quarter asymmetry**, the strongest early feature we have (see [`implementation-flow.md`](implementation-flow.md)), without a parlour.

| Component | Part | Qty | Unit ₹ | Source |
|---|---|---:|---:|---|
| MCU | ESP32-WROOM-32 (30-pin) | 1 | 399 | [Robocraze](https://robocraze.com/products/esp32-development-board) |
| EC electrodes | SS316 pair | 1 | 1,000 **UNVERIFIED** | [IndiaMART](https://dir.indiamart.com/impcat/conductivity-electrode.html) |
| ADC | ADS1115 | 1 | 159 **UNVERIFIED** | [Robokits](https://robokits.co.in/development-board/accessories-for-boards/ads1115-16-bit-i2c-adc-analog-to-digital-converter-module) |
| Temp | DS18B20 | 1 | 64 | [ElectronicsComp](https://www.electronicscomp.com/ds18b20-water-proof-temperature-sensor-probe-india) |
| Power | 18650 + TP4056 | 1 | 72 | [Robocraze](https://robocraze.com/products/3-7v-2000mah-18650-li-ion-battery) |
| Enclosure | IP67 handheld box | 1 | 400 **UNVERIFIED** | [IndiaMART](https://www.indiamart.com/proddetail/ip67-plastic-enclosure-1251122491.html) |
| **Subtotal — BLE to the farmer's phone, no gateway needed** | | | **≈ ₹2,094** | |
| *Shared across a 5-animal household* | | | **₹419/animal** | |

Uplink is BLE to the farmer's own phone, so there is **no gateway cost at all** at this tier.

### 4.3 Collar node — Tier 3b, organised herds only

| Component | Part | Qty | Unit ₹ | GST | Source |
|---|---|---:|---:|---|---|
| MCU | ESP32-WROOM-32 (38-pin) | 1 | 489 | incl. | [Robocraze](https://robocraze.com/products/esp32-development-board) |
| IMU | MPU6050 GY-521 | 1 | 151 | incl. | [Robocraze](https://robocraze.com/products/mpu-6050-triple-axis-accelerometer-gyroscope-module) |
| Radio | RA-02 SX1278 (demo 433 MHz; **swap to 865–867 MHz for anything real**) | 1 | 479 | **UNVERIFIED** | [rcduniya](https://rcduniya.com/product/robu-sx1278-lora-series-ra-02-spread-spectrum-wireless-module) |
| Battery | 18650 2000 mAh | 1 | 59 | incl. | [Robocraze](https://robocraze.com/products/3-7v-2000mah-18650-li-ion-battery) |
| Charger | TP4056 | 1 | 13 | **UNVERIFIED** | [Robokits](https://robokits.co.in/batteries-chargers/charge-protection-circuit/tp4056-1.2a-5v-li-ion-battery-charge-discharge-protection-module) |
| Enclosure | IP67 ABS box | 1 | 400 | **UNVERIFIED** | [IndiaMART](https://www.indiamart.com/proddetail/ip67-plastic-enclosure-1251122491.html) |
| Strap + hardware | Nylon webbing, **breakaway** buckle, wiring | 1 set | 250 | **UNVERIFIED (est.)** | — |
| **Subtotal** | | | **≈ ₹1,641** | | |
| *If MLX90614 goes on every collar instead of a shared station* | | | *≈ ₹2,504* | | *don't — see §2.6* |

### 4.4 Village gateway

| Component | Part | Qty | Unit ₹ | Source |
|---|---|---:|---:|---|
| Compute | Raspberry Pi Pico W (or reuse an ESP32) | 1 | 734 | [Robu.in](https://robu.in/product-tag/raspberry-pi-pico-w/) |
| LoRa | RA-02 SX1278, single-channel | 1 | 479 **UNVERIFIED** | [rcduniya](https://rcduniya.com/product/robu-sx1278-lora-series-ra-02-spread-spectrum-wireless-module) |
| Backhaul | SIM800L GSM | 1 | 217 **UNVERIFIED** (₹184 + GST est.) | [Robokits](https://robokits.co.in/wireless-solutions/gsm-gprs/sim800l-gprs-gsm-module-micro-sim-card-core-board-quad-band-ttl-serial-port-antenna) |
| Solar | 20 W 12 V panel | 1 | 1,149 | [Moglix](https://www.moglix.com/solar-universe-india-20w-solar-panel/mp/msn2km142ge89v) |
| Charge control | CN3791 MPPT | 1 | 235 | [KTRON](https://www.ktron.in/product/cn3791-12v-mppt-solar-charger-module/) |
| Battery bank | 18650 × 4 | 4 | 236 | [Robocraze](https://robocraze.com/products/3-7v-2000mah-18650-li-ion-battery) |
| Enclosure | Larger IP65/67 box | 1 | 900 **UNVERIFIED (est.)** | scaled |
| Antenna | 865–867 MHz whip/fibreglass | 1 | 400 **UNVERIFIED (est.)** | — |
| **Subtotal — DIY single-channel** | | | **≈ ₹4,350** | |
| *Commercial alternative:* Dragino LG308 8-channel, WiFi/Ethernet | | 1 | **22,500 UNVERIFIED** | [IndiaMART, Enthu Technology](https://www.indiamart.com/proddetail/lorawan-indoor-gateway-multi-channel-20880246288.html) |
| *Dragino LG308 with 3G/4G backhaul* | | 1 | **32,040 UNVERIFIED** | [same](https://www.indiamart.com/proddetail/lorawan-indoor-gateway-multi-channel-with-3g-4g-20880218373.html) |

A commercial 8-channel gateway is out of a hackathon budget. Build the single-channel DIY gateway for the demo and cite the LG308 as what production looks like — that is an honest slide, not a weak one.

### 4.5 Deployment scenarios, fully costed

| Scenario | Contents | Cost | Animals | **Per animal** |
|---|---|---:|---:|---:|
| **A — One village society** *(the flagship)* | 1 AMCU module + 1 gateway | **₹7,072** | 300 | **₹24** |
| **B — Village + 5 progressive households** | A + 5 quarter wands | **₹17,542** | 300 | **₹58** |
| **C — Organised farm, 40 animals** | 1 milk node + 1 gateway + 40 collars | **₹72,712** | 40 | **₹1,818** |
| **D — Hackathon demo bench** | 1 AMCU module + 1 wand + 3 collars + 1 DIY gateway | **≈ ₹14,089** | — | — |

Scenario A is the number to put on the slide: **₹24 per animal, against a documented ₹1,390 per-lactation subclinical loss and DAHD's own ₹306–458/day clinical figure.**

### 4.6 Volume pricing — flagged honestly

No 1,000-unit quotes were obtained. As a **planning heuristic only**, moving from hobbyist retail to 1,000-unit sourcing (distributor reel/tray quantities, a single custom PCB replacing loose breakout modules with their redundant regulators and headers) typically yields **35–55% BOM reduction**. **This is UNVERIFIED and must be labelled as an estimate if it appears in the deck** — or replaced with a real quote from an Indian SMT house before demo day. One phone call turns this from an asterisk into a fact; make the call.

---

## 5. Three days vs. production

| | 3-day prototype | Production unit |
|---|---|---|
| EC sensing | Bare SS316 electrodes + ADS1115, AC-excited, hand-calibrated against known-conductivity solutions | Sealed food-contact-certified probe, factory-calibrated, temperature-compensated; AD5933 impedance spectroscopy |
| MCU / radio | Breakout modules on perfboard | Custom PCB: MCU + LoRa + power management, reflow-soldered |
| Enclosure | Off-the-shelf IP67 hobby box, silicone cable glands | Custom-moulded IP67/68, UV-stabilised, tamper-resistant, farmer-serviceable battery door |
| Rumination | Threshold/FFT rule on MPU6050, or a small scikit-learn model run on the phone | On-device TinyML validated against RumiWatch-style ground truth across breeds and seasons |
| LoRa | Single-channel DIY gateway, **EU868 defaults manually patched to IN865** | Multi-channel Dragino/RAK + self-hosted ChirpStack, correct IN865 plan, WPC-compliant antenna and power |
| Power | 18650, USB recharge | LiFePO4, solar-assisted, swap-battery field service |
| Udder temp | Handheld/parlour MLX90614 spot check | AMG8833 array or thermal kiosk at the collection point |
| Regulatory | Not filed — demo only, low power, short range | **WPC ETA (Equipment Type Approval)** required for commercial sale, per GSR 680(E)/698(E)/1047(E) |

---

## 6. Regulatory and practical caveats

1. **Food contact.** Anything touching milk must be food-contact-safe: SS316 (not SS304 with exposed solder), NSF/FDA-listed food-grade silicone for potting. This is an FSSAI requirement for equipment touching milk destined for sale, not a robustness nicety. Generic conformal coatings and hardware-store silicone are not acceptable on a milk-contact surface.
2. **CIP survivability.** Dairy equipment is washed with hot alkaline detergent then acid rinse — roughly 70–80 °C plus caustic and acid, repeatedly. This rules out most hobby sensor boards unless fully potted, and it is the main reason commercial in-line sensors cost so much more than their component BOM suggests. **Our AMCU module must be designed to be removable for cleaning, or fully potted.** State which.
3. **Cow safety.** A collar needs a **breakaway or quick-release** so an animal cannot be caught on fencing — standard practice in commercial collars. Keep total weight low (commercial collars run 300–500 g). Never put an unprotected Li-ion cell against the animal. Breakaway hardware is an **outstanding design item** — we have not priced it.
4. **Spectrum.** LoRa strictly within **865–867 MHz** (IN865), ≤1 W Tx / 4 W e.r.p. A hackathon demo at low power and short range is low legal risk; commercial sale requires **WPC ETA** ([summary](https://pcnindiaglobal.com/2026/07/07/wpc-eta-433-mhz-sub-ghz-short-range-devices-india/)).
5. **NB-IoT is B2B-only in India today.** Do not design the critical path around it.
6. **2G sunset** is a medium-term risk to the SIM800L backhaul. Rural persistence is expected; plan the migration anyway.
7. **All commercial competitor pricing here is quote-based or regional.** Never present Moocall's European price or Stellapps' 2020-era figure as a current Indian list price.

---

## 7. Every UNVERIFIED item, in one place

Re-check each before it appears on a slide or in a purchase order.

| Item | Status |
|---|---|
| 865–867 MHz SX1276 module — India retail price | Only the 433 MHz RA-02 (₹479) is confirmed. **The correct-band part is not priced.** Highest-priority gap |
| SS316 conductivity probe, ₹1,000 | IndiaMART range ₹950–1,200; no single fetched listing |
| ADS1115 ₹159, TP4056 ₹13, SIM800L ₹184 | Prices shown in retailer listings, not independently fetched |
| AMG8833 India retail price | Fetch blocked |
| LiFePO4 cell India retail price | Not found at hobby retailers |
| Food-grade silicone potting, ~₹250 | Estimate. Indian B2B suppliers exist; no per-unit INR retrievable |
| IP67 enclosure ₹400 | Fetched, but that listing was out of stock — price anchor only |
| Gateway enclosure ~₹900, antenna ~₹400, collar strap ~₹250, sample-path fitting ~₹300, buck+ride-through ~₹150 | **Pure estimates.** No sources |
| Dragino LG308 ₹22,500 / ₹32,040 | IndiaMART listing; GST treatment not stated |
| 1,000-unit volume pricing (35–55% reduction) | **Heuristic. No vendor quotes obtained** |
| All competitor pricing — Allflex, smaXtec, Moocall India, Stellapps current, Prompt BovSmart | Quote-based, regionally variable, or stale |

---

## 8. Open-source references worth reusing

| Project | Why |
|---|---|
| [LoRaCowTracker](https://github.com/leonardonakagawa/LoRaCowTracker) | Collar with GPS + LoRa + battery, gateway on Heltec V2, reporting to TTN. Closest starting skeleton for our collar firmware |
| [vpuhoff/lora-esp32](https://github.com/vpuhoff/lora-esp32) | ESP32/ESP32-S3 LoRa comms stack with a web management UI — reusable link layer |
| [MUUU! Livestock Smart Collar](https://www.hackster.io/JuanVi/muuu-livestock-smart-collar-70614e) | Solar open build with body temp, rumination, heart rate + LoRa. Sensor-fusion reference |
| [ESPHome](https://github.com/esphome/esphome) | YAML firmware for ESP32 — DS18B20, ADS1115 and HX711 are all first-class components. Could cut days off the milk-node firmware; less flexible for the custom AC-excited EC logic |
| [Meshtastic](https://github.com/meshtastic/firmware) | LoRa mesh — an option if a single-gateway star can't reach across a village |
| [ChirpStack](https://github.com/chirpstack/chirpstack) | MIT self-hosted LoRaWAN network server. The production path, without TTN's community limits |
| [Dragino LG308](https://www.dragino.com/products/lora-lorawan-gateway/item/140-lg308.html) | Reference gateway design and open firmware |
| RumiWatch methodology + the KNN/SVM/decision-tree rumination papers (§2.5) | Not code releases, but the citable methodology our accelerometer classifier is measured against |
