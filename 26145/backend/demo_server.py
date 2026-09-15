"""
Demo server — combines real packet capture, attack generation, and alert streaming.

WebSocket endpoints:
  /ws/dashboard   — dashboard stats (real packets + attacks)
  /ws/alerts      — threat alerts (real + simulated)
  /ws/attack      — attack control (launch/stop attacks)

REST endpoints:
  GET  /api/real-stats      — live capture statistics
  GET  /api/active-attacks  — list running attacks
  POST /api/attack/start    — launch an attack
  POST /api/attack/stop     — stop an attack
  GET  /api/interfaces      — list network interfaces

Usage:
  python demo_server.py                    # localhost only
  python demo_server.py --host 0.0.0.0     # all interfaces (for network access)
  HOST=0.0.0.0 PORT=8000 python demo_server.py
"""

import asyncio
import json
import logging
import os
import sys
import threading
import time
from collections import deque
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Ensure backend package is importable when running as a script
# ---------------------------------------------------------------------------

_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

_frontend_dist = _project_root / "frontend" / "dist"

from backend.real_capture import FlowTable, PacketSniffer, DetectedAlert, SCAPY_AVAILABLE
from backend.attack_gen import controller as attack_controller

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="EKADHARA — Real-time Threat Detection",
    description="AI-based cyber threat detection with real packet capture and attack simulation",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

_start_time: float = time.time()
_real_alerts: deque = deque(maxlen=500)
_simulated_alerts: deque = deque(maxlen=500)
_stats = {
    "total_packets": 0,
    "total_bytes": 0,
    "active_flows": 0,
    "alerts_generated": 0,
    "attacks_launched": 0,
}
_lock = threading.Lock()

# Real capture components
_sniffer: PacketSniffer | None = None
_sniffer_lock = threading.Lock()

# WebSocket connections
_dashboard_clients: set[WebSocket] = set()
_alert_clients: set[WebSocket] = set()
_attack_clients: set[WebSocket] = set()

# Simulated traffic for when real capture isn't running
_sim_thread: threading.Thread | None = None
_sim_stop = threading.Event()


# ---------------------------------------------------------------------------
# Alert handling
# ---------------------------------------------------------------------------


def _on_alert(alert: DetectedAlert) -> None:
    """Called when the capture engine detects a threat."""
    with _lock:
        _real_alerts.appendleft(alert)
        _stats["alerts_generated"] += 1

    # Push to WebSocket clients
    msg = json.dumps({
        "type": "real_alert",
        "data": {
            "id": alert.id,
            "timestamp": alert.timestamp,
            "threat_type": alert.threat_type,
            "confidence": round(alert.confidence, 3),
            "severity": alert.severity,
            "src_ip": alert.src_ip,
            "dst_ip": alert.dst_ip,
            "src_port": alert.src_port,
            "dst_port": alert.dst_port,
            "protocol": alert.protocol,
            "evidence": alert.evidence,
            "flow_count": alert.flow_count,
            "source": "real",
        },
    })

    # Send to all connected alert clients
    for ws in list(_alert_clients):
        try:
            asyncio.get_event_loop().run_in_executor(None, _safe_send, ws, msg)
        except Exception:
            pass


