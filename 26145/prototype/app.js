const threats = [
  { name: 'DDoS (SYN Flood)', short: 'DDoS (SYN Flood)', count: 6, trend: '↑ 33%', color: '#ff6271', bg: '#ffebee', icon: '♢', severity: 'High', confidence: '93%', points: 'M0 22 C8 21 12 19 18 20 S28 13 34 17 S43 9 50 13 S61 4 68 8 S78 2 90 4' },
  { name: 'Botnet C2', short: 'Botnet C2', count: 3, trend: '↑ 50%', color: '#ff9a54', bg: '#fff0df', icon: '✳', severity: 'Medium', confidence: '88%', points: 'M0 22 C9 18 14 21 20 16 S30 21 37 13 S45 16 51 10 S61 14 68 6 S80 11 90 3' },
  { name: 'DNS / DGA', short: 'DNS / DGA', count: 3, trend: '↑ 200%', color: '#9d79ef', bg: '#f0eaff', icon: '✣', severity: 'Medium', confidence: '81%', points: 'M0 21 C8 21 15 19 22 20 S31 15 39 18 S49 8 56 14 S68 6 73 10 S84 1 90 2' },
  { name: 'Encrypted Malware', short: 'Encrypted Malware', count: 2, trend: '↑ 100%', color: '#4e9ef6', bg: '#e7f2ff', icon: '▣', severity: 'Low', confidence: '77%', points: 'M0 21 C8 17 14 21 21 16 S32 18 39 13 S49 17 57 8 S69 13 75 7 S83 10 90 3' },
  { name: 'Port Scanning', short: 'Port Scanning', count: 2, trend: '↓ 0%', color: '#3dcaa6', bg: '#def9ef', icon: '♧', severity: 'Low', confidence: '72%', points: 'M0 17 C8 15 15 18 22 14 S30 17 37 13 S49 17 57 12 S68 13 75 8 S84 12 90 8' },
  { name: 'Data Exfiltration', short: 'Data Exfiltration', count: 2, trend: '↑ 100%', color: '#5ac8db', bg: '#e2f8fb', icon: '↗', severity: 'Low', confidence: '68%', points: 'M0 22 C9 19 14 21 20 18 S30 20 36 19 S45 18 51 10 S60 15 66 13 S72 2 79 6 S86 1 90 3' }
];
const alerts = [
  { threat: 'DDoS (SYN Flood)', severity: 'HIGH', src: '185.199.110.24', dest: '10.0.1.12', confidence: '96%', time: '10:22 AM', protocol: 'TCP', detail: 'Source entropy spiked to 0.94 with 18,420 SYN packets in the last 5 seconds.' },
  { threat: 'Botnet C2', severity: 'HIGH', src: '172.16.4.23', dest: '45.77.32.10', confidence: '92%', time: '10:18 AM', protocol: 'TLS', detail: 'Beacon interval 60s ± 4s across 340 connections. Client JA4 is not a known browser.' },
  { threat: 'DNS Tunnelling (DGA)', severity: 'MEDIUM', src: '10.0.5.18', dest: '8.8.8.8', confidence: '87%', time: '10:15 AM', protocol: 'DNS', detail: 'Long, high-entropy subdomains and 86% NXDOMAIN-like retry behaviour detected.' },
  { threat: 'Encrypted Malware (TLS/QUIC)', severity: 'MEDIUM', src: '192.168.1.45', dest: '203.0.113.22', confidence: '84%', time: '10:12 AM', protocol: 'QUIC', detail: 'Unknown client fingerprint with a repeated low-volume packet rhythm.' },
  { threat: 'Port Scanning', severity: 'LOW', src: '10.0.3.17', dest: '10.0.4.0/24', confidence: '76%', time: '10:07 AM', protocol: 'TCP', detail: 'One source touched 184 hosts and 402 ports using a SYN-only pattern.' }
];
const traffic = [
  ['10:24:10', '185.199.110.24', '10.0.1.12', 'TCP', '12.4 KB'],
  ['10:24:09', '172.16.4.23', '10.0.3.45', 'UDP', '8.7 KB'],
  ['10:24:08', '10.0.5.18', '8.8.8.8', 'DNS', '512 B'],
  ['10:24:07', '192.168.1.45', '203.0.113.22', 'TLS', '4.2 KB'],
  ['10:24:07', '10.0.3.17', '10.0.4.21', 'TCP', '1.8 KB']
];
const sources = [['185.199.110.24', 4, 92, '#f36e86'], ['172.16.4.23', 3, 78, '#ff9e53'], ['10.0.5.18', 2, 65, '#f0bd55'], ['192.168.1.45', 2, 58, '#68cbb5'], ['10.0.3.17', 1, 42, '#4c9bf3']];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function iconFor(threat) { return threats.find(item => item.name === threat)?.icon || '♢'; }
function renderThreatCards() {
  $('#threatGrid').innerHTML = threats.map(item => `<article class="threat-card"><div class="threat-top"><span class="threat-icon" style="color:${item.color};background:${item.bg}">${item.icon}</span><span class="threat-trend">${item.trend}</span></div><h4>${item.name}</h4><strong>${item.count}</strong><div class="sparkline" style="color:${item.color}"><svg viewBox="0 0 90 24" preserveAspectRatio="none"><path d="${item.points}"/></svg></div></article>`).join('');
}
function renderDistribution() {
  $('#distributionList').innerHTML = threats.map(item => `<div class="distribution-item"><i style="background:${item.color}"></i>${item.short.replace(' (SYN Flood)', '')}<b>${item.count}</b></div>`).join('');
}
function trendSvg(color = '#5f9bf1') { return `<svg class="tiny-trend" viewBox="0 0 40 14" preserveAspectRatio="none" style="color:${color}"><path d="M0 12 L6 10 L10 11 L16 7 L22 9 L27 4 L33 7 L40 2"/></svg>`; }
function renderThreatTable() {
  $('#threatTable').innerHTML = threats.slice(0, 5).map((item, index) => `<tr><td>${index + 1}</td><td><span class="threat-name"><i class="mini-threat-icon" style="color:${item.color};background:${item.bg}">${item.icon}</i>${item.name}</span></td><td>${item.count}</td><td><span class="severity-badge severity-${item.severity.toLowerCase()}">${item.severity}</span></td><td class="confidence">${item.confidence}</td><td>${trendSvg(item.color)}</td></tr>`).join('');
}
function renderSources() {
  $('#sourceList').innerHTML = sources.map(source => `<div class="source-row"><strong>${source[0]}</strong><span>${source[1]}</span><span class="risk-bar"><i style="width:${source[2]}%;background:${source[3]}"></i></span><span class="risk-score">${source[2]}%</span></div>`).join('');
}
function renderFeed(rows = traffic) {
  $('#feedTable').innerHTML = `<div class="feed-row"><span>Time</span><span>Source → Destination</span><span>Protocol</span><span>Size</span><span></span></div>` + rows.map(row => `<div class="feed-row"><span>${row[0]}</span><span class="endpoint">${row[1]} <span style="color:#9fb0c4">→</span> ${row[2]}</span><span><b class="protocol">${row[3]}</b></span><span class="packet-size">${row[4]}</span><span></span></div>`).join('');
}
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2500); }
function openAlert(alert) {
  $('#drawerContent').innerHTML = `<span class="drawer-kicker">LIVE DETECTION · ${alert.time}</span><h2 class="drawer-title">${alert.threat}</h2><p class="drawer-copy">${alert.detail}</p><div class="drawer-meta"><div><small>Source</small><strong>${alert.src}</strong></div><div><small>Destination</small><strong>${alert.dest}</strong></div><div><small>Confidence</small><strong>${alert.confidence}</strong></div><div><small>Protocol</small><strong>${alert.protocol}</strong></div></div><div class="evidence-box"><h4>Supporting evidence</h4><div class="evidence-item"><span>Rate / timing anomaly</span><b class="validity measured">MEASURED</b></div><div class="evidence-item"><span>Direction-aware feature set</span><b class="validity inferred">INFERRED</b></div><div class="evidence-item"><span>Evidence SHA-256</span><b class="validity measured">9f2c…a821</b></div></div>`;
  $('#alertDrawer').classList.add('open'); $('#drawerBackdrop').classList.add('open');
}
function closeDrawer() { $('#alertDrawer').classList.remove('open'); $('#drawerBackdrop').classList.remove('open'); }
function setView(view) {
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  const labels = { dashboard: ['Good Morning, Yash', "Here's what's happening with your network traffic."], traffic: ['Live Traffic Monitor', 'Watching the one-way stream as it arrives in the enclave.'], alerts: ['Alert Triage Center', 'Evidence-carrying detections ranked for an analyst.'], analysis: ['Threat Analysis', 'Direction-aware signals across the six threat classes.'], reports: ['Reports & Evidence', 'Deterministic replay metrics and custody-ready outputs.'], settings: ['System Settings', 'Passive monitoring controls for this enclave.'] };
  const [title, subtitle] = labels[view] || labels.dashboard; $('#pageTitle').innerHTML = `${title} <span>✦</span>`; $('#pageSubtitle').textContent = subtitle;
  if (view !== 'dashboard') showToast(`${title} view selected — demo data is ready.`);
}
function updateClock() { const now = new Date(); $('#lastUpdated').innerHTML = now.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}).replace(',', ', ') + '&nbsp;&nbsp; ' + now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
function simulateReplay() {
  const flow = 1248563 + Math.floor(Math.random() * 2100); $('#flowMetric').textContent = flow.toLocaleString();
  const latency = 298 + Math.floor(Math.random() * 45); $('#latencyMetric').textContent = `${latency} ms`;
  updateClock();
}

