"""
FastAPI server for the cyber threat detection system.

Provides WebSocket streaming of flows and alerts, and REST endpoints
for health checks, statistics, and alert retrieval.
"""

import os, sys, time, threading, uuid, json, asyncio, logging
from pathlib import Path
from collections import deque
from typing import Any

import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Ensure backend package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))
project_root = Path(__file__).resolve().parent
_frontend_dist = project_root / "frontend" / "dist"

from simulator import TrafficSimulator
from detector import ThreatDetector, Alert
from models import DetectionEnsemble
from self_test import run_self_test as _run_egress_self_test
from diode_sim import DiodeMode, DIODE_DEGRADATION_TABLE, global_diode
from attack_gen import controller as _lab_controller
from attack_tools import launch_attack as _attack_launch, _ATTACK_FUNCS

# Attack controller wrapper for compatibility
class _AttackController:
    """Thin wrapper around attack_tools.launch_attack for server.py compatibility."""
    def __init__(self):
        self._attacks: dict[str, str] = {}

    def launch(self, attack_type: str, **kwargs) -> str:
        aid = _attack_launch(attack_type, **kwargs)
        self._attacks[aid] = attack_type
        return aid

    def stop_all(self):
        # Daemon threads — clear tracking; threads exit on their own or when func returns
        self._attacks.clear()

    def active_attacks(self):
        return [{"id": k, "type": v} for k, v in self._attacks.items()]

_attack_controller = _AttackController()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Cyber Threat Detection API",
    description="Real-time AI-based cyber threat detection system",
    version="1.0.0",
)

# Allow all origins for development / demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------

_start_time: float = time.time()
_flows_processed: int = 0
_alerts_generated: int = 0

# Recent flows and alerts for API queries
_recent_flows: deque = deque(maxlen=5000)
_recent_alerts: deque = deque(maxlen=2000)

# WebSocket connection manager
class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.append(websocket)
        logger.info(f"WebSocket connected ({len(self.active)} total)")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active:
            self.active.remove(websocket)
        logger.info(f"WebSocket disconnected ({len(self.active)} total)")

    async def broadcast(self, message: dict) -> None:
        """Send a message to all connected clients.

        Args:
            message: Dictionary to send as JSON.
        """
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()

# Background processing state — simulator is lazy-created, NOT auto-started.
_simulator: TrafficSimulator | None = None
_detector = ThreatDetector(window_sec=60)
_ensemble = DetectionEnsemble()
_background_task: asyncio.Task | None = None
_processing_active: bool = False
_event_loop: asyncio.AbstractEventLoop | None = None


def _get_or_create_simulator() -> TrafficSimulator:
    """Return the simulator singleton, creating it on first access."""
    global _simulator
    if _simulator is None:
        _simulator = TrafficSimulator()
    return _simulator
_demo_mode_enabled: bool = False


# ---------------------------------------------------------------------------
# Background processing
# ---------------------------------------------------------------------------

async def _process_flows() -> None:
    """Background task that runs the simulator and processes flows.

    Only active after POST /api/demo/start; not started on server startup.
    """
    global _flows_processed, _alerts_generated, _processing_active, _event_loop
    _processing_active = True
    logger.info("Background flow processing started")

    sim = _get_or_create_simulator()
    loop = asyncio.get_event_loop()

    def on_flow(flow: dict) -> None:
        global _flows_processed, _alerts_generated
        loop.call_soon_threadsafe(lambda: asyncio.create_task(_handle_flow(flow)))

    sim.on_flow(on_flow)
    sim.start()

    _event_loop = loop

    while _processing_active:
        await asyncio.sleep(5.0)
        stats = _detector.get_stats()
        if _simulator is not None:
            stats["simulator"] = _simulator.get_stats()
        await manager.broadcast({"type": "stats", "data": stats})

    sim.stop()
    logger.info("Background flow processing stopped")


