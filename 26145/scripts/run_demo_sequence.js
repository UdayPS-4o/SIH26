/**
 * EKADHARA Demo Sequence — auto-injects detection alerts.
 *
 * Usage:  node run_demo_sequence.js
 *
 * Staggers 6 attack-class alerts across ~18 seconds so the dashboard
 * populates in real-time while being recorded.
 */

const ATTACKS = [
  { attack_type: "syn_flood",         label: "SYN Flood DDoS",        severity: "critical" },
  { attack_type: "udp_flood",         label: "UDP Flood DDoS",        severity: "critical" },
  { attack_type: "c2_beaconing",      label: "C2 Beaconing",          severity: "high"     },
  { attack_type: "dns_tunnel",        label: "DNS Tunneling",         severity: "high"     },
  { attack_type: "port_scan",         label: "Port Scan Recon",       severity: "medium"   },
  { attack_type: "data_exfiltration", label: "Data Exfiltration",     severity: "critical" },
];

const API = "https://sih26145.udayps.com/api/demo/alert";
const DELAY_MS = 2500;

const sevIcon = (s) =>
  s === "critical" ? "[31m●[0m" :
  s === "high"     ? "[33m●[0m" :
                     "[36m●[0m";

(async () => {
  console.log("\n  EKADHARA Demo Sequence — Starting...\n");

  for (let i = 0; i < ATTACKS.length; i++) {
    const a = ATTACKS[i];

    await new Promise((r) => setTimeout(r, DELAY_MS));

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: a.attack_type, count: 1 }),
      });
      const data = await res.json();
      console.log(`  [${i + 1}/${ATTACKS.length}] ${sevIcon(a.severity)} ${a.label.padEnd(28)} → injected (count=${data.count})`);
    } catch (err) {
      console.log(`  [${i + 1}/${ATTACKS.length}] ${sevIcon(a.severity)} ${a.label.padEnd(28)} [33m→ API unreachable (backend may need redeploy)[0m`);
    }
  }

  console.log("\n  [32m[OK][0m All alerts injected.");
  console.log("  Dashboard: [96mhttps://sih26145.udayps.com[0m\n");
})();
