const pptxgen = require("pptxgenjs");

// ─── EKADHARA · SIH26145 · NTRO ──────────────────────────────────────────────
// Palette: intelligence / signal. Midnight enclave, ice-blue data stream,
// signal-red for failure states, amber for placeholders.
const NAVY   = "0F1B2D";
const NAVY2  = "1C3050";
const ICE    = "5EC8DE";
const ICE_D  = "1A6E85";
const RED    = "C0392B";
const AMBER  = "B7791F";
const GREEN  = "1E7A4C";
const INK    = "16222E";
const GREY   = "5B6B7A";
const GREYL  = "9AA8B4";
const PAPER  = "FFFFFF";
const TINT   = "F1F5F8";
const TINT2  = "E4EDF2";

const H_FONT = "Cambria";
const B_FONT = "Calibri";
const M_FONT = "Courier New";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";           // 13.3 x 7.5
pres.author = "Team EKADHARA";
pres.title  = "EKADHARA - SIH26145 - NTRO";

const W = 13.3, H = 7.5, M = 0.6;

// ── helpers ─────────────────────────────────────────────────────────────────
function footer(slide, n) {
  slide.addText("SIH26145  ·  EKADHARA  ·  NTRO", {
    x: M, y: H - 0.45, w: 6, h: 0.28, isTextBox: true, margin: 0,
    fontSize: 9, fontFace: B_FONT, color: GREYL, align: "left",
  });
  slide.addText(String(n), {
    x: W - M - 0.6, y: H - 0.45, w: 0.6, h: 0.28, isTextBox: true, margin: 0,
    fontSize: 9, fontFace: B_FONT, color: GREYL, align: "right",
  });
}

// kicker above, title below — keeps long titles from colliding with the section label
function title(slide, text, sub) {
  if (sub) {
    slide.addText(sub.toUpperCase(), {
      x: M, y: 0.30, w: W - 2 * M, h: 0.22, isTextBox: true, margin: 0,
      fontSize: 10, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1.5, align: "left",
    });
  }
  slide.addText(text, {
    x: M, y: 0.52, w: W - 2 * M, h: 0.88, isTextBox: true, margin: 0,
    fontSize: 25, bold: true, fontFace: H_FONT, color: NAVY, align: "left", valign: "top",
  });
}

// amber "replace me" tag for slides carrying placeholder figures
function placeholderTag(slide, x, y, w) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h: 0.26, fill: { color: "FDF6E3" },
    line: { color: AMBER, width: 0.75 }, rectRadius: 0.05,
  });
  slide.addText("PLACEHOLDER FIGURES  ·  replace with Week-1 control-experiment output", {
    x, y, w, h: 0.26, isTextBox: true, margin: 0,
    fontSize: 8.5, bold: true, fontFace: B_FONT, color: AMBER, align: "center", valign: "middle",
  });
}

function card(slide, o) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h,
    fill: { color: o.fill || TINT },
    line: { color: o.line || TINT2, width: 1 },
    rectRadius: 0.06,
  });
}

// chevron pipeline stage
function stage(slide, x, y, w, h, num, label) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, fill: { color: NAVY }, line: { color: NAVY, width: 1 }, rectRadius: 0.05,
  });
  slide.addText(num, {
    x: x, y: y + 0.07, w: w, h: 0.22, isTextBox: true, margin: 0,
    fontSize: 9, bold: true, fontFace: B_FONT, color: ICE, align: "center",
  });
  slide.addText(label, {
    x: x + 0.05, y: y + 0.28, w: w - 0.1, h: h - 0.34, isTextBox: true, margin: 0,
    fontSize: 9.5, bold: true, fontFace: B_FONT, color: PAPER, align: "center", valign: "top",
  });
}

