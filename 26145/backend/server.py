"""
Lightweight cyber threat detection dashboard backend.
Generates realistic dummy data — no ML models, no heavy processing.
Designed for Dokploy deployment on limited resources.
"""

import os, sys, time, threading, uuid, json, asyncio, logging, random
from pathlib import Path
from collections import deque
from typing import Any

import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, str(Path(__file__).resolve().parent))
project_root = Path(__file__).resolve().parent
_frontend_dist = project_root / "frontend" / "dist"

app = FastAPI(title="EKADHARA Threat Detection", version="3.2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if _frontend_dist.exists():
    # Mount whatever static dirs exist (assets/ or static/)
    for sub in ("assets", "static"):
        d = _frontend_dist / sub
        if d.exists():
            app.mount(f"/{sub}", StaticFiles(directory=str(d)), name=sub)

# ── State ──────────────────────────────────────────────────────────────────
_start_time = time.time()
_flows_processed = 0
_alerts_generated = 0
_sim_running = False
_sim_thread = None
_sim_stop = threading.Event()

_recent_alerts: deque = deque(maxlen=500)

# ── Dummy data generators ──────────────────────────────────────────────────
ATTACK_TYPES = [
    "syn_flood", "udp_flood", "c2_beaconing", "dns_tunnel",
    "port_scan", "dga_domains", "data_exfiltration",
]

THREAT_CLASSES = {
    "syn_flood": "ddos",
    "udp_flood": "ddos",
    "c2_beaconing": "beaconing",
    "dns_tunnel": "dns_tunneling",
    "port_scan": "port_scan",
    "dga_domains": "dga",
    "data_exfiltration": "exfiltration",
}

SEVERITIES = {
    "syn_flood": "critical",
    "udp_flood": "critical",
    "c2_beaconing": "high",
    "dns_tunnel": "high",
    "port_scan": "medium",
    "dga_domains": "high",
    "data_exfiltration": "critical",
}

def _rand_ip() -> str:
    return f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def _make_alert(attack_type: str) -> dict:
    tid = THREAT_CLASSES.get(attack_type, attack_type)
    sev = SEVERITIES.get(attack_type, "medium")
    conf = round(random.uniform(0.72, 0.99), 2)
    evidence = {
        "window_sec": random.choice([30, 60, 120]),
        "flows_analyzed": random.randint(50, 5000),
        "validity": random.choice(["MEASURED", "ESTIMATED"]),
    }
    if attack_type == "syn_flood":
        evidence.update({"pkt_rate": random.randint(500, 8000), "src_entropy": round(random.uniform(4, 8), 2), "syn_ack_ratio": round(random.uniform(8, 50), 1)})
    elif attack_type == "udp_flood":
        evidence.update({"pkt_rate": random.randint(200, 5000), "dst_entropy": round(random.uniform(3, 8), 2), "avg_payload_bytes": random.randint(100, 1500)})
    elif attack_type == "c2_beaconing":
        evidence.update({"beacon_interval_std": round(random.uniform(0.2, 2), 2), "jitter_pct": round(random.uniform(1, 10), 1), "dst_consistency": round(random.uniform(0.8, 0.99), 2)})
    elif attack_type == "dns_tunnel":
        evidence.update({"query_entropy": round(random.uniform(4, 7), 2), "avg_query_len": random.randint(40, 150), "txt_record_pct": round(random.uniform(20, 70), 1)})
    elif attack_type == "port_scan":
        evidence.update({"unique_ports_hit": random.randint(5, 25), "fan_ratio": round(random.uniform(0.3, 0.9), 2)})
    elif attack_type == "dga_domains":
        evidence.update({"entropy_score": round(random.uniform(3.5, 7), 2), "unique_domains": random.randint(20, 200)})
    elif attack_type == "data_exfiltration":
        evidence.update({"exfil_bytes": random.randint(50000, 5000000), "channel": random.choice(["DNS", "HTTP", "ICMP", "TLS"])})

    return {
        "id": str(uuid.uuid4())[:8],
        "timestamp": time.time(),
        "flow_id": "",
        "threat_class": tid,
        "threat_type": attack_type,
        "severity": sev,
        "confidence": conf,
        "src_ip": _rand_ip(),
        "dst_ip": _rand_ip(),
        "evidence": evidence,
        "validity": evidence["validity"],
        "flow_count": evidence["flows_analyzed"],
    }

# ── WebSocket manager ──────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, msg: dict):
        for ws in list(self.active):
            try:
                await ws.send_json(msg)
            except Exception:
                self.disconnect(ws)

manager = ConnectionManager()

# ── Background simulator ──────────────────────────────────────────────────
def _sim_loop():
    """Generate flows and occasional alerts at realistic rates."""
    global _flows_processed
    batch = 0
    while not _sim_stop.is_set():
        # Generate a batch of flows
        n = random.randint(80, 300)
        _flows_processed += n
        batch += 1

        # Maybe generate an alert (every ~3rd batch)
        if random.random() < 0.35:
            atype = random.choice(ATTACK_TYPES)
            alert = _make_alert(atype)
            _recent_alerts.append(alert)
            global _alerts_generated
            _alerts_generated += 1

            # Broadcast via WS
            try:
                loop = asyncio.new_event_loop()
                loop.run_until_complete(manager.broadcast({"type": "alert", "data": alert}))
                loop.close()
            except Exception:
                pass

        time.sleep(random.uniform(0.8, 2.5))


def _start_sim():
    global _sim_running, _sim_thread
    if _sim_running:
        return
    _sim_stop.clear()
    _sim_thread = threading.Thread(target=_sim_loop, daemon=True)
    _sim_thread.start()
    _sim_running = True


def _stop_sim():
    global _sim_running
    _sim_stop.set()
    _sim_running = False


# Start simulator automatically
_start_sim()

# ── REST endpoints ─────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    elapsed = time.time() - _start_time
    return {
        "status": "ok",
        "uptime": round(elapsed, 1),
        "flows_processed": _flows_processed,
        "alerts_generated": _alerts_generated,
        "active_connections": len(manager.active),
        "models_loaded": False,
        "mode": "lightweight-dummy",
    }


@app.get("/api/stats")
async def get_stats():
    elapsed = max(time.time() - _start_time, 0.1)
    fps = _flows_processed / elapsed

    # Build threats_per_type from recent alerts
    type_counts: dict[str, int] = {}
    confs = []
    for a in _recent_alerts:
        t = a.get("threat_type", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1
        confs.append(a.get("confidence", 0.0))

    avg_conf = round(sum(confs) / len(confs), 4) if confs else 0.0

    return {
        "total_flows": _flows_processed,
        "total_alerts": _alerts_generated,
        "threats_per_type": type_counts,
        "avg_confidence": avg_conf,
        "flows_per_sec": round(fps, 2),
        "uptime_sec": round(elapsed, 1),
        "simulator_running": _sim_running,
    }


@app.get("/api/alerts")
async def get_alerts(limit: int = 50, offset: int = 0, threat_type: str = ""):
    alerts = list(_recent_alerts)
    alerts.sort(key=lambda a: a["timestamp"], reverse=True)
    if threat_type:
        alerts = [a for a in alerts if a["threat_type"] == threat_type]
    total = len(alerts)
    return {
        "alerts": alerts[offset:offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/threat-types")
async def get_threat_types():
    return {
        "threat_types": [
            {"id": "ddos", "name": "DDoS Attack", "description": "SYN/UDP flood detection", "severity": "critical"},
            {"id": "beaconing", "name": "C2 Beaconing", "description": "Command & Control beaconing", "severity": "high"},
            {"id": "dns_tunneling", "name": "DNS Tunneling", "description": "Exfil via DNS queries", "severity": "high"},
            {"id": "port_scan", "name": "Port Scanning", "description": "Reconnaissance detection", "severity": "medium"},
            {"id": "dga", "name": "DGA Domains", "description": "Algorithmically generated domains", "severity": "high"},
            {"id": "exfiltration", "name": "Data Exfiltration", "description": "Unusual outbound data volume", "severity": "critical"},
        ]
    }


@app.get("/api/diode/status")
async def diode_status():
    return {
        "mode": "full_duplex",
        "status": "operational",
        "data_transferred_mb": round(random.uniform(100, 5000), 1),
        "integrity_ok": True,
    }


@app.get("/api/demo/status")
async def demo_status():
    return {
        "simulator_running": _sim_running,
        "flows_generated": _flows_processed,
        "alerts_generated": _alerts_generated,
        "active_attacks": [],
    }


@app.post("/api/demo/start")
async def demo_start(request: Request):
    body = {}
    try:
        body = await request.json() or {}
    except Exception:
        pass
    _start_sim()
    return {"status": "started", "simulator_running": True, "attack_mix": body.get("attack_mix", {}), "message": "Lightweight simulator started."}


@app.post("/api/demo/stop")
async def demo_stop():
    _stop_sim()
    return {"status": "stopped", "simulator_running": False}


@app.post("/api/demo/alert")
async def demo_alert(request: Request):
    body = {}
    try:
        body = await request.json() or {}
    except Exception:
        pass
    attack_type = body.get("attack_type", "syn_flood")
    count = min(int(body.get("count", 1)), 10)
    alerts = []
    for _ in range(count):
        a = _make_alert(attack_type)
        _recent_alerts.append(a)
        global _alerts_generated
        _alerts_generated += 1
        alerts.append(a)
        try:
            loop = asyncio.new_event_loop()
            loop.run_until_complete(manager.broadcast({"type": "alert", "data": a}))
            loop.close()
        except Exception:
            pass
    return {"status": "injected", "attack_type": attack_type, "count": len(alerts), "alerts": alerts}


@app.post("/api/attack/launch")
async def attack_launch(request: Request):
    body = {}
    try:
        body = await request.json() or {}
    except Exception:
        pass
    attack_type = body.get("attack_type", "syn_flood")
    duration = float(body.get("duration", 10))
    attack_id = f"{attack_type}_{int(time.time())}"
    # Generate alerts during the attack
    def _run_attack():
        end = time.time() + duration
        while time.time() < end and not _sim_stop.is_set():
            a = _make_alert(attack_type)
            _recent_alerts.append(a)
            global _alerts_generated, _flows_processed
            _alerts_generated += 1
            _flows_processed += random.randint(100, 1000)
            try:
                loop = asyncio.new_event_loop()
                loop.run_until_complete(manager.broadcast({"type": "alert", "data": a}))
                loop.close()
            except Exception:
                pass
            time.sleep(random.uniform(0.3, 1.0))
    t = threading.Thread(target=_run_attack, daemon=True)
    t.start()
    return {"status": "launched", "attack_id": attack_id, "attack_type": attack_type, "target": "127.0.0.1", "duration": duration}


@app.post("/api/attack/stop")
async def attack_stop():
    return {"status": "stopped", "active_attacks": []}


@app.post("/api/reset")
async def reset_state():
    global _flows_processed, _alerts_generated, _start_time, _sim_running
    _flows_processed = 0
    _alerts_generated = 0
    _recent_alerts.clear()
    _start_time = time.time()
    _sim_running = False
    _sim_stop.set()
    return {"status": "reset", "message": "All state cleared — dashboard is fresh. Use /api/demo/start to begin."}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        def _build_stats():
            elapsed = max(time.time() - _start_time, 0.1)
            type_counts: dict[str, int] = {}
            confs = []
            for a in _recent_alerts:
                t = a.get("threat_type", "unknown")
                type_counts[t] = type_counts.get(t, 0) + 1
                confs.append(a.get("confidence", 0.0))
            avg_conf = round(sum(confs) / len(confs), 4) if confs else 0.0
            return {
                "total_flows": _flows_processed,
                "total_alerts": _alerts_generated,
                "threats_per_type": type_counts,
                "avg_confidence": avg_conf,
                "flows_per_sec": round(_flows_processed / elapsed, 2),
                "active_connections": len(manager.active),
                "uptime_sec": round(elapsed, 1),
                "throughput": round(_flows_processed / elapsed, 2),
                "simulator_running": _sim_running,
            }

        # Send initial stats
        await ws.send_json({"type": "stats", "data": _build_stats()})
        while True:
            await asyncio.sleep(2)
            await ws.send_json({"type": "stats", "data": _build_stats()})
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ── Frontend SPA fallback ──────────────────────────────────────────────────
@app.get("/")
async def serve_index():
    idx = _frontend_dist / "index.html"
    if idx.exists():
        return FileResponse(str(idx))
    return {"message": "EKADHARA backend running. Deploy frontend to /frontend/dist"}


@app.get("/{full_path:path}")
async def serve_frontend(request: Request, full_path: str):
    # Skip API routes
    if full_path.startswith("api/") or full_path.startswith("static/"):
        return {"error": "not found"}
    filepath = _frontend_dist / full_path
    if full_path and filepath.exists() and filepath.is_file():
        return FileResponse(str(filepath))
    idx = _frontend_dist / "index.html"
    if idx.exists():
        return FileResponse(str(idx))
    return {"error": "not found"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
