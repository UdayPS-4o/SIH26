import { useState, useCallback, useEffect } from 'react';
import { Play, Square, AlertTriangle, Shield, Activity, Globe, Lock, Network, Zap, RefreshCw, Radio } from 'lucide-react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { launchAttack, fetchAttackStatus, launchSimulator, stopSimulator, fetchSimulatorStatus, type SimulatorStartResult } from '../lib/realBackend';
import { useTheme } from '../context/ThemeContext';

interface AttackForm {
  attackType: string;
  target: string;
  port: string;
  duration: string;
  intensity: number;
}

const ATTACK_TYPES = [
  { id: 'syn_flood', label: 'SYN Flood', icon: Zap, desc: 'Volumetric TCP SYN flood', severity: 'critical' },
  { id: 'udp_flood', label: 'UDP Flood', icon: Activity, desc: 'UDP reflection/amplification', severity: 'critical' },
  { id: 'c2_beacon', label: 'C2 Beaconing', icon: Globe, desc: 'Periodic C2 callbacks', severity: 'high' },
  { id: 'port_scan', label: 'Port Scan', icon: Network, desc: 'Reconnaissance fan-out', severity: 'medium' },
  { id: 'dns_tunnel', label: 'DNS Tunnel', icon: Shield, desc: 'DNS data exfiltration', severity: 'high' },
  { id: 'dga_domain', label: 'DGA Domains', icon: Lock, desc: 'Algorithmically generated domains', severity: 'high' },
  { id: 'tls_anomaly', label: 'TLS Anomaly', icon: Lock, desc: 'Suspicious TLS fingerprint', severity: 'medium' },
  { id: 'data_exfil', label: 'Data Exfil', icon: Globe, desc: 'Asymmetric outbound traffic', severity: 'critical' },
];

const SIMULATOR_PRESETS: { label: string; desc: string; mix: Record<string, number>; accent: string }[] = [
  { label: 'DDoS Storm', desc: 'SYN + UDP flood — high volume', mix: { syn_flood: 60, udp_flood: 40 }, accent: 'var(--accent-red)' },
  { label: 'C2 Channel', desc: 'Beaconing + DNS tunnel — persistence', mix: { c2_beaconing: 60, dns_tunnel: 40 }, accent: 'var(--accent-orange)' },
  { label: 'Full Assault', desc: 'All threat classes active', mix: { syn_flood: 25, udp_flood: 15, c2_beaconing: 20, dns_tunnel: 15, port_scan: 10, data_exfiltration: 15 }, accent: 'var(--accent-pink)' },
  { label: 'Stealth Exfil', desc: 'DGA + data exfiltration — low-and-slow', mix: { dga_domain: 40, data_exfiltration: 40, tls_anomaly: 20 }, accent: 'var(--accent-purple)' },
  { label: 'Recon + Infiltrate', desc: 'Port scan → DGA → beaconing', mix: { port_scan: 40, dga_domain: 30, c2_beaconing: 30 }, accent: 'var(--accent-cyan)' },
];

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'var(--sev-critical-bg)', text: 'var(--accent-red)', border: 'var(--sev-critical-border)' },
  high:     { bg: 'var(--sev-high-bg)',     text: 'var(--accent-orange)', border: 'var(--sev-high-border)' },
  medium:   { bg: 'var(--sev-medium-bg)',   text: 'var(--accent-cyan)',   border: 'var(--sev-medium-border)' },
};