renderThreatCards(); renderDistribution(); renderThreatTable(); renderSources(); renderFeed();
$$('.nav-item, [data-view]').forEach(item => item.addEventListener('click', () => setView(item.dataset.view)));
$('#drawerClose').addEventListener('click', closeDrawer); $('#drawerBackdrop').addEventListener('click', closeDrawer);
$('#globalSearch').addEventListener('input', event => { const query = event.target.value.toLowerCase().trim(); const filtered = traffic.filter(row => row.join(' ').toLowerCase().includes(query)); renderFeed(query ? filtered : traffic); });
$('#diodeToggle').addEventListener('click', () => { const button = $('#diodeToggle'); const active = button.classList.toggle('diode-active'); $('#diodeLabel').textContent = active ? 'DIODE MODE · FWD ONLY' : 'Passive Ingest Mode'; $('#modeText').textContent = active ? 'DIODE MODE · FWD ONLY' : 'Passive Ingest Mode'; showToast(active ? 'Diode Twin active · reverse direction masked.' : 'Passive ingest restored · both directions visible.'); });
$('#threatGrid').addEventListener('click', () => showToast('Threat card selected. Open Alerts to inspect supporting evidence.'));
$('#threatTable').addEventListener('click', event => { const row = event.target.closest('tr'); if (!row) return; const alert = alerts[Number(row.children[0].textContent) - 1]; if (alert) openAlert(alert); });
$('#feedTable').addEventListener('click', event => { const row = event.target.closest('.feed-row:not(:first-child)'); if (row) openAlert(alerts[Math.floor(Math.random() * alerts.length)]); });
$('.notification').addEventListener('click', () => openAlert(alerts[0]));
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#globalSearch').focus(); } if (event.key === 'Escape') closeDrawer(); });
setInterval(simulateReplay, 4500); updateClock();
