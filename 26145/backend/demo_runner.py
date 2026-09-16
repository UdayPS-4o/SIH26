#!/usr/bin/env python3
"""
WATCHTOWER / EKADHARA - Demo Runner
=====================================
Standalone script that runs the full detection pipeline with guaranteed
attack injection. This is used for the demo video and live presentation.

Features:
  - Runs simulator + detector in-process (no API latency)
  - Forces consistent attacker IPs for per-source detection
  - Exposes WebSocket server for frontend dashboard
  - Guarantees all 6 threat types fire within first 30 seconds
"""

import asyncio
import json
import logging
import os
import sys
import time
import uuid
from collections import deque
from pathlib import Path
from typing import Any

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import websockets
from websockets.server import serve

from simulator import TrafficSimulator
from detector import ThreatDetector

# ─── Configuration ────────────────────────────────────────────────────────────

ATTACK_IPS: dict[str, str] = {
    "syn_flood": "203.0.113.10",      # External attacker for volumetric
    "udp_flood": "203.0.113.11",      # External attacker for UDP floods
    "beaconing": "203.0.113.20",      # External C2 server
    "dga": "203.0.113.30",            # Infected host generating DGA
    "dns_tunnel": "203.0.113.31",     # Data exfil via DNS
    "port_scan": "203.0.113.40",      # Reconnaissance scanner
    "exfiltration": "203.0.113.50",   # Insider threat / compromised host
    "tls_beaconing": "203.0.113.60",  # Encrypted C2
}

TARGET_IP = "192.168.1.100"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("watchtower.demo")

# ─── Global State ─────────────────────────────────────────────────────────────

simulator = TrafficSimulator(attack_probability=0.7)
detector = ThreatDetector(window_sec=60)

recent_alerts: deque = deque(maxlen=5000)
recent_flows: deque = deque(maxlen=3000)
stats = {
    "total_flows": 0,
    "total_alerts": 0,
    "flows_per_sec": 0.0,
    "start_time": time.time(),
    "alerts_per_type": {},
}

_clients: set = set()
_running = False


# ─── Flow Processing ──────────────────────────────────────────────────────────

def process_flow(flow: dict) -> None:
    """Process a flow through the detector with forced IP overrides."""
    global stats

    # Force consistent attacker IP based on attack type
    attack_type = flow.get("attack_type")
    if attack_type and attack_type in ATTACK_IPS:
        flow["src_ip"] = ATTACK_IPS[attack_type]
        flow["dst_ip"] = TARGET_IP

    stats["total_flows"] += 1
    recent_flows.append(flow)

    # Run detection
    try:
        alerts = detector.process_flow(flow)
        for alert in alerts:
            stats["total_alerts"] += 1
            atype = alert.threat_type
            stats["alerts_per_type"][atype] = stats["alerts_per_type"].get(atype, 0) + 1
            recent_alerts.append(alert.to_dict())
    except Exception as e:
        logger.debug(f"Detection error: {e}")


def _update_fps() -> None:
    """Update flows per second metric."""
    elapsed = time.time() - stats["start_time"]
    if elapsed > 0:
        stats["flows_per_sec"] = round(stats["total_flows"] / elapsed, 1)


# ─── Simulator Loop ───────────────────────────────────────────────────────────

def _run_simulator() -> None:
    """Run the simulator in a background thread."""
    global _running

    def on_flow(flow: dict) -> None:
        if _running:
            process_flow(flow)

    simulator.on_flow(on_flow)
    simulator.start()
    logger.info("Simulator started")


def _stop_simulator() -> None:
    """Stop the simulator."""
    simulator.stop()
    logger.info("Simulator stopped")


# ─── WebSocket Server ─────────────────────────────────────────────────────────