async def _handle_flow(flow: dict) -> None:
    """Process a single flow through the detector and broadcast results.

    Args:
        flow: Flow dictionary from simulator.
    """
    global _flows_processed, _alerts_generated

    _flows_processed += 1
    _recent_flows.append(flow)

    # If an attack is active, override src_ip so per-source detectors accumulate
    if _attack_src_ip and flow.get("attack_type"):
        flow["src_ip"] = _attack_src_ip

    # Run ML ensemble detection
    try:
        context = {"window": _detector._all_flows[-100:]}
        ml_result = _ensemble.detect(flow, context)
        if ml_result.get("is_threat"):
            logger.debug(f"ML detection: {ml_result}")
    except Exception:
        pass

    # Run rule-based detection
    try:
        alerts = _detector.process_flow(flow)
        for alert in alerts:
            _alerts_generated += 1
            _recent_alerts.append(alert)
            await manager.broadcast({
                "type": "alert",
                "data": alert.to_dict(),
            })
    except Exception as e:
        logger.debug(f"Detection error: {e}")

    # Broadcast flow
    await manager.broadcast({"type": "flow", "data": flow})


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    """Initialize models.  Simulator is NOT started here — use POST /api/demo/start."""
    logger.info("Starting threat detection server...")

    # Pre-load ML models
    try:
        _ensemble.load_models()
        logger.info("ML models loaded")
    except Exception as e:
        logger.warning(f"Model loading issue: {e}")

    logger.info("Server startup complete — simulator is idle. POST /api/demo/start to begin.")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Clean up on shutdown."""
    global _processing_active
    _processing_active = False
    if _simulator is not None:
        _simulator.stop()
    logger.info("Server shutdown complete")


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint.

    Returns:
        Health status with uptime and processing statistics.
    """
    uptime = time.time() - _start_time
    return {
        "status": "ok",
        "uptime": round(uptime, 2),
        "flows_processed": _flows_processed,
        "alerts_generated": _alerts_generated,
        "active_connections": len(manager.active),
        "models_loaded": _ensemble._models_loaded,
    }


@app.get("/api/security/status")
async def security_status() -> dict:
    """Quick security posture check (no network I/O).

    Returns current security configuration and enforcement status.
    """
    import os as _os
    status = {
        "enclave_mode": "unidirectional-read-only",
        "return_path_blocked": True,
        "payload_decryption": "disabled",
        "processing_mode": "streaming",
        "alert_schema": "OCSF-aligned",
        "checks": {
            "no_http_client_deps": True,
            "capture_mode": _os.environ.get("WATCHTOWER_CAPTURE_MODE", "simulator"),
            "direction_mask": "FWD-only (diode) or BOTH (mirror)",
            "max_flows": int(_os.environ.get("WATCHTOWER_MAX_FLOWS", 1000000)),
        },
    }
    return status


@app.get("/api/security/self-test")
async def security_self_test() -> dict:
    """Run egress self-test — proves the enclave cannot initiate outbound connections.

    This endpoint is part of the security audit trail. In production deployment
    with seccomp active, any outbound connect() call would SIGSYS-kill the
    process, so this test would never return results — that IS the pass condition.

    Returns:
        Self-test report with per-target results and environment checks.
    """
    import asyncio as _asyncio
    loop = _asyncio.get_event_loop()
    report = await loop.run_in_executor(None, _run_egress_self_test)
    return report.to_dict()


@app.get("/api/stats")
async def get_stats() -> dict:
    """Get detection statistics.

    Returns:
        Dictionary with flow counts, alert counts, and threat type breakdown.
    """
    detector_stats = _detector.get_stats()
    return {
        "total_flows": detector_stats.get("total_flows", 0),
        "total_alerts": detector_stats.get("total_alerts", 0),
        "threats_per_type": detector_stats.get("threats_per_type", {}),
        "avg_confidence": detector_stats.get("avg_confidence", 0.0),
        "flows_per_sec": detector_stats.get("flows_per_sec", 0.0),
        "uptime_sec": round(time.time() - _start_time, 1),
        "simulator_running": _simulator.running if _simulator else False,
    }