def _safe_send(ws: WebSocket, msg: str) -> None:
    """Safely send a message to a WebSocket client."""
    try:
        loop = asyncio.get_event_loop()
        if not loop.is_closed():
            loop.run_in_executor(None, ws.send_text, msg)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Simulated alerts (for when capture isn't active)
# ---------------------------------------------------------------------------


def _generate_simulated_alert() -> dict:
    """Generate a realistic simulated alert for demo purposes."""
    import random

    threat_types = [
        ("DDoS", "critical", 0.85 + random.random() * 0.14),
        ("Beaconing", "high", 0.70 + random.random() * 0.25),
        ("DGA", "medium", 0.65 + random.random() * 0.30),
        ("DNS Tunneling", "medium", 0.60 + random.random() * 0.35),
        ("TLS Anomaly", "high", 0.75 + random.random() * 0.20),
        ("Port Scan", "medium", 0.70 + random.random() * 0.25),
        ("Data Exfiltration", "critical", 0.80 + random.random() * 0.19),
    ]

    t_type, sev, conf = random.choice(threat_types)
    src_ips = ["185.220.101.34", "91.234.99.12", "103.224.182.250",
               "198.51.100.45", "203.0.113.88", "45.33.32.156",
               "192.168.1." + str(random.randint(2, 254))]
    dst_ips = ["10.0.1.50", "10.0.1.100", "10.0.1.200", "192.168.1.10"]

    evidence_presets = {
        "DDoS": {"syn_count": random.randint(50, 500), "packet_count": random.randint(100, 1000),
                 "unique_src_ips": random.randint(10, 200), "detection_method": "syn_rate_threshold"},
        "Beaconing": {"avg_interval_sec": round(random.uniform(1.0, 5.0), 3),
                       "beacon_count": random.randint(10, 50),
                       "coefficient_of_variation": round(random.uniform(0.05, 0.25), 4),
                       "detection_method": "interval_regularity"},
        "DGA": {"domain_entropy": round(random.uniform(3.5, 5.0), 2),
                 "domain_length": random.randint(15, 40),
                 "detection_method": "entropy_analysis"},
        "DNS Tunneling": {"avg_query_length": random.randint(40, 100),
                          "query_count": random.randint(20, 100),
                          "detection_method": "dns_length_analysis"},
        "TLS Anomaly": {"tls_fingerprint": _random_ja3(),
                        "certificate_valid": random.random() < 0.3,
                        "detection_method": "ja3_fingerprint_mismatch"},
        "Port Scan": {"unique_ports_scanned": random.randint(10, 100),
                      "syn_count": random.randint(15, 200),
                      "detection_method": "sequential_port_probe"},
        "Data Exfiltration": {"bytes_transferred": random.randint(1_000_000, 100_000_000),
                               "unusual_port": random.choice([8080, 8443, 9001, 31337]),
                               "detection_method": "volume_anomaly"},
    }

    alert = {
        "id": f"sim-{int(time.time() * 1000)}-{random.randint(1000, 9999)}",
        "timestamp": time.time(),
        "threat_type": t_type,
        "confidence": round(conf, 3),
        "severity": sev,
        "src_ip": random.choice(src_ips),
        "dst_ip": random.choice(dst_ips),
        "src_port": random.randint(1024, 65535),
        "dst_port": random.randint(1, 65535),
        "protocol": random.choice(["TCP", "UDP", "DNS", "TLS"]),
        "evidence": evidence_presets.get(t_type, {}),
        "flow_count": random.randint(1, 50),
        "source": "simulated",
    }

    with _lock:
        _simulated_alerts.appendleft(alert)
        _stats["alerts_generated"] += 1

    return alert


def _random_ja3() -> str:
    """Generate a realistic-looking JA3 fingerprint."""
    import random
    versions = ["771", "772"]
    ciphers = ["49196", "49199", "49200", "159", "52393", "52392"]
    extensions = ["51", "43", "0", "10", "11", "35", "13"]
    v = random.choice(versions)
    c = random.choice(ciphers)
    e = ",".join(random.sample(extensions, min(5, len(extensions))))
    return f"{v}-{c}-{e}"


def _sim_alert_loop() -> None:
    """Background thread generating simulated alerts."""
    import random

    while not _sim_stop.is_set():
        try:
            alert = _generate_simulated_alert()

            # Push to WebSocket clients
            msg = json.dumps({
                "type": "simulated_alert",
                "data": alert,
            })

            for ws in list(_alert_clients):
                try:
                    loop = asyncio.get_event_loop()
                    if not loop.is_closed():
                        loop.run_in_executor(None, _ws_send, ws, msg)
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"[SIM] Alert generation error: {e}")

        time.sleep(random.uniform(0.8, 3.0))


def _ws_send(ws: WebSocket, msg: str) -> None:
    """Send to WebSocket (runs in executor)."""
    try:
        loop = asyncio.get_event_loop()
        if not loop.is_closed():
            asyncio.run_coroutine_threadsafe(ws.send_text(msg), loop)
    except Exception:
        pass


def _sim_stats_loop() -> None:
    """Background thread updating stats for simulated mode."""
    import random

    while not _sim_stop.is_set():
        try:
            with _lock:
                _stats["total_packets"] += random.randint(50, 500)
                _stats["total_bytes"] += random.randint(10000, 500000)
                _stats["active_flows"] = random.randint(20, 200)

            # Broadcast stats to dashboard clients
            stats_msg = json.dumps({
                "type": "stats",
                "data": {
                    "total_packets": _stats["total_packets"],
                    "total_bytes": _stats["total_bytes"],
                    "active_flows": _stats["active_flows"],
                    "alerts_generated": _stats["alerts_generated"],
                    "attacks_launched": _stats["attacks_launched"],
                    "capture_mode": "simulated" if _sniffer is None or not _sniffer.is_running else "real",
                    "uptime": int(time.time() - _start_time),
                },
            })

            for ws in list(_dashboard_clients):
                try:
                    loop = asyncio.get_event_loop()
                    if not loop.is_closed():
                        asyncio.run_coroutine_threadsafe(ws.send_text(stats_msg), loop)
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"[SIM] Stats error: {e}")

        time.sleep(1.0)


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health")
def health():
    return {
        "service": "EKADHARA",
        "version": "2.1.0",
        "mode": "real" if (SCAPY_AVAILABLE and _sniffer and _sniffer.is_running) else "simulated",
        "scapy_available": SCAPY_AVAILABLE,
        "capturing": _sniffer.is_running if _sniffer else False,
        "active_attacks": len(attack_controller.active_attacks()),
        "uptime_sec": int(time.time() - _start_time),
    }