const AttackConsole: React.FC = () => {
  const { C } = useTheme();
  const { stats, isConnected, backendOnline } = useWebSocketContext();
  const [form, setForm] = useState<AttackForm>({
    attackType: 'syn_flood', target: '127.0.0.1', port: '8000', duration: '10', intensity: 0.7,
  });
  const [launching, setLaunching] = useState(false);
  const [lastResult, setLastResult] = useState<SimulatorStartResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simMix, setSimMix] = useState<Record<string, number>>({});
  const [activeAttacks, setActiveAttacks] = useState<any[]>([]);
  const [simMsg, setSimMsg] = useState<string | null>(null);

  const refreshSimStatus = useCallback(async () => {
    try {
      const s = await fetchSimulatorStatus();
      setSimRunning(s.simulator_running);
      setSimMix(s.attack_mix);
      setActiveAttacks([...(s.lab_attacks || []), ...(s.generated_attacks || [])]);
    } catch {}
  }, []);

  useEffect(() => { refreshSimStatus(); }, [refreshSimStatus]);
  useEffect(() => {
    if (!simRunning) return;
    const t = setInterval(refreshSimStatus, 4000);
    return () => clearInterval(t);
  }, [simRunning, refreshSimStatus]);

  const handleSimPreset = useCallback(async (mix: Record<string, number>, label: string) => {
    setSimMsg(`Starting "${label}" simulator...`);
    try {
      const result = await launchSimulator(mix);
      setSimRunning(result.simulator_running);
      setSimMix(result.attack_mix);
      setSimMsg(result.message);
      setTimeout(() => setSimMsg(null), 4000);
    } catch {
      setSimMsg('Failed to start simulator — is the backend running?');
      setTimeout(() => setSimMsg(null), 4000);
    }
  }, []);

  const handleSimStop = useCallback(async () => {
    try {
      const r = await stopSimulator();
      setSimRunning(false);
      setSimMix({});
      setActiveAttacks([]);
      setSimMsg(r.message);
      setTimeout(() => setSimMsg(null), 4000);
    } catch {
      setSimMsg('Failed to stop simulator.');
    }
  }, []);

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    setLastResult(null);
    try {
      const result = await launchAttack(form.attackType, form.intensity);
      setLastResult(result as SimulatorStartResult);
      refreshSimStatus();
    } catch (err) {
      setLastResult({ status: 'error', simulator_running: false, attack_mix: {}, message: err instanceof Error ? err.message : 'Launch failed' } as any);
    } finally {
      setLaunching(false);
    }
  }, [form, refreshSimStatus]);

  const handleStopAll = useCallback(async () => {
    try {
      await fetch('/api/attack/stop', { method: 'POST' });
      setActiveAttacks([]);
      refreshSimStatus();
    } catch {}
  }, [refreshSimStatus]);

  const selectedType = ATTACK_TYPES.find(t => t.id === form.attackType);
  const sevColor = selectedType ? SEVERITY_COLORS[selectedType.severity] : SEVERITY_COLORS.medium;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <AlertTriangle size={22} style={{ color: C.accent }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Attack Console</h1>
        </div>
        <p style={{ fontSize: 12, color: C.textSec, margin: 0 }}>
          Generate controlled attack traffic for detection pipeline testing. All attacks target localhost by default.
        </p>
      </div>

      {/* Status Banner */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, padding: '14px 18px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Backend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: backendOnline ? C.green : C.red, boxShadow: backendOnline ? `0 0 8px ${C.green}` : 'none' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: backendOnline ? C.green : C.red }}>{backendOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 160, padding: '14px 18px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>WebSocket</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? C.green : C.textDim }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: isConnected ? C.green : C.textDim }}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 160, padding: '14px 18px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Flows Processed</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{stats?.total_flows?.toLocaleString() || '—'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, padding: '14px 18px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Alerts Generated</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{stats?.total_alerts?.toLocaleString() || '—'}</div>
        </div>
      </div>

      {/* Simulator Message */}
      {simMsg && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 20, background: 'var(--color-info-dim)', border: '1px solid var(--border-active)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-cyan)' }}>
          {simMsg}
        </div>
      )}

      {/* ── SIMULATOR QUICK-LAUNCH ──────────────────────────────────────────── */}
      <div style={{
        padding: 24, borderRadius: 12, marginBottom: 24,
        background: 'linear-gradient(180deg, rgba(239,68,68,0.04) 0%, transparent 100%)',
        border: `1px solid ${simRunning ? 'var(--accent-red)' : 'var(--border-color)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Radio size={16} style={{ color: simRunning ? 'var(--accent-red)' : C.textDim, animation: simRunning ? 'spin 3s linear infinite' : 'none' }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: simRunning ? 'var(--accent-red)' : C.textSec }}>
            {simRunning ? 'Simulator Active — Attacks Running Continuously' : 'Traffic Simulator — One-Click Attack Presets'}
          </span>
        </div>
        <p style={{ fontSize: 11, color: C.textDim, margin: '0 0 16px 0' }}>
          {simRunning
            ? `Running ${Object.keys(simMix).length} attack type(s). Click Stop when done. Alerts appear live on the dashboard.`
            : 'Starts the traffic simulator with a preset attack mix. Attacks run continuously at 10K flows/sec until stopped.'}
        </p>

        {simRunning && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {Object.entries(simMix).map(([type, pct]) => (
              <span key={type} style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.5px',
                background: 'var(--sev-critical-bg)', color: 'var(--accent-red)',
                border: '1px solid var(--sev-critical-border)',
              }}>{type} {pct}%</span>
            ))}
          </div>
        )}

        {!simRunning ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SIMULATOR_PRESETS.map(preset => (
              <button key={preset.label} onClick={() => handleSimPreset(preset.mix, preset.label)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--bg-primary)', border: `1px solid var(--border-color)`,
                color: C.text, fontSize: 12, fontWeight: 600,
                transition: 'all 0.15s ease', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${preset.accent}55`; e.currentTarget.style.boxShadow = `0 0 12px ${preset.accent}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <Play size={14} style={{ color: preset.accent, flexShrink: 0 }} />
                <div>
                  <div>{preset.label}</div>
                  <div style={{ fontSize: 10, color: C.textDim, fontWeight: 400, marginTop: 1 }}>{preset.desc}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSimStop} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--sev-critical-bg)', border: '1px solid var(--sev-critical-border)',
              color: 'var(--accent-red)', fontSize: 12, fontWeight: 700,
              fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              <Square size={14} /> Stop Simulator
            </button>
            <div style={{
              padding: '10px 16px', borderRadius: 8,
              background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.textSec,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 1.5s ease infinite' }} />
              <span style={{ fontFamily: MONO }}>10,000 flows/sec · {Object.keys(simMix).length} attack vectors</span>
            </div>
          </div>
        )}
      </div>

      {/* ── INDIVIDUAL ATTACK + RESULTS ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Attack Configuration */}
        <div style={{ padding: 24, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Single Attack Launch
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
              Attack Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {ATTACK_TYPES.map(attack => {
                const Icon = attack.icon;
                const isSelected = form.attackType === attack.id;
                const sc = SEVERITY_COLORS[attack.severity];
                return (
                  <button key={attack.id} onClick={() => setForm(f => ({ ...f, attackType: attack.id }))} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    background: isSelected ? sc.bg : C.surfaceHi, border: `1px solid ${isSelected ? sc.border : C.border}`,
                    color: isSelected ? sc.text : C.textSec, fontSize: 12, fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}>
                    <Icon size={14} /><span>{attack.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Target IP</label>
              <input type="text" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'monospace', outline: 'none',
              }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Target Port</label>
              <input type="text" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'monospace', outline: 'none',
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Duration (seconds)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} min={1} max={120} style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'monospace', outline: 'none',
              }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Intensity: {Math.round(form.intensity * 100)}%</label>
              <input type="range" min={0.1} max={1} step={0.1} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: parseFloat(e.target.value) }))} style={{ width: '100%', marginTop: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textDim, marginTop: 2 }}><span>Low</span><span>Medium</span><span>High</span></div>
            </div>
          </div>

          {selectedType && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: sevColor.bg, border: `1px solid ${sevColor.border}` }}>
              <div style={{ fontSize: 12, color: sevColor.text, fontWeight: 600, marginBottom: 2 }}>{selectedType.label}</div>
              <div style={{ fontSize: 11, color: C.textSec }}>{selectedType.desc}</div>
            </div>
          )}

          <button onClick={handleLaunch} disabled={launching || !backendOnline} style={{
            width: '100%', padding: '12px 20px', borderRadius: 8, cursor: launching || !backendOnline ? 'not-allowed' : 'pointer',
            background: launching ? C.border : `linear-gradient(135deg, ${C.red}, ${C.orange})`,
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: backendOnline ? 1 : 0.5, transition: 'all 0.2s ease',
          }}>
            {launching ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Launching...</> : <><Play size={16} /> Launch Attack</>}
          </button>

          {!backendOnline && <p style={{ fontSize: 11, color: C.textDim, textAlign: 'center', marginTop: 8 }}>Backend offline — connect to launch attacks</p>}
        </div>

        {/* Results Panel */}
        <div style={{ padding: 24, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Attack Result</h2>
            {activeAttacks.length > 0 && (
              <button onClick={handleStopAll} style={{
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.5px',
                background: 'var(--sev-critical-bg)', border: '1px solid var(--sev-critical-border)', color: 'var(--accent-red)',
              }}><Square size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Stop All</button>
            )}
          </div>

          {activeAttacks.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Active Attacks ({activeAttacks.length})
              </div>
              {activeAttacks.map((attack: any, i: number) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 6, marginBottom: 4, background: C.surfaceHi, border: `1px solid ${C.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{attack.attack_type || attack.type || 'Unknown'}</span>
                    <span style={{ fontSize: 11, color: C.textDim, marginLeft: 8 }}>{attack.src_ip}:{attack.src_port || '?'}</span>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--accent-red)', textTransform: 'uppercase' }}>● ACTIVE</span>
                </div>
              ))}
            </div>
          )}

          {lastResult && (
            <div style={{
              padding: 16, borderRadius: 8,
              background: lastResult.status === 'success' || lastResult.simulator_running ? 'var(--color-success-dim)' : 'var(--color-danger-dim)',
              border: `1px solid ${lastResult.status === 'success' || lastResult.simulator_running ? 'var(--color-success)' : 'var(--color-danger)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  background: lastResult.status === 'success' || lastResult.simulator_running ? 'var(--color-success-dim)' : 'var(--color-danger-dim)',
                  color: lastResult.status === 'success' || lastResult.simulator_running ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {lastResult.status}
                </span>
                <span style={{ fontSize: 12, color: C.textSec }}>{lastResult.message}</span>
              </div>
              {Object.keys(lastResult.attack_mix || {}).length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {Object.entries(lastResult.attack_mix).map(([k, v]) => (
                    <span key={k} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: MONO, background: 'var(--sev-critical-bg)', color: 'var(--accent-red)', border: '1px solid var(--sev-critical-border)' }}>{k} {v}%</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 10, color: C.textDim }}>
                {lastResult.simulator_running ? 'Simulator running — attacks continuous' : `Attack ID: ${lastResult.attack_id || 'N/A'}`}
              </div>
            </div>
          )}

          {!lastResult && !simRunning && (
            <div style={{ padding: 24, borderRadius: 8, background: C.surfaceHi, border: `1px dashed ${C.border}`, textAlign: 'center' }}>
              <Activity size={24} style={{ color: C.textDim, marginBottom: 8 }} />
              <p style={{ fontSize: 12, color: C.textSec, margin: '0 0 4px 0' }}>No attacks launched yet</p>
              <p style={{ fontSize: 11, color: C.textDim, margin: 0 }}>Use a simulator preset above or configure a single attack</p>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Detection Coverage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Volumetric DDoS', types: 'SYN flood, UDP flood', color: C.red },
                { label: 'C2 Beaconing', types: 'Periodic callbacks, JA3 fingerprinting', color: C.orange },
                { label: 'DNS Threats', types: 'DGA domains, DNS tunneling', color: C.amber },
                { label: 'TLS Anomaly', types: 'JA3/JA4 fingerprint analysis', color: C.purple },
                { label: 'Reconnaissance', types: 'Port scanning, fan-out detection', color: C.teal },
                { label: 'Data Exfiltration', types: 'Volume asymmetry, outbound anomalies', color: C.pink },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: C.surfaceHi }}>
                  <Shield size={12} style={{ color: item.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: C.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.types}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 8, background: C.surfaceHi, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} style={{ color: C.accent }} />
            <span style={{ fontSize: 12, color: C.textSec }}>
              Detections appear in real-time on the <span style={{ color: C.accent, fontWeight: 600 }}>Live Threats</span> page
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .attack-type-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 0 6px var(--color-accent-dim); }
        .attack-type-btn:active:not(:disabled) { filter: brightness(0.95); transform: scale(0.98); }
        .attack-type-btn:focus-visible { outline: 2px solid var(--border-active); outline-offset: 1px; }
        input[type="range"] { -webkit-appearance: none; height: 4px; background: ${C.border}; border-radius: 2px; outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: ${C.accent}; border-radius: 50%; cursor: pointer; transition: box-shadow 0.15s ease; }
        input[type="range"]::-webkit-slider-thumb:hover { box-shadow: 0 0 6px var(--color-accent-dim); }
      `}</style>
    </div>
  );
};

const MONO = '"JetBrains Mono",monospace';

export default AttackConsole;
