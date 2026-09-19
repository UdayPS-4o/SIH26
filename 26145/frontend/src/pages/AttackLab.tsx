/* AttackLab.tsx — Cyber Range Command
   Wave-based attack/defense game.
   Standalone full-screen experience. No main app chrome.
*/

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Shield, ShieldOff, Scan, Radio, Lock, Globe, Download, Zap,
  Activity, AlertTriangle, CheckCircle, Crosshair, Play, SkipForward,
  X, ChevronRight, Flame, Bug, Eye, Gauge, Wifi, Server,
} from 'lucide-react';
import './AttackLab.css';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface TerminalLine {
  id: number;
  ts: string;
  prefix: string;
  text: string;
  type: 'info'|'success'|'warning'|'danger'|'event'|'system'|'demo';
}

interface AttackInstance {
  id: string;
  typeId: string;
  name: string;
  mitre: string;
  srcIp: string;
  progress: number;
  blocked: boolean;
  breached: boolean;
  active: boolean;
  timestamp: number;
}

interface DefenseDeployment {
  defId: string;
  name: string;
  counters: string[];
  deployedAt: number;
}

interface ComboPopup {
  id: number;
  count: number;
  x: number;
  y: number;
}

interface Toast {
  id: number;
  text: string;
  type: 'success'|'danger'|'warning';
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAME DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFENSES = [
  { id:'syn_limiter',    name:'SYN Rate Limiter',     counters:['syn_flood'],          icon:'Zap',       cost:2, desc:'Rate-limits TCP SYNs per second' },
  { id:'dns_analyzer',   name:'DNS Query Analyzer',   counters:['dga_domain','dns_tunnel'], icon:'Globe',   cost:2, desc:'Detects DGA domains & DNS tunnels' },
  { id:'beacon_detector',name:'Beacon Detector',      counters:['c2_beacon','tls_beacon'],   icon:'Radio',   cost:2, desc:'Flags periodic C2 heartbeat traffic' },
  { id:'udp_filter',     name:'UDP Filter',           counters:['udp_flood'],          icon:'Shield',    cost:1, desc:'Drops suspicious UDP datagram floods' },
  { id:'port_sensor',    name:'Port Scan Sensor',     counters:['port_scan'],          icon:'Scan',      cost:1, desc:'Alerts on sequential port probes' },
  { id:'tls_inspector',  name:'TLS Inspector',        counters:['tls_beacon'],         icon:'Lock',      cost:2, desc:'JA3 fingerprint & anomaly detection' },
  { id:'exfil_monitor',  name:'Exfil Monitor',        counters:['data_exfil'],         icon:'Download',  cost:2, desc:'Monitors asymmetric outbound transfers' },
  { id:'honeypot',       name:'Honeypot',             counters:['syn_flood','udp_flood','c2_beacon','dga_domain','dns_tunnel','port_scan','data_exfil','tls_beacon'], icon:'Bug', cost:3, desc:'Reduces ALL attack speeds by 30%' },
];

const ATTACK_DEFS: Record<string, { name: string; mitre: string; color: string; srcBase: string }> = {
  syn_flood:  { name:'SYN Flood',      mitre:'T1498',    color:'#dc3545', srcBase:'203.0.113' },
  udp_flood:  { name:'UDP Flood',      mitre:'T1498',    color:'#e0553c', srcBase:'203.0.114' },
  c2_beacon:  { name:'C2 Beaconing',   mitre:'T1071.001',color:'#7a9e3a', srcBase:'203.0.115' },
  dga_domain: { name:'DGA Domains',    mitre:'T1568.002',color:'#8fa347', srcBase:'203.0.116' },
  dns_tunnel: { name:'DNS Tunnel',     mitre:'T1071.004',color:'#6a8c40', srcBase:'203.0.117' },
  port_scan:  { name:'Port Scan',      mitre:'T1046',    color:'#d4a017', srcBase:'203.0.118' },
  data_exfil: { name:'Data Exfil',     mitre:'T1041',    color:'#dc3545', srcBase:'203.0.119' },
  tls_beacon: { name:'TLS Anomaly',    mitre:'T1071.001',color:'#7a9e3a', srcBase:'203.0.120' },
};

const WAVE_CONFIG = [
  { num:1, attacks:['syn_flood'],                              budget:4, label:'WAVE 1', desc:'SYN Flood detected — establish perimeter',                    countdown:3 },
  { num:2, attacks:['syn_flood','udp_flood'],                  budget:5, label:'WAVE 2', desc:'Multiple vectors — UDP amplification active',                 countdown:3 },
  { num:3, attacks:['syn_flood','udp_flood','c2_beacon'],      budget:6, label:'WAVE 3', desc:'C2 beaconing detected — lateral movement',                   countdown:3 },
  { num:4, attacks:['syn_flood','udp_flood','c2_beacon','dga_domain','dns_tunnel'], budget:7, label:'WAVE 4', desc:'DNS exfiltration via DGA domains',                    countdown:3 },
  { num:5, attacks:['syn_flood','udp_flood','c2_beacon','dga_domain','dns_tunnel','port_scan','data_exfil','tls_beacon'], budget:8, label:'WAVE 5', desc:'ALL THREATS — full spectrum assault',                        countdown:3 },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Zap: Zap, Globe: Globe, Radio: Radio, Lock: Lock, Scan: Scan,
  Download: Download, Shield: Shield, Bug: Bug,
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════════ */

function randIp(base: string): string {
  return `${base}.${Math.floor(Math.random()*254)+1}`;
}

function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function nowTs(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const AttackLab: React.FC = () => {
  /* ── Game State ─────────────────────────────────────────────────────────── */
  const [screen, setScreen] = useState<'menu'|'playing'|'victory'|'defeat'>('menu');
  const [waveIndex, setWaveIndex] = useState(0);
  const waveIndexRef = useRef(0);
  const [waveStartTime, setWaveStartTime] = useState(0);
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [budget, setBudget] = useState(0);
  const [budgetMax, setBudgetMax] = useState(0);
  const [attacks, setAttacks] = useState<AttackInstance[]>([]);
  const [defenses, setDefenses] = useState<DefenseDeployment[]>([]);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownVal, setCountdownVal] = useState(0);
  const [waveBanner, setWaveBanner] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const [combos, setCombos] = useState<ComboPopup[]>([]);
  const [blockedTotal, setBlockedTotal] = useState(0);
  const [breachedTotal, setBreachedTotal] = useState(0);
  const [waveTimeLeft, setWaveTimeLeft] = useState(60);
  const [honeypotActive, setHoneypotActive] = useState(false);

  /* ── Refs ──────────────────────────────────────────────────────────────── */
  const terminalRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);
  const waveTimerRef = useRef<number>(0);
  const waveTimeoutRef = useRef<number[]>([]);
  const soundRef = useRef<{ beep: ()=>void }>({ beep: () => {} });

  /* ── Toast helper ──────────────────────────────────────────────────────── */
  const addToast = useCallback((text: string, type: Toast['type']) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, text, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  /* ── Combo helper ──────────────────────────────────────────────────────── */
  const showCombo = useCallback((x: number, y: number, count: number) => {
    const id = Date.now() + Math.random();
    setCombos(p => [...p, { id, count, x, y }]);
    setTimeout(() => setCombos(p => p.filter(c => c.id !== id)), 1000);
  }, []);

  /* ── Terminal helper ───────────────────────────────────────────────────── */
  const addLine = useCallback((text: string, type: TerminalLine['type'] = 'info', prefix?: string) => {
    const pfxs: Record<string,string> = {
      info:'›', success:'✓', warning:'⚠', danger:'✗', event:'◆', system:'◈', demo:'▶',
    };
    const line: TerminalLine = {
      id: Date.now() + Math.random(),
      ts: nowTs(),
      prefix: prefix || pfxs[type] || '›',
      text,
      type,
    };
    setTerminalLines(p => [line, ...p].slice(0, 200));
  }, []);

  /* ── Auto-scroll terminal ──────────────────────────────────────────────── */
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  }, [terminalLines]);