@app.get("/api/real-stats")
def get_real_stats():
    with _lock:
        return {
            "total_packets": _stats["total_packets"],
            "total_bytes": _stats["total_bytes"],
            "active_flows": _stats["active_flows"],
            "alerts_generated": _stats["alerts_generated"],
            "capture_mode": "real" if (_sniffer and _sniffer.is_running) else "simulated",
            "uptime_sec": int(time.time() - _start_time),
        }


@app.get("/api/alerts")
def get_alerts(limit: int = 50):
    """Get recent alerts (both real and simulated)."""
    with _lock:
        all_alerts = list(_real_alerts) + list(_simulated_alerts)
    all_alerts.sort(key=lambda a: a.get("timestamp", 0) if isinstance(a, dict) else a.timestamp, reverse=True)
    return {"alerts": all_alerts[:limit], "total": len(all_alerts)}


@app.get("/api/active-attacks")
def get_active_attacks():
    return {"attacks": attack_controller.active_attacks()}


@app.post("/api/attack/start")
def start_attack(attack_type: str, target: str = "127.0.0.1", duration: float = 10.0):
    """Launch an attack."""
    try:
        attack_id = attack_controller.launch(
            attack_type=attack_type,
            target=target,
            duration=duration,
        )
        with _lock:
            _stats["attacks_launched"] += 1
        return {"status": "started", "attack_id": attack_id, "type": attack_type}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/attack/stop")
def stop_attack(attack_id: str):
    """Stop a running attack."""
    ok = attack_controller.stop(attack_id)
    return {"status": "stopped" if ok else "not_found", "attack_id": attack_id}


@app.post("/api/attack/stop-all")
def stop_all_attacks():
    attack_controller.stop_all()
    return {"status": "all_stopped"}


@app.get("/api/interfaces")
def list_interfaces():
    if SCAPY_AVAILABLE:
        return {"interfaces": PacketSniffer.list_interfaces()}
    return {"interfaces": ["lo (scapy not available)"]}


@app.post("/api/capture/start")
def start_capture(interface: str = "lo"):
    """Start real packet capture."""
    global _sniffer

    if not SCAPY_AVAILABLE:
        return {"status": "error", "message": "Scapy not installed. Run: pip install scapy"}

    with _sniffer_lock:
        if _sniffer and _sniffer.is_running:
            return {"status": "already_running"}

        try:
            flow_table = FlowTable(alert_callback=_on_alert)
            _sniffer = PacketSniffer(interface=interface, flow_table=flow_table)
            _sniffer.start()

            # Start flow pruning thread
            def _prune():
                while _sniffer and _sniffer.is_running:
                    time.sleep(30)
                    if _sniffer:
                        _sniffer.flow_table.prune_old_flows()

            threading.Thread(target=_prune, daemon=True, name="flow-pruner").start()

            return {"status": "started", "interface": interface}
        except Exception as e:
            return {"status": "error", "message": str(e)}


@app.post("/api/capture/stop")
def stop_capture():
    """Stop packet capture."""
    global _sniffer
    with _sniffer_lock:
        if _sniffer:
            _sniffer.stop()
            _sniffer = None
    return {"status": "stopped"}


# ---------------------------------------------------------------------------
# WebSocket endpoints
# ---------------------------------------------------------------------------


@app.websocket("/ws/dashboard")
async def ws_dashboard(ws: WebSocket):
    await ws.accept()
    _dashboard_clients.add(ws)
    logger.info("[WS] Dashboard client connected")
    try:
        while True:
            # Send stats every second
            with _lock:
                stats_data = {
                    "type": "stats",
                    "data": {
                        "total_packets": _stats["total_packets"],
                        "total_bytes": _stats["total_bytes"],
                        "active_flows": _stats["active_flows"],
                        "alerts_generated": _stats["alerts_generated"],
                        "attacks_launched": _stats["attacks_launched"],
                        "capture_mode": "real" if (_sniffer and _sniffer.is_running) else "simulated",
                        "uptime_sec": int(time.time() - _start_time),
                    },
                }
            await ws.send_json(stats_data)

            # Also send flow counts if capturing
            if _sniffer and _sniffer.is_running:
                flow_count = _sniffer.flow_table.active_flow_count
                await ws.send_json({
                    "type": "capture_info",
                    "data": {
                        "packets_captured": _sniffer.packets_captured,
                        "active_flows": flow_count,
                        "interface": _sniffer.interface,
                    },
                })

            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
    finally:
        _dashboard_clients.discard(ws)
        logger.info("[WS] Dashboard client disconnected")


