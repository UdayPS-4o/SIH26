"""
FastAPI server for the cyber threat detection system.

Provides WebSocket streaming of flows and alerts, and REST endpoints
for health checks, statistics, and alert retrieval.
"""

import asyncio
import json
import logging
import os
import time
from collections import deque
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

project_root = Path(__file__).resolve().parent.parent
_frontend_dist = project_root / "frontend" / "dist"

from .simulator import TrafficSimulator
from .detector import ThreatDetector, Alert
from .models import DetectionEnsemble

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

# Background processing state
_simulator = TrafficSimulator(attack_probability=0.06)
_detector = ThreatDetector(window_sec=60)
_ensemble = DetectionEnsemble()
_background_task: asyncio.Task | None = None
_processing_active: bool = False


# ---------------------------------------------------------------------------
# Background processing
# ---------------------------------------------------------------------------

async def _process_flows() -> None:
    """Background task that runs the simulator and processes flows."""
    global _flows_processed, _alerts_generated, _processing_active

    _processing_active = True
    logger.info("Background flow processing started")

    loop = asyncio.get_event_loop()

    def on_flow(flow: dict) -> None:
        """Callback for each generated flow."""
        global _flows_processed, _alerts_generated

        # Schedule async work from sync callback (runs on the simulator's
        # background thread, so it must use the captured loop, not
        # asyncio.get_event_loop() which has no running loop on this thread)
        loop.call_soon_threadsafe(
            lambda: asyncio.create_task(_handle_flow(flow))
        )

    _simulator.on_flow(on_flow)
    _simulator.start()

    # Periodic stats broadcast
    while _processing_active:
        await asyncio.sleep(5.0)
        stats = _detector.get_stats()
        stats["simulator"] = _simulator.get_stats()
        await manager.broadcast({"type": "stats", "data": stats})

    _simulator.stop()
    logger.info("Background flow processing stopped")


async def _handle_flow(flow: dict) -> None:
    """Process a single flow through the detector and broadcast results.

    Args:
        flow: Flow dictionary from simulator.
    """
    global _flows_processed, _alerts_generated

    _flows_processed += 1
    _recent_flows.append(flow)

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
    """Initialize models and start background processing."""
    logger.info("Starting threat detection server...")

    # Pre-load ML models
    try:
        _ensemble.load_models()
        logger.info("ML models loaded")
    except Exception as e:
        logger.warning(f"Model loading issue: {e}")

    # Start background task
    global _background_task
    _background_task = asyncio.create_task(_process_flows())
    logger.info("Server startup complete")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Clean up on shutdown."""
    global _processing_active
    _processing_active = False
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
        "simulator_running": _simulator.running,
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
                "simulator": _simulator.get_stats(),
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