function arrow(slide, x, y) {
  slide.addText("▶", {
    x, y, w: 0.26, h: 0.28, isTextBox: true, margin: 0,
    fontSize: 12, color: ICE_D, align: "center", valign: "middle",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE  (dark)
// ═══════════════════════════════════════════════════════════════════════════
const s1 = pres.addSlide();
s1.background = { color: NAVY };

// one-way stream motif: three receding chevrons, left to right
[0.30, 0.42, 0.54].forEach((op, i) => {
  s1.addShape(pres.ShapeType.chevron, {
    x: 9.35 + i * 1.05, y: 0.55, w: 1.4, h: 6.4,
    fill: { color: NAVY2, transparency: 100 - Math.round(op * 100) },
    line: { color: ICE_D, width: 0.75, transparency: 70 },
  });
});

s1.addText("एकधारा", {
  x: M, y: 1.25, w: 8, h: 0.5, isTextBox: true, margin: 0,
  fontSize: 22, fontFace: B_FONT, color: ICE, align: "left",
});
s1.addText("EKADHARA", {
  x: M, y: 1.78, w: 9, h: 1.25, isTextBox: true, margin: 0,
  fontSize: 62, bold: true, fontFace: H_FONT, color: PAPER, charSpacing: 5, align: "left",
});
s1.addText("See everything.  Touch nothing.", {
  x: M, y: 3.02, w: 9, h: 0.45, isTextBox: true, margin: 0,
  fontSize: 20, italic: true, fontFace: B_FONT, color: ICE, align: "left",
});
s1.addText("Passive AI Threat Intelligence for Air-Gapped Monitoring Enclaves", {
  x: M, y: 3.52, w: 9, h: 0.35, isTextBox: true, margin: 0,
  fontSize: 13.5, fontFace: B_FONT, color: GREYL, align: "left",
});

s1.addShape(pres.ShapeType.roundRect, {
  x: M, y: 4.18, w: 8.6, h: 1.02,
  fill: { color: NAVY2 }, line: { color: ICE_D, width: 1.25 }, rectRadius: 0.05,
});
s1.addText(
  "Half of every standard detection feature disappears on a real data diode.\nWe measured exactly how much — and got it back.",
  {
    x: M + 0.25, y: 4.28, w: 8.1, h: 0.82, isTextBox: true, margin: 0,
    fontSize: 13.5, fontFace: B_FONT, color: PAPER, align: "left", valign: "middle", lineSpacingMultiple: 1.25,
  }
);

s1.addText(
  "SIH26145  ·  National Technical Research Organisation  ·  Category: Software  ·  Theme: Blockchain & Cybersecurity",
  { x: M, y: 6.45, w: 11.5, h: 0.28, isTextBox: true, margin: 0,
    fontSize: 10, fontFace: B_FONT, color: GREYL, align: "left" }
);
s1.addText("Team <name>  ·  <institution>", {
  x: M, y: 6.73, w: 11.5, h: 0.28, isTextBox: true, margin: 0,
  fontSize: 10, fontFace: B_FONT, color: ICE_D, align: "left",
});

s1.addNotes(
  "10s. EKADHARA - Sanskrit for 'single stream'. See everything, touch nothing. " +
  "That's the constraint NTRO put on us, and it's the constraint that breaks every commercial product in this space."
);

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — PROPOSED SOLUTION: the contradiction + kill shot
// ═══════════════════════════════════════════════════════════════════════════
const s2 = pres.addSlide();
s2.background = { color: PAPER };
title(s2, "The problem statement contains a contradiction — and it decides who wins",
      "1 · Proposed Solution");

// LEFT — the contradiction
card(s2, { x: M, y: 1.5, w: 6.0, h: 2.72, fill: TINT, line: TINT2 });
s2.addText("THE CONTRADICTION", {
  x: M + 0.25, y: 1.63, w: 5.5, h: 0.28, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1.5,
});
s2.addText([
  { text: "The PS specifies a hardware DATA DIODE", options: { bold: true, color: INK, breakLine: true } },
  { text: "→ traffic copied in one direction only.\n", options: { color: GREY, breakLine: true } },
  { text: "Then it requires:", options: { bold: true, color: INK, breakLine: true } },
  { text: "(f)  “outbound-to-inbound byte ratios”", options: { color: INK, breakLine: true } },
  { text: "        needs the reverse direction", options: { color: RED, italic: true, breakLine: true } },
  { text: "(d)  “JA3 / JA3S fingerprints”", options: { color: INK, breakLine: true } },
  { text: "        JA3S is the SERVER hello", options: { color: RED, italic: true, breakLine: true } },
  { text: "\nBoth require exactly what a diode removes.", options: { bold: true, color: NAVY } },
], {
  x: M + 0.25, y: 1.95, w: 5.5, h: 2.2, isTextBox: true, margin: 0,
  fontSize: 12, fontFace: B_FONT, lineSpacingMultiple: 1.05,
});

// RIGHT — the kill shot chart
s2.addText("THE KILL SHOT  ·  detection quality (F1)", {
  x: 6.95, y: 1.55, w: 5.75, h: 0.28, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1.5,
});
s2.addChart(
  pres.ChartType.bar,
  [
    { name: "Standard approach", labels: ["Full-duplex mirror", "Real diode capture"], values: [0.92, 0.41] },
    { name: "EKADHARA",          labels: ["Full-duplex mirror", "Real diode capture"], values: [0.91, 0.83] },
  ],
  {
    x: 6.85, y: 1.82, w: 5.85, h: 2.45,
    barDir: "col", barGapWidthPct: 55,
    chartColors: [RED, NAVY],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00",
    dataLabelFontSize: 10, dataLabelFontFace: B_FONT, dataLabelColor: INK,
    valAxisMaxVal: 1.0, valAxisMinVal: 0,
    catAxisLabelColor: GREY, catAxisLabelFontSize: 10, catAxisLabelFontFace: B_FONT,
    valAxisLabelColor: GREYL, valAxisLabelFontSize: 9, valAxisLabelFontFace: B_FONT,
    valGridLine: { color: TINT2, size: 1 },
    catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendFontSize: 10, legendFontFace: B_FONT, legendColor: GREY,
  }
);

placeholderTag(s2, 6.85, 4.30, 5.85);

// RED caption
s2.addShape(pres.ShapeType.roundRect, {
  x: M, y: 4.42, w: 6.0, h: 0.72, fill: { color: "FBEAE8" }, line: { color: RED, width: 1.25 }, rectRadius: 0.06,
});
s2.addText("It does not crash. It does not warn.\nIt reports high confidence throughout.", {
  x: M + 0.2, y: 4.48, w: 5.6, h: 0.6, isTextBox: true, margin: 0,
  fontSize: 12.5, bold: true, fontFace: B_FONT, color: RED, align: "center", valign: "middle",
});

// OUR SOLUTION strip
card(s2, { x: M, y: 5.38, w: W - 2 * M, h: 1.28, fill: NAVY, line: NAVY });
s2.addText("OUR SOLUTION", {
  x: M + 0.28, y: 5.5, w: 3, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE, charSpacing: 1.5,
});
s2.addText(
  "EKADHARA reads a one-way traffic copy and emits calibrated, evidence-carrying alerts across all six threat classes — " +
  "without transmitting a packet, resolving a hostname, or decrypting a byte.",
  { x: M + 0.28, y: 5.8, w: W - 2 * M - 0.56, h: 0.72, isTextBox: true, margin: 0,
    fontSize: 14, fontFace: B_FONT, color: PAPER, valign: "top", lineSpacingMultiple: 1.15 }
);

footer(s2, 1);
s2.addNotes(
  "90s. NTRO's enclaves are fed by hardware data diodes - traffic copied one way, no path back. That's deliberate: " +
  "if an attacker compromises the monitoring system, there's nowhere for them to go.\n\n" +
  "Now read the requirements. (f) asks for the ratio of outbound to inbound bytes. (d) asks for JA3S - the server-side " +
  "TLS fingerprint. Both need the direction a diode deletes.\n\n" +
  "So we tested it. This chart is the standard approach - the toolchain most solutions to this PS will be built on. " +
  "On full-duplex traffic it scores 0.9. On the diode capture NTRO actually described, 0.4.\n\n" +
  "And here's what matters: it doesn't crash. It doesn't warn you. Half its features silently become zero and it keeps " +
  "reporting high confidence. [PAUSE] We built the system that survives it - and can prove it."
);

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — TECHNICAL APPROACH
// ═══════════════════════════════════════════════════════════════════════════
const s3 = pres.addSlide();
s3.background = { color: PAPER };
title(s3, "One pipeline.  Six detectors.  Zero outbound packets.", "2 · Technical Approach");

// Egress lockdown boundary
s3.addShape(pres.ShapeType.roundRect, {
  x: M, y: 1.52, w: W - 2 * M, h: 1.42,
  fill: { color: TINT }, line: { color: RED, width: 1.5, dashType: "dash" }, rectRadius: 0.06,
});
s3.addText("EGRESS LOCKDOWN BOUNDARY   ·   --network none  +  seccomp denies connect / sendto / sendmsg", {
  x: M + 0.2, y: 1.58, w: 11.8, h: 0.24, isTextBox: true, margin: 0,
  fontSize: 9, bold: true, fontFace: B_FONT, color: RED, charSpacing: 0.5,
});

const stages = [
  ["01", "INGEST\nread-only"],
  ["02", "FLOW ASSEMBLY\n+ direction mask"],
  ["03", "FEATURE FABRIC\n+ ACK-Shadow"],
  ["04", "6 DETECTORS\nstreaming"],
  ["05", "FUSION\ncalibration"],
  ["06", "EVIDENCE\nOCSF + Merkle"],
  ["07", "DASHBOARD\nlive HUD"],
];
const sw = 1.52, sgap = 0.16;
let sx = M + 0.22;
stages.forEach((st, i) => {
  stage(s3, sx, 1.9, sw, 0.92, st[0], st[1]);
  if (i < stages.length - 1) arrow(s3, sx + sw + 0.01, 2.22);
  sx += sw + sgap;
});

// ACK-Shadow diagram
card(s3, { x: M, y: 3.12, w: 6.55, h: 2.28, fill: TINT, line: ICE_D });
s3.addText("ACK-SHADOW  ·  recovering the invisible direction", {
  x: M + 0.22, y: 3.22, w: 6.1, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1,
});
s3.addText([
  { text: "VISIBLE  (client → server)", options: { bold: true, color: NAVY, breakLine: true } },
  { text: "  ack = 1,461              ◄──  1,460 bytes   (unseen)", options: { color: INK, breakLine: true } },
  { text: "  ack = 5,001,000          ◄──  ~5 MB         (unseen)", options: { color: INK, breakLine: true } },
], {
  x: M + 0.22, y: 3.52, w: 6.1, h: 0.85, isTextBox: true, margin: 0,
  fontSize: 10.5, fontFace: M_FONT, lineSpacingMultiple: 1.15,
});
s3.addText(
  "TCP receipts travel in the direction we CAN see.\nΔack  =  the volume of traffic we CANNOT see.",
  { x: M + 0.22, y: 4.42, w: 6.1, h: 0.56, isTextBox: true, margin: 0,
    fontSize: 12.5, bold: true, fontFace: B_FONT, color: NAVY, lineSpacingMultiple: 1.1 }
);
s3.addText("→ requirement (f) becomes computable on a link where inbound is invisible.", {
  x: M + 0.22, y: 5.02, w: 6.1, h: 0.28, isTextBox: true, margin: 0,
  fontSize: 10.5, italic: true, fontFace: B_FONT, color: ICE_D,
});

// three differentiator cards
const diffs = [
  [RED,   "EGRESS LOCKDOWN", "Read-only enforced by the kernel, not by convention. seccomp kills any send attempt — demoed live."],
  [AMBER, "ACK-SHADOW",      "Reverse-channel byte volume recovered from TCP ACK-number progression. TCP only; stated as a limit."],
  [GREEN, "CONSTANT MEMORY", "Count-Min Sketch + HyperLogLog. Flat memory at any rate — a spoofed flood cannot exhaust us."],
];
let dy = 3.12;
diffs.forEach(([c, h, b]) => {
  card(s3, { x: 7.35, y: dy, w: 5.35, h: 0.68, fill: PAPER, line: TINT2 });
  s3.addShape(pres.ShapeType.ellipse, { x: 7.52, y: dy + 0.22, w: 0.22, h: 0.22, fill: { color: c }, line: { color: c, width: 0 } });
  s3.addText(h, {
    x: 7.85, y: dy + 0.09, w: 4.7, h: 0.24, isTextBox: true, margin: 0,
    fontSize: 11, bold: true, fontFace: B_FONT, color: NAVY,
  });
  s3.addText(b, {
    x: 7.85, y: dy + 0.335, w: 4.72, h: 0.33, isTextBox: true, margin: 0,
    fontSize: 9, fontFace: B_FONT, color: GREY, lineSpacingMultiple: 0.95,
  });
  dy += 0.80;
});

// stack strip
card(s3, { x: M, y: 5.55, w: W - 2 * M, h: 1.1, fill: NAVY, line: NAVY });
s3.addText("STACK", {
  x: M + 0.28, y: 5.65, w: 2, h: 0.24, isTextBox: true, margin: 0,
  fontSize: 9.5, bold: true, fontFace: B_FONT, color: ICE, charSpacing: 1.5,
});
s3.addText("Zeek  (capture · flow · DNS/TLS/JA4)   →   Python detectors   →   ONNX   →   OCSF alerts   →   React dashboard", {
  x: M + 0.28, y: 5.9, w: 11.9, h: 0.28, isTextBox: true, margin: 0,
  fontSize: 12, bold: true, fontFace: B_FONT, color: PAPER,
});
s3.addText("Six specialists, not one classifier: DDoS is a rate phenomenon over seconds; beaconing a periodicity phenomenon over hours; DGA a string phenomenon on one query.  One model cannot be right about all three.", {
  x: M + 0.28, y: 6.18, w: 11.9, h: 0.36, isTextBox: true, margin: 0,
  fontSize: 9.5, fontFace: B_FONT, color: GREYL, italic: true,
});

footer(s3, 2);
s3.addNotes(
  "90s. One pipeline, six detectors, zero outbound packets.\n\n" +
  "Zeek does capture, flow assembly, DNS and TLS parsing. On top we run six specialist detectors, because these threats " +
  "live at different time scales in different feature spaces. One model that tries to catch all six is mediocre at all six, " +
  "and worse - it can't tell you why it fired. The PS requires every alert to carry supporting evidence. Six specialists can.\n\n" +
  "Two things nobody else will have. Egress Lockdown - every team puts 'read-only' on a slide; we enforce it in the kernel, " +
  "and we demo it.\n\n" +
  "Second, ACK-Shadow. TCP is a delivery-confirmation protocol. Every packet the client sends carries a receipt - 'I've " +
  "received everything up to byte N.' Those receipts travel in the direction we CAN see. We never see the server's packets, " +
  "but we watch that number climb, and the climb tells us exactly how much came back."
);

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — FEASIBILITY & VIABILITY
// ═══════════════════════════════════════════════════════════════════════════
const s4 = pres.addSlide();
s4.background = { color: PAPER };
title(s4, "We measured everything — including where we fail", "3 · Feasibility and Viability");

// LEFT: Diode-Twin method
card(s4, { x: M, y: 1.5, w: 4.75, h: 2.62, fill: TINT, line: TINT2 });
s4.addText("DIODE-TWIN METHOD", {
  x: M + 0.22, y: 1.6, w: 4.3, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1.5,
});
s4.addText("Capture once, full-duplex.  Post-filter into twins.\nOne label file.  Identical models.  Identical thresholds.", {
  x: M + 0.22, y: 1.87, w: 4.3, h: 0.5, isTextBox: true, margin: 0,
  fontSize: 10.5, fontFace: B_FONT, color: INK, lineSpacingMultiple: 1.1,
});
s4.addText([
  { text: "scenario_BI.pcap    ┐", options: { breakLine: true } },
  { text: "scenario_FWD.pcap   ├──  scenario_truth.json", options: { breakLine: true } },
  { text: "scenario_REV.pcap   ┘", options: {} },
], {
  x: M + 0.22, y: 2.42, w: 4.3, h: 0.62, isTextBox: true, margin: 0,
  fontSize: 9.5, fontFace: M_FONT, color: NAVY, lineSpacingMultiple: 1.1,
});
s4.addText("40 scenarios  ·  packet-level ground truth  ·  generated with the exact tools NTRO named: hping3 · Slowloris · iodine · dnscat2 · DGArchive", {
  x: M + 0.22, y: 3.12, w: 4.3, h: 0.62, isTextBox: true, margin: 0,
  fontSize: 9.5, fontFace: B_FONT, color: GREY, lineSpacingMultiple: 1.05,
});
s4.addText("UniFlow-IN — released as a public dataset", {
  x: M + 0.22, y: 3.76, w: 4.3, h: 0.24, isTextBox: true, margin: 0,
  fontSize: 9.5, bold: true, italic: true, fontFace: B_FONT, color: ICE_D,
});

// RIGHT: degradation matrix
s4.addText("DEGRADATION MATRIX  ·  detection quality (F1)", {
  x: 5.63, y: 1.55, w: 7.1, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1.5,
});
const hdr = (t) => ({ text: t, options: { bold: true, color: PAPER, fill: { color: NAVY }, fontSize: 10 } });
const cell = (t, o = {}) => ({ text: t, options: Object.assign({ fontSize: 10, color: INK }, o) });
s4.addTable(
  [
    [hdr("Threat class"), hdr("Both directions"), hdr("Diode (one-way)")],
    [cell("Recon / port scan"), cell("0.94"), cell("0.94", { color: GREEN, bold: true })],
    [cell("Volumetric DDoS"), cell("0.93"), cell("0.92", { color: GREEN, bold: true })],
    [cell("C2 beaconing"), cell("0.91"), cell("0.87", { color: GREEN, bold: true })],
    [cell("DGA / DNS tunnel"), cell("0.88"), cell("0.84", { color: GREEN, bold: true })],
    [cell("Data exfiltration  · with ACK-Shadow", { bold: true }), cell("0.89", { bold: true }), cell("0.83", { color: GREEN, bold: true })],
    [cell("Data exfiltration  · without it", { italic: true, color: GREY }), cell("—", { color: GREY }), cell("0.00", { color: RED, bold: true })],
    [cell("Malware in encrypted sessions", { color: RED, bold: true }), cell("0.86", { color: RED }), cell("0.55   JA4S lost", { color: RED, bold: true })],
  ],
  {
    x: 5.63, y: 1.83, w: 7.1, colW: [3.4, 1.8, 1.9],
    border: { type: "solid", color: TINT2, pt: 1 },
    fontFace: B_FONT, rowH: 0.27, valign: "middle",
    fill: { color: PAPER },
  }
);
s4.addText("Zero silent failures.  Every degradation is measured, declared, and on this slide.", {
  x: 5.63, y: 4.16, w: 7.1, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: NAVY,
});
placeholderTag(s4, 5.63, 4.44, 7.1);

// BOTTOM: performance stats
const stats = [
  ["XX,XXX", "flows / sec sustained"],
  ["0.00 %", "packet drop rate"],
  ["< XXX ms", "p99 alert latency"],
  ["FLAT", "memory under 10× burst"],
];
let px = M;
const pw = (W - 2 * M - 3 * 0.18) / 4;
stats.forEach(([big, small]) => {
  card(s4, { x: px, y: 4.9, w: pw, h: 1.0, fill: TINT, line: TINT2 });
  s4.addText(big, {
    x: px, y: 4.99, w: pw, h: 0.46, isTextBox: true, margin: 0,
    fontSize: 25, bold: true, fontFace: H_FONT, color: NAVY, align: "center",
  });
  s4.addText(small, {
    x: px, y: 5.45, w: pw, h: 0.36, isTextBox: true, margin: 0,
    fontSize: 10, fontFace: B_FONT, color: GREY, align: "center",
  });
  px += pw + 0.18;
});
s4.addText("Hardware: 8-core x86_64, 32 GB.   Re-runnable:  ./eval/run_matrix.py --all   —  replay is deterministic, same PCAP in, byte-identical output.", {
  x: M, y: 6.0, w: W - 2 * M, h: 0.28, isTextBox: true, margin: 0,
  fontSize: 10, fontFace: B_FONT, color: GREY, align: "center", italic: true,
});

// challenges strip
s4.addText([
  { text: "No labelled one-way data exists", options: { bold: true, color: NAVY } },
  { text: "  →  we generate it, twins are a post-filter        ", options: { color: GREY } },
  { text: "1-in-10,000 imbalance", options: { bold: true, color: NAVY } },
  { text: "  →  precision @ 50 alerts/hour, never accuracy        ", options: { color: GREY } },
  { text: "Models stale in an air gap", options: { bold: true, color: NAVY } },
  { text: "  →  signed USB model packs + drift monitor", options: { color: GREY } },
], {
  x: M, y: 6.34, w: W - 2 * M, h: 0.36, isTextBox: true, margin: 0,
  fontSize: 9.5, fontFace: B_FONT, align: "center",
});

footer(s4, 3);
s4.addNotes(
  "90s. THE TRUST SLIDE - give it the most time.\n\n" +
  "Feasibility first: the data problem is solved. NTRO's own dataset note tells us to generate lab traffic. We containerised " +
  "that into forty scenarios with packet-level ground truth. Because we capture full-duplex first and filter afterwards, every " +
  "scenario gives a matched pair sharing one label file. That's the Diode-Twin method.\n\n" +
  "That's what produces this matrix. Same models, same thresholds, both worlds.\n\n" +
  "Look at the exfiltration rows. With ACK-Shadow it survives. Without it, zero. That gap is the innovation, quantified.\n\n" +
  "And look at the red row. Encrypted-malware detection degrades badly one-way - we lose the server-side TLS fingerprint and " +
  "there is no trick that gets it back. We put that on the slide rather than hiding it, because a system that hides one failure " +
  "can't credibly claim it has none of the others. [PAUSE]\n\n" +
  "Performance is measured on stated hardware with the drop rate alongside, because a throughput number without a drop rate is " +
  "meaningless. And you can re-run it."
);

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — IMPACT & BENEFITS
// ═══════════════════════════════════════════════════════════════════════════
const s5 = pres.addSlide();
s5.background = { color: PAPER };
title(s5, "Deployable inside an Indian air gap — tomorrow", "4 · Impact and Benefits");

// before / after
card(s5, { x: M, y: 1.5, w: 3.55, h: 2.5, fill: TINT, line: TINT2 });
s5.addText("WITHOUT", {
  x: M + 0.22, y: 1.62, w: 3.1, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: GREY, charSpacing: 1.5,
});
s5.addText([
  { text: "403 alerts.", options: { bold: true, fontSize: 20, color: RED, breakLine: true } },
  { text: "Unranked.", options: { breakLine: true } },
  { text: "No context.", options: { breakLine: true } },
  { text: "Nothing to investigate with —", options: { breakLine: true } },
  { text: "the analyst cannot query anything.", options: {} },
], {
  x: M + 0.22, y: 1.95, w: 3.1, h: 1.9, isTextBox: true, margin: 0,
  fontSize: 12, fontFace: B_FONT, color: GREY, lineSpacingMultiple: 1.2,
});

card(s5, { x: 4.4, y: 1.5, w: 8.3, h: 2.5, fill: NAVY, line: NAVY });
s5.addText("WITH EKADHARA", {
  x: 4.62, y: 1.62, w: 4, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE, charSpacing: 1.5,
});
s5.addText("INCIDENT #42  —  CRITICAL", {
  x: 4.62, y: 1.9, w: 7.9, h: 0.34, isTextBox: true, margin: 0,
  fontSize: 18, bold: true, fontFace: H_FONT, color: PAPER,
});
s5.addText([
  { text: "Host 10.2.4.9", options: { bold: true, color: ICE, breakLine: true } },
  { text: "RECON 09:14   →   C2 ESTABLISHED 11:02   →   EGRESS 12:26", options: { color: PAPER, bold: true, breakLine: true } },
  { text: "3 independent detectors concur  ·  calibrated confidence 0.94", options: { color: GREYL, breakLine: true } },
  { text: "~4.1 GB egress estimated via ACK-Shadow", options: { color: GREYL, breakLine: true } },
  { text: "Evidence: 3 content hashes, 12 contributing features, Merkle-sealed", options: { color: GREYL } },
], {
  x: 4.62, y: 2.32, w: 7.9, h: 1.5, isTextBox: true, margin: 0,
  fontSize: 12, fontFace: B_FONT, lineSpacingMultiple: 1.25,
});

// beneficiaries
card(s5, { x: M, y: 4.18, w: 6.2, h: 2.3, fill: TINT, line: TINT2 });
s5.addText("WHO BENEFITS", {
  x: M + 0.22, y: 4.3, w: 5.7, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1.5,
});
s5.addText([
  { text: "NTRO / NCIIPC", options: { bold: true, color: NAVY } },
  { text: "  intelligence layer for enclaves they already operate — no new hardware, no change to the security boundary", options: { color: GREY, breakLine: true } },
  { text: "Power · telecom · defence · rail", options: { bold: true, color: NAVY } },
  { text: "  detection inside air gaps, where commercial NDR cannot function at all", options: { color: GREY, breakLine: true } },
  { text: "SOC analysts", options: { bold: true, color: NAVY } },
  { text: "  incidents, not alert confetti", options: { color: GREY, breakLine: true } },
  { text: "Forensics / legal", options: { bold: true, color: NAVY } },
  { text: "  Merkle-sealed ledger → admissible evidence", options: { color: GREY, breakLine: true } },
  { text: "Indian security ecosystem", options: { bold: true, color: NAVY } },
  { text: "  UniFlow-IN — first public corpus with paired full-duplex / diode-capture variants", options: { color: GREY } },
], {
  x: M + 0.22, y: 4.6, w: 5.75, h: 1.82, isTextBox: true, margin: 0,
  fontSize: 9.5, fontFace: B_FONT, lineSpacingMultiple: 1.12,
});

// deployability
card(s5, { x: 7.0, y: 4.18, w: 5.7, h: 2.3, fill: TINT, line: TINT2 });
s5.addText("WHY IT DEPLOYS", {
  x: 7.22, y: 4.3, w: 5.2, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10.5, bold: true, fontFace: B_FONT, color: ICE_D, charSpacing: 1.5,
});
[
  "Single OCI image · runs with --network none · USB-portable",
  "Zero external dependencies · SBOM shipped in the image",
  "Alerts emit as OCSF → plugs into any SIEM, no adapter",
  "Licence-clean: BSD-3 JA4 default (JA4+ is monetisation-restricted)",
  "Self-baselines to a new network in 7 days",
  "Signed model updates by sneakernet — no internet, ever",
].forEach((t, i) => {
  s5.addText("✔", {
    x: 7.22, y: 4.62 + i * 0.30, w: 0.25, h: 0.26, isTextBox: true, margin: 0,
    fontSize: 11, bold: true, fontFace: B_FONT, color: GREEN,
  });
  s5.addText(t, {
    x: 7.5, y: 4.62 + i * 0.30, w: 5.0, h: 0.28, isTextBox: true, margin: 0,
    fontSize: 9.5, fontFace: B_FONT, color: INK,
  });
});

footer(s5, 4);
s5.addNotes(
  "30s. Without fusion an analyst gets four hundred unranked alerts and no way to investigate - remember, in this enclave " +
  "they can't query anything. With EKADHARA they get one incident with a story: reconnaissance at 9:14, command-and-control " +
  "at 11:02, four gigabytes out at 12:26, three independent detectors agreeing.\n\n" +
  "And it actually deploys. One container image, no network, no dependencies, standard alert format, licence-clean. You could " +
  "carry it into a facility on a USB stick.\n\n" +
  "SAY OUT LOUD (do not print): Every capable NDR product on the market is foreign, cloud-dependent and enrichment-hungry. " +
  "None can run inside an Indian air-gapped enclave without phoning home. EKADHARA is designed for exactly the constraint " +
  "that makes those products unusable."
);

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 6 — RESEARCH & REFERENCES  (dark close)
// ═══════════════════════════════════════════════════════════════════════════
const s6 = pres.addSlide();
s6.background = { color: NAVY };

s6.addText("5 · RESEARCH AND REFERENCES", {
  x: M, y: 0.30, w: W - 2 * M, h: 0.22, isTextBox: true, margin: 0,
  fontSize: 10, bold: true, fontFace: B_FONT, color: ICE, charSpacing: 1.5,
});
s6.addText("Built on standards.  Validated against real traffic.", {
  x: M, y: 0.52, w: W - 2 * M, h: 0.88, isTextBox: true, margin: 0,
  fontSize: 25, bold: true, fontFace: H_FONT, color: PAPER, valign: "top",
});

const cols = [
  ["STANDARDS", [
    "OCSF — Open Cybersecurity Schema Framework (Linux Foundation). Our alert schema: class 2004 Detection Finding",
    "JA4 / JA4+ — FoxIO TLS fingerprinting. Core JA4 is BSD-3-Clause and ships by default; JA4+ is FoxIO Licence 1.1 — government internal use permitted, monetisation restricted, patent-pending",
    "IPFIX (RFC 7011) · NetFlow v9 · sFlow — ingest modes",
    "MITRE ATT&CK — kill-chain stage mapping",
    "Zeek · Suricata — parser oracle and comparison baselines",
  ]],
  ["TECHNIQUES", [
    "Count-Min Sketch (Cormode & Muthukrishnan) — bounded-memory frequency",
    "HyperLogLog (Flajolet et al.) — bounded-memory fan-out cardinality",
    "CUSUM change-point detection — rate anomaly without static thresholds",
    "Bowley skewness + MAD — jitter-tolerant beacon periodicity",
    "Isotonic calibration · Expected Calibration Error",
    "TreeSHAP (Lundberg & Lee) — per-alert evidence attribution",
    "Merkle hash chains — tamper-evident custody",
  ]],
  ["DATA", [
    "UniFlow-IN (our contribution) — 40 scenarios, paired BI/FWD/REV twins, packet-level labels",
    "CTU-13 / MalwareCaptureFacility",
    "malware-traffic-analysis.net",
    "DGArchive · CIRA-CIC-DoHBrw",
    "CIC-IDS2017 — comparability only; documented label errors stated",
  ]],
];
let cx = M;
const cw = (W - 2 * M - 2 * 0.3) / 3;
cols.forEach(([head, items]) => {
  s6.addShape(pres.ShapeType.roundRect, {
    x: cx, y: 1.5, w: cw, h: 4.05,
    fill: { color: NAVY2 }, line: { color: ICE_D, width: 1 }, rectRadius: 0.06,
  });
  s6.addText(head, {
    x: cx + 0.22, y: 1.62, w: cw - 0.44, h: 0.28, isTextBox: true, margin: 0,
    fontSize: 11, bold: true, fontFace: B_FONT, color: ICE, charSpacing: 1.5,
  });
  s6.addText(
    items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    {
      x: cx + 0.22, y: 1.95, w: cw - 0.44, h: 3.45, isTextBox: true, margin: 0,
      fontSize: 9, fontFace: B_FONT, color: "D6E2EA", paraSpaceAfter: 6, lineSpacingMultiple: 1.02,
    }
  );
  cx += cw + 0.3;
});

s6.addShape(pres.ShapeType.roundRect, {
  x: M, y: 5.72, w: W - 2 * M, h: 0.95,
  fill: { color: NAVY2 }, line: { color: ICE_D, width: 1.25 }, rectRadius: 0.06,
});
s6.addText("8 BACKUP SLIDES AVAILABLE", {
  x: M + 0.25, y: 5.82, w: 4, h: 0.26, isTextBox: true, margin: 0,
  fontSize: 10, bold: true, fontFace: B_FONT, color: ICE, charSpacing: 1.5,
});
s6.addText("ACK-Shadow proof  ·  Egress Lockdown layers  ·  Merkle custody chain  ·  full degradation matrix incl. flow-only mode  ·  evasion break-even points  ·  per-detector feature lists  ·  licence register + SBOM  ·  scale-out design", {
  x: M + 0.25, y: 6.08, w: W - 2 * M - 0.5, h: 0.5, isTextBox: true, margin: 0,
  fontSize: 10, fontFace: B_FONT, color: "D6E2EA", lineSpacingMultiple: 1.1,
});

s6.addText("Repo  <github link>          Demo video  <link>          UniFlow-IN dataset  <link>", {
  x: M, y: 6.85, w: W - 2 * M, h: 0.28, isTextBox: true, margin: 0,
  fontSize: 9.5, fontFace: B_FONT, color: GREYL, align: "center",
});

s6.addNotes(
  "20s. We build on open standards rather than inventing our own - OCSF for alerts, so this plugs into any SIEM. " +
  "We've done the licence analysis: core JA4 is BSD, JA4+ has monetisation restrictions, and we default to the BSD one. " +
  "And we have eight backup slides - happy to go deeper on any of it."
);

pres.writeFile({ fileName: "EKADHARA_SIH26145.pptx" })
  .then(f => console.log("WROTE " + f));