@app.websocket("/ws/alerts")
async def ws_alerts(ws: WebSocket):
    await ws.accept()
    _alert_clients.add(ws)
    logger.info("[WS] Alert client connected")
    try:
        # Send recent alerts on connect
        with _lock:
            recent = list(_real_alerts)[:20] + list(_simulated_alerts)[:20]

        for alert in recent:
            alert_data = _serialize_alert(alert)
            if alert_data:
                await ws.send_json({"type": "recent_alert", "data": alert_data})

        # Keep connection alive — alerts pushed by _on_alert
        while True:
            await asyncio.sleep(30)
            await ws.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        pass
    finally:
        _alert_clients.discard(ws)
        logger.info("[WS] Alert client disconnected")


@app.websocket("/ws/attack")
async def ws_attack(ws: WebSocket):
    await ws.accept()
    _attack_clients.add(ws)
    logger.info("[WS] Attack control client connected")
    try:
        while True:
            msg = await ws.receive_text()
            try:
                data = json.loads(msg)
                action = data.get("action")

                if action == "launch":
                    attack_id = attack_controller.launch(
                        attack_type=data.get("type", "ddos"),
                        target=data.get("target", "127.0.0.1"),
                        duration=data.get("duration", 10.0),
                    )
                    with _lock:
                        _stats["attacks_launched"] += 1
                    await ws.send_json({
                        "type": "attack_started",
                        "attack_id": attack_id,
                        "attack_type": data.get("type"),
                    })

                elif action == "stop":
                    attack_id = data.get("attack_id", "")
                    ok = attack_controller.stop(attack_id)
                    await ws.send_json({
                        "type": "attack_stopped",
                        "attack_id": attack_id,
                        "success": ok,
                    })

                elif action == "stop_all":
                    attack_controller.stop_all()
                    await ws.send_json({"type": "all_attacks_stopped"})

                elif action == "status":
                    await ws.send_json({
                        "type": "attack_status",
                        "active": attack_controller.active_attacks(),
                    })

            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        _attack_clients.discard(ws)


def _serialize_alert(alert) -> dict | None:
    """Convert alert (dict or object) to JSON dict."""
    if isinstance(alert, dict):
        return alert
    if isinstance(alert, DetectedAlert):
        return {
            "id": alert.id,
            "timestamp": alert.timestamp,
            "threat_type": alert.threat_type,
            "confidence": round(alert.confidence, 3),
            "severity": alert.severity,
            "src_ip": alert.src_ip,
            "dst_ip": alert.dst_ip,
            "src_port": alert.src_port,
            "dst_port": alert.dst_port,
            "protocol": alert.protocol,
            "evidence": alert.evidence,
            "flow_count": alert.flow_count,
            "source": "real",
        }
    return None


# ---------------------------------------------------------------------------
# Static files / SPA fallback
# ---------------------------------------------------------------------------


@app.get("/{full_path:path}")
async def serve_frontend(request, full_path: str):
    """Serve frontend or fallback to index.html for SPA routing."""
    if _frontend_dist.exists():
        file_path = _frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_frontend_dist / "index.html")
    return {"message": "EKADHARA backend — frontend not built yet"}


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------


@app.on_event("startup")
def startup():
    global _sim_thread

    # Start simulated alert generator
    _sim_thread = threading.Thread(target=_sim_alert_loop, daemon=True, name="sim-alerts")
    _sim_thread.start()

    # Start simulated stats broadcaster
    threading.Thread(target=_sim_stats_loop, daemon=True, name="sim-stats").start()

    # Try to start real capture on lo interface
    if SCAPY_AVAILABLE:
        try:
            _start_real_capture("lo")
        except Exception as e:
            logger.warning(f"[STARTUP] Real capture failed: {e} — using simulated mode")

    logger.info("[DEMO] EKADHARA demo server started")


def _start_real_capture(interface: str) -> None:
    global _sniffer
    flow_table = FlowTable(alert_callback=_on_alert)
    _sniffer = PacketSniffer(interface=interface, flow_table=flow_table)
    _sniffer.start()
    logger.info(f"[STARTUP] Real capture started on {interface}")


@app.on_event("shutdown")
def shutdown():
    global _sniffer
    _sim_stop.set()
    if _sniffer:
        _sniffer.stop()
        _sniffer = None
    attack_controller.stop_all()
    logger.info("[DEMO] EKADHARA demo server stopped")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"""
+============================================================+
|  EKADHARA v2.1.0 -- Real-time Threat Detection             |
|  Mode: {'REAL CAPTURE' if SCAPY_AVAILABLE else 'SIMULATED'}                                  |
|  WebSocket: ws://{host}:{port}/ws/dashboard                   |
|  API docs:  http://{host}:{port}/docs                         |
+============================================================+
    """)
    uvicorn.run(app, host=host, port=port, log_level="info")