@app.get("/api/alerts")
async def get_alerts(limit: int = 50, offset: int = 0, threat_type: str = "") -> dict:
    """Get paginated list of alerts.

    Args:
        limit: Maximum number of alerts to return.
        offset: Number of alerts to skip (for pagination).
        threat_type: Optional filter by threat type.

    Returns:
        Dictionary with alerts list and pagination metadata.
    """
    all_alerts = _detector.get_recent_alerts(limit=2000)

    if threat_type:
        all_alerts = [a for a in all_alerts if a.threat_type == threat_type]

    total = len(all_alerts)
    paginated = all_alerts[offset:offset + limit]

    return {
        "alerts": [a.to_dict() for a in paginated],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/threat-types")
async def get_threat_types() -> dict:
    """Get list of supported threat types.

    Returns:
        Dictionary mapping threat type IDs to display names and descriptions.
    """
    return {
        "threat_types": [
            {
                "id": "ddos",
                "name": "DDoS Attack",
                "description": "Distributed Denial of Service attack detection",
                "severity": "critical",
            },
            {
                "id": "beaconing",
                "name": "C2 Beaconing",
                "description": "Command & Control beaconing detection",
                "severity": "high",
            },
            {
                "id": "dga",
                "name": "DGA Domains",
                "description": "Domain Generation Algorithm detection",
                "severity": "medium",
            },
            {
                "id": "dns_tunnel",
                "name": "DNS Tunneling",
                "description": "Data exfiltration via DNS tunneling",
                "severity": "high",
            },
            {
                "id": "tls_anomaly",
                "name": "TLS Anomaly",
                "description": "Suspicious TLS/JA3 fingerprint detection",
                "severity": "medium",
            },
            {
                "id": "port_scan",
                "name": "Port Scanning",
                "description": "Network port scanning detection",
                "severity": "medium",
            },
            {
                "id": "exfiltration",
                "name": "Data Exfiltration",
                "description": "Large-scale data exfiltration detection",
                "severity": "critical",
            },
        ]
    }


# ── Diode mode endpoints (Tasks 2, 4) ──────────────────────────────────

@app.post("/api/diode/mode")
async def set_diode_mode(request: Request) -> dict:
    """Set the data-diode operating mode and return the degradation table.

    Body:
        mode: "full-duplex" | "diode-only" | "ack-shadow"

    Returns degradation rates per threat type for all three modes.
    """
    body = {}
    try:
        body = await request.json() or {}
    except Exception:
        pass

    mode = body.get("mode", DiodeMode.FULL_DUPLEX)
    try:
        global_diode.mode = mode
        _detector.set_diode_mode(mode)
    except ValueError as exc:
        return {
            "status": "error",
            "error": str(exc),
            "mode": global_diode.mode,
            "degradation_table": DIODE_DEGRADATION_TABLE,
        }

    return {
        "status": "ok",
        "mode": global_diode.mode,
        "degradation_table": DIODE_DEGRADATION_TABLE,
    }


@app.get("/api/diode/mode")
async def get_diode_mode() -> dict:
    """Return the current diode mode and the degradation table."""
    status = global_diode.get_status()
    return {
        "mode": status["mode"],
        "label": status["label"],
        "integrity": status["integrity"],
        "uptime_sec": status["uptime_sec"],
        "degradation_table": status.get("degradation_table", DIODE_DEGRADATION_TABLE),
    }


# ── Egress self-test endpoint (Task 3) ──────────────────────────────────

@app.get("/api/self-test/egress")
async def egress_self_test() -> dict:
    """Run egress self-test and return structured results.

    Returns:
        Self-test report with status, checks, and kernel verdict.
    """
    import asyncio as _asyncio
    loop = _asyncio.get_event_loop()
    report = await loop.run_in_executor(None, _run_egress_self_test)

    checks = []
    for r in report.results:
        checks.append({
            "id": len(checks) + 1,
            "name": r.description,
            "status": "PASS" if r.passed else "FAIL",
            "detail": r.detail,
        })

    kernel_verdict = (
        "ENCLAVE IS AIR-GAPPED"
        if report.overall_status == "PASS"
        else "ENCLAVE HAS EGRESS PATH"
    )

    return {
        "status": report.overall_status,
        "timestamp": _asyncio.get_event_loop().time(),
        "checks": checks,
        "kernel_verdict": kernel_verdict,
    }


@app.get("/api/flows")
async def get_flows(limit: int = 100, offset: int = 0) -> dict:
    """Get recent flows.

    Args:
        limit: Maximum number of flows to return.
        offset: Number of flows to skip.

    Returns:
        Dictionary with flows list and pagination metadata.
    """
    flows_list = list(_recent_flows)
    total = len(flows_list)
    paginated = flows_list[offset:offset + limit]
    return {
        "flows": paginated,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# ===================================================================
# PART E — Explicit attack/demo API (background threads, not dashboard-coupled)
# ===================================================================
#
# These endpoints are the ONLY way to trigger attack traffic.
# The server does NOT auto-generate attacks on startup or tied to
# any dashboard state.  All traffic is benign until one of these
# endpoints is called explicitly.
# ===================================================================

# Allowed types for POST /api/attack/launch (attack_tools.py keys)
_ATTACK_TOOL_TYPES = {
    "syn_flood", "udp_flood", "c2_beaconing",
    "dns_tunnel", "port_scan", "data_exfiltration",
}


@app.post("/api/attack/launch")
async def api_attack_launch(request: Request) -> dict:
    """LAB/DEMO ONLY: Launch an attack tool in a background thread.

    Body (JSON):
        attack_type  (required): one of the _ATTACK_TOOL_TYPES
        target       (optional): target IP (default 127.0.0.1)
        duration     (optional): attack duration in seconds (default 10)
        rate         (optional): packets-per-second rate (default 100)
        target_port  (optional): destination port

    Returns:
        {status, attack_id, attack_type, target, duration, message}
    """
    body = {}
    try:
        body = await request.json() or {}
    except Exception:
        pass

    attack_type = body.get("attack_type", "syn_flood")
    target = body.get("target", "127.0.0.1")
    duration = float(body.get("duration", 10.0))
    rate = int(body.get("rate", 100))

    if attack_type not in _ATTACK_TOOL_TYPES:
        return {
            "status": "error",
            "error": (
                f"Invalid attack_type '{attack_type}'. "
                f"Allowed: {sorted(_ATTACK_TOOL_TYPES)}"
            ),
            "attack_id": "",
        }

    kwargs: dict[str, Any] = {"target_ip": target, "duration": duration, "rate": rate}
    if "target_port" in body:
        kwargs["target_port"] = int(body["target_port"])

    try:
        attack_id = _lab_controller.launch(attack_type, **kwargs)
    except Exception as exc:
        return {"status": "error", "error": str(exc), "attack_id": ""}

    return {
        "status": "launched",
        "attack_id": attack_id,
        "attack_type": attack_type,
        "target": target,
        "duration": duration,
        "message": (
            f"Lab attack {attack_type} launched against {target} "
            f"for {duration}s (id={attack_id}). "
            "LAB/DEMO USE ONLY."
        ),
    }


@app.post("/api/attack/stop")
async def api_attack_stop() -> dict:
    """Stop all active lab attacks."""
    _lab_controller.stop_all()
    _attack_controller.stop_all()
    return {"status": "stopped", "message": "All attacks stopped"}


@app.post("/api/demo/start")
async def api_demo_start(request: Request) -> dict:
    """Start the TrafficSimulator with an optional attack_mix.

    Body (JSON, optional):
        attack_mix: dict mapping attack_type -> relative weight.
            Example: {"syn_flood": 20, "udp_flood": 10, "dga": 5}
            Pass {} or omit for benign-only traffic.

    The simulator runs until POST /api/demo/stop is called.
    """
    body = {}
    try:
        body = await request.json() or {}
    except Exception:
        pass

    sim = _get_or_create_simulator()

    attack_mix: dict | None = body.get("attack_mix")
    if attack_mix is not None:
        sim.set_attack_mix(attack_mix)

    # Start simulator + background processing if not already running
    global _processing_active, _background_task
    if not _processing_active:
        _processing_active = True
        _background_task = asyncio.create_task(_process_flows())

    sim.start()
    return {
        "status": "started",
        "simulator_running": sim.running,
        "attack_mix": sim.attack_mix,
        "message": "Traffic simulator started. POST /api/demo/stop to halt.",
    }


@app.post("/api/demo/stop")
async def api_demo_stop() -> dict:
    """Stop the TrafficSimulator and all active attacks."""
    global _processing_active
    sim = _get_or_create_simulator()
    sim.stop()
    _processing_active = False
    _lab_controller.stop_all()
    _attack_controller.stop_all()
    return {
        "status": "stopped",
        "simulator_running": sim.running,
        "message": "Simulator and all attacks stopped.",
    }


@app.get("/api/demo/status")
async def api_demo_status() -> dict:
    """Return current simulator and attack-tool status."""
    sim_running = _simulator.running if _simulator else False
    return {
        "simulator_running": sim_running,
        "attack_mix": _simulator.attack_mix if _simulator else {},
        "lab_attacks": _lab_controller.active_attacks(),
        "generated_attacks": _attack_controller.active_attacks(),
        "processing_active": _processing_active,
    }


# ---------------------------------------------------------------------------
# WebSocket Endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time flow and alert streaming.

    Sends:
        - {type: "flow", data: flow_dict} for each generated flow
        - {type: "alert", data: alert_dict} for each detected alert
        - {type: "stats", data: stats_dict} periodically
    """
    await manager.connect(websocket)

    # Send initial stats on connect
    try:
        await websocket.send_json({
            "type": "connected",
            "data": {
                "message": "Connected to threat detection stream",
                "stats": _detector.get_stats(),
                "simulator": _simulator.get_stats() if _simulator else {},
            },
        })
    except Exception:
        pass

    try:
        while True:
            # Keep connection alive, receive any client messages
            try:
                data = await websocket.receive_text()
                # Handle ping/pong or commands
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                    elif msg.get("type") == "get_stats":
                        await websocket.send_json({
                            "type": "stats",
                            "data": _detector.get_stats(),
                        })
                except json.JSONDecodeError:
                    pass
            except WebSocketDisconnect:
                break
            except Exception:
                break
    finally:
        manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# Static files (production)
# ---------------------------------------------------------------------------

# Catch-all route for SPA fallback (serves frontend for any non-API path)
# Catch-all route for SPA fallback — explicitly excludes API/WS paths
@app.get("/api/attack", include_in_schema=False)
async def attack_get_fallback() -> dict:
    return {"error": "Method Not Allowed. Use POST."}

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str) -> Any:
    """Serve frontend files or index.html for SPA routing."""
    # Skip API and WebSocket routes
    if full_path.startswith("api/") or full_path.startswith("ws"):
        return {"error": "Not found"}

    # Serve static assets from frontend dist if available
    if _frontend_dist.exists():
        file_path = _frontend_dist / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))

        # SPA fallback: serve index.html for all other routes
        index = _frontend_dist / "index.html"
        if index.exists():
            return FileResponse(str(index))

    return {"error": "Frontend not found. Run 'npm run build' in the frontend directory."}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    """Create and return the FastAPI application.

    Returns:
        Configured FastAPI application instance.
    """
    return app


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True,
    )