  /* ── Simple beep (visual feedback, no audio needed) ────────────────────── */
  const flashScreen = useCallback((borderColor: string) => {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:99;border:2px solid ${borderColor};animation:arc-fade-in 0.5s ease-out forwards;`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 600);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
     GAME MECHANICS
     ══════════════════════════════════════════════════════════════════════════ */

  /* ── Check if any active defense counters this attack ─────────────────── */
  const isBlocked = useCallback((attackTypeId: string): boolean => {
    // Honeypot blocks everything partially
    if (honeypotActive) {
      // Honeypot doesn't fully block, it just slows — check specific defenses too
      const specificBlock = defenses.some(d =>
        d.defId !== 'honeypot' && d.defId !== 'tls_inspector'
          ? d.counters.includes(attackTypeId)
          : false
      );
      if (specificBlock) return true;
      // Honeypot alone slows but doesn't fully block for most attacks
      // For some attacks, honeypot alone can block
      return false;
    }
    return defenses.some(d => d.counters.includes(attackTypeId));
  }, [defenses, honeypotActive]);

  /* ── Get progress speed modifier ──────────────────────────────────────── */
  const getSpeed = useCallback((attackTypeId: string): number => {
    let speed = 1;
    if (honeypotActive) speed *= 0.7;
    // Port scanner gets slowed by port_sensor
    if (attackTypeId === 'port_scan' && defenses.some(d => d.defId === 'port_sensor')) speed *= 0.5;
    return speed;
  }, [defenses, honeypotActive]);

  /* ── Deploy a defense ──────────────────────────────────────────────────── */
  const deployDefense = useCallback((def: typeof DEFENSES[0]) => {
    if (screen !== 'playing') return;
    if (defenses.some(d => d.defId === def.id)) return;
    if (budget < def.cost) {
      addToast('Insufficient defense points!', 'danger');
      return;
    }

    setBudget(p => p - def.cost);
    setDefenses(p => [...p, { defId: def.id, name: def.name, counters: def.counters, deployedAt: Date.now() }]);

    addLine(`DEPLOY: ${def.name} activated (cost: ${def.cost} pts)`, 'success', '🛡');
    flashScreen('rgba(56,184,124,0.4)');

    if (def.id === 'honeypot') {
      setHoneypotActive(true);
      addLine('HONEYPOT ACTIVE — All attack speeds reduced by 30%', 'warning', '🍯');
    }

    addToast(`${def.name} deployed`, 'success');
  }, [screen, defenses, budget, addLine, flashScreen, addToast]);

  /* ── Start a wave ──────────────────────────────────────────────────────── */
  const startWave = useCallback((wi: number) => {
    waveIndexRef.current = wi;
    const cfg = WAVE_CONFIG[wi];
    setWaveIndex(wi);
    setBudget(cfg.budget);
    setBudgetMax(cfg.budget);
    setDefenses([]);
    setHoneypotActive(false);
    setWaveStartTime(Date.now());
    setScreen('playing');
    setAttacks([]);
    setWaveTimeLeft(60);
    setTerminalLines([]);

    addLine(`═══════════════════════════════════════`, 'system');
    addLine(`${cfg.label} INITIATED`, 'danger');
    addLine(`${cfg.desc}`, 'warning');
    addLine(`Defense budget: ${cfg.budget} points | Wave duration: 60s`, 'info');
    addLine(`Attack vectors: ${cfg.attacks.length}`, 'info');
    addLine(`═══════════════════════════════════════`, 'system');
  }, [addLine]);

  /* ── Wave start with countdown ─────────────────────────────────────────── */
  const beginWave = useCallback((waveIdx: number) => {
    setShowCountdown(true);
    setCountdownVal(3);

    let count = 3;
    const iv = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(iv);
        setShowCountdown(false);
        setWaveBanner(WAVE_CONFIG[waveIdx].label);
        setTimeout(() => setWaveBanner(''), 2000);
        startWave(waveIdx);
      } else {
        setCountdownVal(count);
      }
    }, 800);
  }, [startWave]);

  /* ── Game Loop ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (screen !== 'playing') return;

    let lastTick = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      // Update wave timer
      const elapsed = (now - waveStartTime) / 1000;
      const remaining = Math.max(0, 60 - elapsed);
      setWaveTimeLeft(remaining);

      // Update attacks
      setAttacks(prev => {
        let changed = false;
        const next: AttackInstance[] = [];
        let waveComplete = true;
        let waveBlocked = 0;
        let waveBreached = 0;

        for (const atk of prev) {
          if (!atk.active) { next.push(atk); continue; }

          // Progress
          const speed = getSpeed(atk.typeId);
          const newProgress = Math.min(100, atk.progress + (dt * 100 * speed));
          changed = true;
          waveComplete = false;

          const nowBlocked = isBlocked(atk.typeId);

          if (!atk.blocked && nowBlocked && newProgress < 40) {
            // Blocked!
            const blocked = { ...atk, blocked: true, progress: newProgress, active: false };
            next.push(blocked);
            waveBlocked++;
            setBlockedTotal(p => p + 1);
            setScore(p => p + 100);
            setComboCount(p => {
              const nc = p + 1;
              if (nc >= 3 && nc % 3 === 0) {
                showCombo(window.innerWidth / 2, window.innerHeight / 2, nc);
                setScore(sp => sp + nc * 25);
                addLine(`COMBO x${nc}! Bonus +${nc * 25} pts`, 'event', '★');
              }
              return nc;
            });
            flashScreen('rgba(56,184,124,0.3)');
            addLine(`BLOCKED: ${atk.name} from ${atk.srcIp} — defense intercepted`, 'success', '✓');
          } else if (!atk.blocked && newProgress >= 100) {
            // Breached!
            const dmg = atk.typeId === 'data_exfil' ? 15 : atk.typeId === 'syn_flood' || atk.typeId === 'udp_flood' ? 10 : 8;
            const breached = { ...atk, breached: true, progress: 100, active: false };
            next.push(breached);
            waveBreached++;
            setBreachedTotal(p => p + 1);
            setHealth(p => {
              const nh = Math.max(0, p - dmg);
              if (nh <= 0) {
                addToast('INTEGRITY COMPROMISED', 'danger');
                setTimeout(() => setScreen('defeat'), 500);
              }
              return nh;
            });
            setComboCount(0);
            flashScreen('rgba(220,53,69,0.4)');
            addLine(`BREACH: ${atk.name} penetrated defenses! -${dmg} HP`, 'danger', '✗');
          } else {
            next.push({ ...atk, progress: newProgress });
          }
        }

        if (waveComplete && prev.length > 0) {
          // Wave complete!
          const timeBonus = Math.floor(remaining * 5);
          const blockBonus = waveBlocked * 50;
          const totalBonus = timeBonus + blockBonus;
          setScore(p => p + totalBonus);
          addLine(`WAVE CLEARED! Time bonus: +${timeBonus} | Block bonus: +${blockBonus}`, 'event', '★');

          if (waveIndexRef.current + 1 >= WAVE_CONFIG.length) {
            setTimeout(() => setScreen('victory'), 1200);
          } else {
            addLine(`Next wave in 3...`, 'warning');
            setTimeout(() => {
              addLine(`2...`, 'warning');
              setTimeout(() => {
                addLine(`1...`, 'warning');
                setTimeout(() => beginWave(waveIndexRef.current + 1), 1000);
              }, 1000);
            }, 1000);
          }
        }

        return next;
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [screen, waveIndex, waveStartTime, isBlocked, getSpeed, addLine, flashScreen, showCombo, addToast, beginWave]);

  /* ── Spawn attacks for current wave ────────────────────────────────────── */
  useEffect(() => {
    if (screen !== 'playing') return;

    const timeouts: number[] = [];
    const cfg = WAVE_CONFIG[waveIndex];

    cfg.attacks.forEach((attackType, i) => {
      // Stagger attack spawns
      const spawnDelay = 1500 + i * (4000 / cfg.attacks.length) + Math.random() * 2000;

      const t = window.setTimeout(() => {
        const def = ATTACK_DEFS[attackType];
        const atkId = `ATK-${Date.now().toString(36)}-${i}`;

        addLine(`THREAT DETECTED: ${def.name} from ${randIp(def.srcBase)} — MITRE ${def.mitre}`, 'danger', '⚠');

        setAttacks(prev => [...prev, {
          id: atkId,
          typeId: attackType,
          name: def.name,
          mitre: def.mitre,
          srcIp: randIp(def.srcBase),
          progress: 0,
          blocked: false,
          breached: false,
          active: true,
          timestamp: Date.now(),
        }]);
      }, spawnDelay);

      timeouts.push(t);
    });

    // End wave after 60s if not all attacks resolved
    const waveEndTimer = window.setTimeout(() => {
      setAttacks(prev => prev.map(a => a.active ? { ...a, active: false } : a));
    }, 60000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(waveEndTimer);
    };
  }, [waveIndex, screen, addLine]);

  /* ── Start / Restart Game ──────────────────────────────────────────────── */
  const handleStartGame = useCallback((startFromWave = 0) => {
    setHealth(100);
    setScore(0);
    setBlockedTotal(0);
    setBreachedTotal(0);
    setComboCount(0);
    setCombos([]);
    beginWave(startFromWave);
  }, [beginWave]);

  /* ── Menu screen ───────────────────────────────────────────────────────── */
  if (screen === 'menu') {
    return (
      <div className="arc-root">
        <div className="arc-grid" />
        <div className="arc-screen">
          <div className="arc-menu__logo" />
          <div className="arc-menu__title">Cyber Range<br/>Command</div>
          <div className="arc-menu__subtitle">Attack vs Defense Simulation · PS-26145</div>
          <div className="arc-menu__desc">
            Deploy defensive countermeasures against escalating attack waves.
            Each defense costs points. Block attacks before they breach your integrity.
            Survive all 5 waves to win.
          </div>
          <div className="arc-menu__rules">
            <div className="arc-menu__rules-title">Mission Briefing</div>
            <div className="arc-menu__rule">
              <span className="arc-menu__rule-icon">▸</span>
              <span>5 waves of escalating attacks — each wave introduces new threat types</span>
            </div>
            <div className="arc-menu__rule">
              <span className="arc-menu__rule-icon">▸</span>
              <span>Limited defense points per wave — choose your countermeasures wisely</span>
            </div>
            <div className="arc-menu__rule">
              <span className="arc-menu__rule-icon">▸</span>
              <span>Block attacks before their progress reaches 100% or lose integrity</span>
            </div>
            <div className="arc-menu__rule">
              <span className="arc-menu__rule-icon">▸</span>
              <span>Chain blocks for combo bonuses — every 3 blocks = extra points</span>
            </div>
            <div className="arc-menu__rule">
              <span className="arc-menu__rule-icon">▸</span>
              <span>Honeypot slows all attacks by 30% — great value, high cost</span>
            </div>
          </div>
          <div>
            <button className="arc-menu__btn" onClick={() => handleStartGame(0)}>
              <Play size={16} style={{ display:'inline', verticalAlign:'middle', marginRight:10 }} />
              Start Mission
            </button>
            <br/>
            <button className="arc-menu__btn arc-menu__btn--demo" onClick={() => handleStartGame(0)}>
              <SkipForward size={14} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />
              Skip to Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Victory Screen ────────────────────────────────────────────────────── */
  if (screen === 'victory') {
    return (
      <div className="arc-root">
        <div className="arc-grid" />
        <div className="arc-victory">
          <div className="arc-victory__icon">✓</div>
          <div className="arc-victory__title">All Threats Neutralized</div>
          <div className="arc-victory__sub">Network integrity maintained — all 5 waves survived</div>
          <div className="arc-stats-grid">
            <div className="arc-stat-card">
              <div className="arc-stat-card__value">{score}</div>
              <div className="arc-stat-card__label">Final Score</div>
            </div>
            <div className="arc-stat-card">
              <div className="arc-stat-card__value">{blockedTotal}</div>
              <div className="arc-stat-card__label">Threats Blocked</div>
            </div>
            <div className="arc-stat-card">
              <div className="arc-stat-card__value">{health}%</div>
              <div className="arc-stat-card__label">Integrity Remaining</div>
            </div>
          </div>
          <button className="arc-menu__btn" onClick={() => setScreen('menu')}>Return to Menu</button>
        </div>
      </div>
    );
  }

  /* ── Defeat Screen ─────────────────────────────────────────────────────── */
  if (screen === 'defeat') {
    return (
      <div className="arc-root">
        <div className="arc-grid" />
        <div className="arc-defeat">
          <div className="arc-defeat__icon">✗</div>
          <div className="arc-defeat__title">Integrity Compromised</div>
          <div className="arc-defeat__sub">System defenses breached at Wave {waveIndex + 1}</div>
          <div className="arc-stats-grid">
            <div className="arc-stat-card">
              <div className="arc-stat-card__value">{score}</div>
              <div className="arc-stat-card__label">Score</div>
            </div>
            <div className="arc-stat-card">
              <div className="arc-stat-card__value">{waveIndex + 1}/5</div>
              <div className="arc-stat-card__label">Wave Reached</div>
            </div>
            <div className="arc-stat-card">
              <div className="arc-stat-card__value">{blockedTotal}</div>
              <div className="arc-stat-card__label">Blocked</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="arc-menu__btn" onClick={() => setScreen('menu')}>Return to Menu</button>
            <button className="arc-btn" onClick={() => handleStartGame(waveIndex)}>Retry Wave</button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     GAMEPLAY SCREEN
     ══════════════════════════════════════════════════════════════════════════ */

  const currentWave = WAVE_CONFIG[waveIndex];
  const activeAttacks = attacks.filter(a => a.active);
  const waveProgress = activeAttacks.length === 0 && attacks.length > 0 ? 100 : 0;

  return (
    <div className="arc-root">
      <div className="arc-grid" />
      <div className="arc-scanline" />

      {/* Countdown overlay */}
      {showCountdown && (
        <div className="arc-countdown">
          <div className={`arc-countdown__number ${countdownVal === 0 ? 'arc-countdown__number--go' : ''}`}>
            {countdownVal === 0 ? 'GO' : countdownVal}
          </div>
        </div>
      )}

      {/* Wave banner */}
      {waveBanner && (
        <div className="arc-wave-banner">
          <div className="arc-wave-banner__title">{waveBanner}</div>
        </div>
      )}

      {/* Combo popups */}
      {combos.map(c => (
        <div key={c.id} className="arc-combo" style={{ left: c.x - 30, top: c.y }}>
          COMBO x{c.count}!
        </div>
      ))}

      {/* Toasts */}
      {toasts.map(t => (
        <div key={t.id} className={`arc-toast arc-toast--${t.type}`}>{t.text}</div>
      ))}

      {/* Shield flash */}
      {defenses.filter(d => d.defId !== 'honeypot').length > 0 && attacks.some(a => a.active && isBlocked(a.typeId)) && (
        <div style={{ position:'fixed', inset:0, border:'1px solid rgba(56,184,124,0.05)', pointerEvents:'none', zIndex:98 }} />
      )}

      {/* Return button */}
      <button className="arc-return" onClick={() => {
        cancelAnimationFrame(gameLoopRef.current);
        setScreen('menu');
      }}>
        ← Return to Watchtower
      </button>

      {/* Main layout */}
      <div className="arc-layout">

        {/* ═══ TOP BAR ═══ */}
        <div className="arc-topbar">
          <div className="arc-topbar__left">
            <div className="arc-topbar__logo">
              <div className="arc-topbar__logo-icon" />
            </div>
            <div>
              <div className="arc-topbar__title">CYBER RANGE COMMAND</div>
              <div className="arc-topbar__subtitle">PS-26145 · EKADHARA v3.2.1</div>
            </div>
          </div>

          <div className="arc-topbar__right">
            {/* Wave dots */}
            <div className="arc-wave-indicator">
              <span className="arc-wave-label">Wave</span>
              {WAVE_CONFIG.map((w, i) => {
                let cls = 'arc-wave-dot';
                if (i < waveIndex) cls += ' arc-wave-dot--done';
                else if (i === waveIndex) cls += ' arc-wave-dot--current';
                return <div key={i} className={cls} title={w.label} />;
              })}
              <span style={{ fontFamily:'var(--arc-hud)', fontSize:13, fontWeight:700, color:'var(--arc-amber)', marginLeft:6 }}>
                {currentWave.label}
              </span>
            </div>

            <div style={{ width:1, height:24, background:'var(--arc-border)' }} />

            {/* Timer */}
            <div className="arc-timer">
              <div className={`arc-timer__value ${waveTimeLeft < 15 ? 'arc-timer__value--danger' : waveTimeLeft < 30 ? 'arc-timer__value--warning' : ''}`}>
                {fmtTime(waveTimeLeft * 1000)}
              </div>
              <div className="arc-timer__label">Remaining</div>
            </div>

            <div style={{ width:1, height:24, background:'var(--arc-border)' }} />

            {/* Score */}
            <div className="arc-score">
              <span className="arc-score__label">Score</span>
              <span className="arc-score__value" key={score}>
                {score.toLocaleString()}
              </span>
            </div>

            <div style={{ width:1, height:24, background:'var(--arc-border)' }} />

            {/* Health */}
            <div className={`arc-health ${health < 25 ? 'arc-health__shake' : ''}`}>
              <span className="arc-health__label">Integrity</span>
              <div className="arc-health__bar">
                <div
                  className={`arc-health__fill ${health < 25 ? 'arc-health__fill--low' : health < 50 ? 'arc-health__fill--mid' : ''}`}
                  style={{ width: `${health}%` }}
                />
              </div>
              <span className="arc-health__value">{health}%</span>
            </div>
          </div>
        </div>

        {/* ═══ CENTER AREA — Radar/Game View ═══ */}
        <div className="arc-center">
          {/* Wave info */}
          <div className="arc-wave-info">
            <div className="arc-wave-info__title">{currentWave.desc}</div>
            <div className="arc-wave-info__desc">
              {currentWave.attacks.length} active vectors · {activeAttacks.length} incoming
            </div>
          </div>

          {/* Center visualization — network map style */}
          <div style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column', gap:16, padding:'40px 20px 80px',
          }}>
            {/* Radar circles */}
            <div style={{
              width: 300, height: 300, borderRadius:'50%',
              border: '1px solid var(--arc-border)',
              position: 'relative',
              opacity: 0.3,
            }}>
              <div style={{
                position:'absolute', inset:'33%', borderRadius:'50%',
                border: '1px solid var(--arc-border)',
              }} />
              <div style={{
                position:'absolute', inset:'66%', borderRadius:'50%',
                border: '1px solid var(--arc-border)',
              }} />
              <div style={{
                position:'absolute', top:'50%', left:0, right:0, height:1,
                background: 'var(--arc-border)',
              }} />
              <div style={{
                position:'absolute', left:'50%', top:0, bottom:0, width:1,
                background: 'var(--arc-border)',
              }} />

              {/* Defender node */}
              <div style={{
                position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                width:20, height:20, borderRadius:'50%',
                background: 'var(--arc-cyan)',
                boxShadow: '0 0 20px rgba(56,184,124,0.5)',
                animation: 'arc-logo-pulse 2s ease-in-out infinite',
              }} />

              {/* Active attack dots */}
              {activeAttacks.map((atk, i) => {
                const angle = (i / Math.max(1, activeAttacks.length)) * Math.PI * 2 - Math.PI / 2;
                const dist = 80 + Math.sin(Date.now() / 500 + i) * 15;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                const def = ATTACK_DEFS[atk.typeId];
                return (
                  <div key={atk.id} style={{
                    position:'absolute', top:'50%', left:'50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    width: 10, height: 10, borderRadius:'50%',
                    background: def.color,
                    boxShadow: `0 0 8px ${def.color}60`,
                    animation: 'arc-pulse-dot 1s ease-in-out infinite',
                  }}>
                    {isBlocked(atk.typeId) && (
                      <div style={{
                        position:'absolute', inset:-6,
                        borderRadius:'50%',
                        border: `1.5px solid var(--arc-cyan)`,
                        opacity: 0.5,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="arc-center-stats">
              <div className="arc-center-stat">
                <div className="arc-center-stat__value">{activeAttacks.length}</div>
                <div className="arc-center-stat__label">Active Threats</div>
              </div>
              <div className="arc-center-stat">
                <div className="arc-center-stat__value">{blockedTotal}</div>
                <div className="arc-center-stat__label">Blocked</div>
              </div>
              <div className="arc-center-stat">
                <div className="arc-center-stat__value" style={{ color:'var(--arc-red-bright)' }}>{breachedTotal}</div>
                <div className="arc-center-stat__label">Breached</div>
              </div>
              <div className="arc-center-stat">
                <div className="arc-center-stat__value">{defenses.length}</div>
                <div className="arc-center-stat__label">Defenses Up</div>
              </div>
              <div className="arc-center-stat">
                <div className="arc-center-stat__value" style={{ color:'var(--arc-amber)' }}>{budget}</div>
                <div className="arc-center-stat__label">Points Left</div>
              </div>
            </div>

            {/* Wave progress bar */}
            <div className="arc-wave-progress">
              <div
                className="arc-wave-progress__fill"
                style={{
                  width: `${activeAttacks.length === 0 && attacks.length > 0 ? 100 : (currentWave.attacks.length - activeAttacks.filter(a => a.active).length) / currentWave.attacks.length * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ═══ ATTACK FEED (Right) ═══ */}
        <div className="arc-attack-feed">
          <div className="arc-panel-header">
            <span>Incoming Attacks</span>
            <span className="arc-panel-header__count">{activeAttacks.length} active</span>
          </div>
          <div className="arc-attack-list">
            {attacks.filter(a => !a.active).map(a => {
              const def = ATTACK_DEFS[a.typeId];
              return (
                <div key={`${a.id}-done`} className={`arc-attack-entry ${a.breached ? 'arc-attack-entry--breach' : ''}`}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span className="arc-attack-entry__name">{a.name}</span>
                    <span className="arc-attack-entry__mitre">{a.mitre}</span>
                  </div>
                  <div className="arc-attack-entry__src">{a.srcIp}</div>
                  <div className="arc-attack-entry__progress-bar">
                    <div
                      className={`arc-attack-entry__progress-fill ${a.blocked ? 'arc-attack-entry__progress-fill--blocked' : ''}`}
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                  <div className={`arc-attack-entry__status ${a.blocked ? 'arc-attack-entry__status--blocked' : 'arc-attack-entry__status--breach'}`}>
                    {a.blocked ? '✓ BLOCKED' : '✗ BREACHED'} — {a.srcIp}
                  </div>
                </div>
              );
            })}
            {activeAttacks.map(atk => {
              const def = ATTACK_DEFS[atk.typeId];
              const blocked = isBlocked(atk.typeId);
              return (
                <div key={atk.id} className="arc-attack-entry">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span className="arc-attack-entry__name" style={{ color: def.color }}>{atk.name}</span>
                    <span className="arc-attack-entry__mitre">{atk.mitre}</span>
                  </div>
                  <div className="arc-attack-entry__src">{atk.srcIp}</div>
                  <div className="arc-attack-entry__progress-bar">
                    <div
                      className={`arc-attack-entry__progress-fill ${blocked ? 'arc-attack-entry__progress-fill--blocked' : ''}`}
                      style={{ width: `${atk.progress}%` }}
                    />
                  </div>
                  <div className={`arc-attack-entry__status ${blocked ? 'arc-attack-entry__status--blocked' : 'arc-attack-entry__status--active'}`}>
                    {blocked ? '◈ Countermeasures Active' : '◉ Approaching Target — ' + Math.floor(100 - atk.progress) + '%'}
                  </div>
                </div>
              );
            })}
            {attacks.length === 0 && (
              <div style={{ padding:20, textAlign:'center', color:'var(--arc-text-dim)', fontSize:10, letterSpacing:1 }}>
                Awaiting threat vectors...
              </div>
            )}
          </div>
        </div>

        {/* ═══ DEFENSE PANEL (Right) ═══ */}
        <div className="arc-defense-panel">
          <div className="arc-panel-header">
            <span>Deploy Defenses</span>
            <span className="arc-panel-header__count">{defenses.length} active</span>
          </div>

          {/* Budget display */}
          <div className="arc-budget">
            <span className="arc-budget__label">Points</span>
            <div className="arc-budget__points">
              {Array.from({ length: budgetMax }).map((_, i) => (
                <div
                  key={i}
                  className={`arc-budget__dot ${i < budgetMax - budget ? 'arc-budget__dot--spent' : ''}`}
                />
              ))}
            </div>
            <span className="arc-budget__dots-counter">{budget}</span>
          </div>

          {/* Active defenses */}
          {defenses.length > 0 && (
            <div className="arc-active-defenses">
              {defenses.map(d => (
                <span key={d.defId} className="arc-active-defense">{d.name}</span>
              ))}
            </div>
          )}

          {/* Defense buttons */}
          <div className="arc-defense-list">
            {DEFENSES.map(def => {
              const isDeployed = defenses.some(d => d.defId === def.id);
              const canAfford = budget >= def.cost;
              const Icon = ICON_MAP[def.icon] || Shield;

              return (
                <button
                  key={def.id}
                  className={[
                    'arc-defense-btn',
                    isDeployed ? 'arc-defense-btn--active' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={isDeployed || !canAfford || screen !== 'playing'}
                  onClick={() => deployDefense(def)}
                >
                  <div className="arc-defense-btn__icon">
                    <Icon size={14} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="arc-defense-btn__name">{def.name}</div>
                    <div className="arc-defense-btn__desc">{def.desc}</div>
                    <div className="arc-defense-btn__counter">
                      {def.counters.length === 8 ? 'Counters ALL attacks' : `Counters: ${def.counters.map(c => ATTACK_DEFS[c]?.name || c).join(', ')}`}
                    </div>
                  </div>
                  <span className="arc-defense-btn__cost">
                    {isDeployed ? '✓' : `${def.cost} pts`}
                  </span>
                  {isDeployed && <div className="arc-defense-flash" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ TERMINAL ═══ */}
        <div className="arc-terminal" ref={terminalRef}>
          <div className="arc-terminal__header">
            <div className="arc-terminal__dots">
              <div className="arc-terminal__dot arc-terminal__dot--red" />
              <div className="arc-terminal__dot arc-terminal__dot--yellow" />
              <div className="arc-terminal__dot arc-terminal__dot--green" />
            </div>
            <div className="arc-terminal__title">
              System Log — Wave {waveIndex + 1}/5 — {terminalLines.length} entries
            </div>
            <div style={{ width: 48 }} />
          </div>
          <div className="arc-terminal__body">
            {terminalLines.map(line => (
              <div key={line.id} className="arc-terminal__line">
                <span className="arc-terminal__ts">[{line.ts}]</span>
                <span className={`arc-terminal__prefix arc-terminal__text--${line.type}`}>{line.prefix}</span>
                <span className={`arc-terminal__text arc-terminal__text--${line.type}`}>{line.text}</span>
              </div>
            ))}
            {terminalLines.length === 0 && (
              <div>
                <span className="arc-terminal__ts">[{nowTs()}]</span>
                <span className="arc-terminal__text arc-terminal__text--info">Initializing wave protocol...</span>
                <span className="arc-cursor" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackLab;