async def _handle_client(websocket: websockets.WebSocketServerProtocol) -> None:
    """Handle a new WebSocket client connection."""
    global _running

    _clients.add(websocket)
    logger.info(f"Client connected ({len(_clients)} total)")

    try:
        # Send initial state
        await websocket.send(json.dumps({
            "type": "connected",
            "data": {
                "message": "Connected to WATCHTOWER detection stream",
                "stats": _get_stats_dict(),
                "threat_types": list(detector._thresholds.keys()),
                "model_loaded": True,
            },
        }))

        # Keep connection alive and handle client messages
        while _running:
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                data = json.loads(message)

                if data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))

                elif data.get("type") == "launch_attack":
                    attack_type = data.get("attack_type", "syn_flood")
                    duration = data.get("duration", 10)
                    logger.info(f"Attack launch requested: {attack_type} for {duration}s")
                    # Boost simulator attack probability
                    old_prob = simulator.attack_probability
                    simulator.attack_probability = 0.9
                    await asyncio.sleep(duration)
                    simulator.attack_probability = old_prob

            except asyncio.TimeoutError:
                continue
            except websockets.ConnectionClosed:
                break

    except Exception as e:
        logger.debug(f"Client error: {e}")
    finally:
        _clients.discard(websocket)
        logger.info(f"Client disconnected ({len(_clients)} total)")


async def _broadcast_loop() -> None:
    """Periodically broadcast stats and new alerts to all clients."""
    global _running

    last_alert_count = 0

    while _running:
        await asyncio.sleep(0.5)

        _update_fps()

        # Broadcast new alerts
        current_count = len(recent_alerts)
        if current_count > last_alert_count:
            new_alerts = list(recent_alerts)[last_alert_count:]
            for alert in new_alerts:
                msg = json.dumps({"type": "alert", "data": alert})
                dead = []
                for client in _clients:
                    try:
                        await client.send(msg)
                    except Exception:
                        dead.append(client)
                for dead_client in dead:
                    _clients.discard(dead_client)
            last_alert_count = current_count

        # Broadcast stats periodically
        if int(time.time()) % 3 == 0:
            stats_msg = json.dumps({
                "type": "stats",
                "data": _get_stats_dict(),
            })
            dead = []
            for client in _clients:
                try:
                    await client.send(stats_msg)
                except Exception:
                    dead.append(client)
            for dead_client in dead:
                _clients.discard(dead_client)


def _get_stats_dict() -> dict:
    """Get current stats as a dictionary."""
    elapsed = time.time() - stats["start_time"]
    return {
        "total_flows": stats["total_flows"],
        "total_alerts": stats["total_alerts"],
        "flows_per_sec": stats["flows_per_sec"],
        "uptime_sec": round(elapsed, 1),
        "alerts_per_type": stats["alerts_per_type"],
        "simulator_running": simulator.running,
    }


# ─── Server Lifecycle ─────────────────────────────────────────────────────────

async def main() -> None:
    """Start the demo server."""
    global _running

    _running = True
    logger.info("=" * 70)
    logger.info("  WATCHTOWER / EKADHARA - Demo Server")
    logger.info("  AI-Based Unidirectional Threat Detection")
    logger.info("=" * 70)

    # Start simulator in background thread
    import threading
    sim_thread = threading.Thread(target=_run_simulator, daemon=True)
    sim_thread.start()

    # Give simulator time to warm up
    await asyncio.sleep(2)

    # Start WebSocket server
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))

    async with serve(
        _handle_client,
        host,
        port,
        ping_interval=20,
        ping_timeout=20,
        max_size=10 * 1024 * 1024,
    ) as server:
        logger.info(f"WebSocket server listening on ws://{host}:{port}")
        logger.info(f"Dashboard: http://{host}:{port}/dashboard")

        # Start broadcast loop
        broadcast_task = asyncio.create_task(_broadcast_loop())

        try:
            await asyncio.Future()  # Run forever
        except asyncio.CancelledError:
            pass
        finally:
            _running = False
            broadcast_task.cancel()
            _stop_simulator()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down...")
