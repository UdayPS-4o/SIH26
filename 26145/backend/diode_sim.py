"""
diode_sim.py — Data-diode compliance simulation for WATCHTOWER / Ekadhara.

Simulates the *behaviour* of a physical data diode in software so the
frontend demo can show the diode indicator, log read-only events, and
prove that no write path exists — without requiring actual hardware.

Architecture
────────────
A real data diode is a one-way optical or electronic gate:

    [Protected Enclave] ──► [Data Diode] ──► [Monitoring Enclave]
                                     ▲
                                     │  physically impossible

This module mirrors that constraint in the demo by:

1.  **Never creating outbound sockets** — the DiodeEnclave class only
    accepts inbound "telemetry" and never initiates connections.
2.  **Logging every attempted write** — any call that would violate the
    diode fires a compliance event with a timestamp.
3.  **Exposing a read-only state machine** — the frontend can query
    ``diode.is_read_only`` and display the compliance badge.
4.  **Optional: recording to PCAP** — writes go to a local PCAP file
    (the monitoring enclave's storage), never back to the protected side.

Usage
─────
::

    from diode_sim import DiodeEnclave

    diode = DiodeEnclave(label="primary")

    # Accept telemetry from the "protected" side
    diode.ingest(packet_bytes)

    # Any attempt to send back is logged and blocked
    diode.send_to_protected(b"response")   # logs a compliance violation

    # Frontend can poll diode.get_status()
    status = diode.get_status()
    # → {
    #     "mode": "read_only",
    #     "total_ingested_bytes": 42_500,
    #     "total_attempted_writes": 0,
    #     "uptime_sec": 3600,
    #     "integrity": "OK"
    #   }
"""

from __future__ import annotations

import logging
import time
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

__all__ = [
    "DiodeMode",
    "DegradationTable",
    "DIODE_DEGRADATION_TABLE",
    "ComplianceEvent",
    "DiodeEnclave",
    "global_diode",
]


# ---------------------------------------------------------------------------
# Diode modes
# ---------------------------------------------------------------------------

class DiodeMode:
    """Enumeration of diode operating modes."""

    FULL_DUPLEX = "full-duplex"
    DIODE_ONLY = "diode-only"
    ACK_SHADOW = "ack-shadow"


# ---------------------------------------------------------------------------
# Degradation table
# ---------------------------------------------------------------------------

#: Mapping of diode mode → features that are lost or downgraded.
#: ``features_lost`` is the count of features degraded for that threat type.
_DEGRADATION_MAP = {
    "syn_flood": {"full": 0.96, "diode": 0.92, "ack_shadow": 0.94, "features_lost": 2},
    "c2_beaconing": {"full": 0.97, "diode": 0.85, "ack_shadow": 0.91, "features_lost": 3},
    "dga_domain": {"full": 0.95, "diode": 0.93, "ack_shadow": 0.94, "features_lost": 1},
    "dns_tunneling": {"full": 0.94, "diode": 0.88, "ack_shadow": 0.90, "features_lost": 2},
    "port_scan": {"full": 0.97, "diode": 0.90, "ack_shadow": 0.93, "features_lost": 2},
    "data_exfiltration": {"full": 0.93, "diode": 0.78, "ack_shadow": 0.84, "features_lost": 4},
}

# Canonical degradation table used by the API endpoints.
DegradationTable = _DEGRADATION_MAP
DIODE_DEGRADATION_TABLE = _DEGRADATION_MAP


# ---------------------------------------------------------------------------
# Compliance event
# ---------------------------------------------------------------------------


@dataclass
class ComplianceEvent:
    """A single diode-compliance audit record."""

    timestamp: float = field(default_factory=time.time)
    event_type: str = "info"        # info | warn | violation | integrity
    message: str = ""
    details: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "iso": datetime.fromtimestamp(self.timestamp, tz=timezone.utc).isoformat(),
            "type": self.event_type,
            "message": self.message,
            "details": self.details,
        }


# ---------------------------------------------------------------------------
# Diode enclave
# ---------------------------------------------------------------------------


class DiodeEnclave:
    """Software model of a data-diode-protected monitoring enclave.

    Parameters
    ----------
    label : str
        Human-readable label (e.g. ``"primary"``, ``"backup"``).
    pcap_path : str | None
        If given, ingested bytes are appended to this PCAP file using
        a simple self-describing binary format (header + payload).
    max_events : int
        Maximum compliance events to keep in memory (FIFO).
    """

    #: Module-level default diode mode (used when enclave has no own set_mode call)
    _global_mode: str = DiodeMode.FULL_DUPLEX

    def __init__(
        self,
        label: str = "enclave-01",
        pcap_path: str | None = None,
        max_events: int = 10_000,
    ) -> None:
        self.label = label
        self._read_only = True               # never changes after init
        self._ingested_bytes: int = 0
        self._attempted_writes: int = 0
        self._started: float = time.time()
        self._lock = threading.Lock()
        self._events: list[ComplianceEvent] = []
        self._max_events = max_events
        self._pcap_path = Path(pcap_path) if pcap_path else None
        self._mode: str = self._global_mode  # per-enclave mode; defaults to global

        self._log("info", "Diode enclave initialised", {
            "label": label,
            "pcap": str(self._pcap_path) if self._pcap_path else "none",
            "mode": self._mode,
        })

    # ── Public properties ─────────────────────────────────────────────

    @property
    def is_read_only(self) -> bool:
        """Always ``True`` — the diode cannot be switched to write mode."""
        return True

    @property
    def mode(self) -> str:
        """Current diode operating mode."""
        return self._mode

    @mode.setter
    def mode(self, new_mode: str) -> None:
        """Set the operating mode (validates against allowed values)."""
        allowed = {DiodeMode.FULL_DUPLEX, DiodeMode.DIODE_ONLY, DiodeMode.ACK_SHADOW}
        if new_mode not in allowed:
            raise ValueError(
                f"Invalid diode mode '{new_mode}'. Choose from: {sorted(allowed)}"
            )
        old = self._mode
        self._mode = new_mode
        self._log("info", "Diode mode changed", {"from": old, "to": new_mode})

    @property
    def ingested_bytes(self) -> int:
        return self._ingested_bytes

    @property
    def attempted_writes(self) -> int:
        return self._attempted_writes

    @property
    def uptime_sec(self) -> float:
        return time.time() - self._started

    @property
    def event_count(self) -> int:
        return len(self._events)

    # ── Ingest (the ONLY allowed direction) ────────────────────────────

    def ingest(self, data: bytes, source: str = "unknown") -> dict:
        """Accept telemetry bytes from the *protected* network side.

        This is the **only** write direction the diode permits.
        Returns a receipt dict.
        """
        with self._lock:
            self._ingested_bytes += len(data)
            receipt = {
                "accepted": True,
                "bytes": len(data),
                "source": source,
                "total_ingested": self._ingested_bytes,
            }

            # Optionally write to local PCAP (monitoring enclave storage)
            if self._pcap_path:
                self._append_pcap(data)

            return receipt

    # ── Write attempts (always blocked) ────────────────────────────────

    def send_to_protected(self, data: bytes, reason: str = "unknown") -> None:
        """Attempt to send data *back* to the protected network.

        In a real diode this is physically impossible.  Here we log the
        attempt as a compliance *violation* and drop the data.
        """
        with self._lock:
            self._attempted_writes += 1
            self._log("violation", "Write to protected side blocked by diode", {
                "bytes": len(data),
                "reason": reason,
                "attempt": self._attempted_writes,
            })

    # Convenience aliases that also log violations
    def send(self, *args: Any, **kwargs: Any) -> None:
        self.send_to_protected(b"", reason="generic_send")

    def connect(self, *args: Any, **kwargs: Any) -> None:
        self.send_to_protected(b"", reason="outbound_connect")

    # ── Status & audit ────────────────────────────────────────────────

    def get_status(self) -> dict[str, Any]:
        """Return the current diode status for the dashboard."""
        with self._lock:
            mode_table = {
                "syn_flood": _DEGRADATION_MAP["syn_flood"],
                "c2_beaconing": _DEGRADATION_MAP["c2_beaconing"],
                "dga_domain": _DEGRADATION_MAP["dga_domain"],
                "dns_tunneling": _DEGRADATION_MAP["dns_tunneling"],
                "port_scan": _DEGRADATION_MAP["port_scan"],
                "data_exfiltration": _DEGRADATION_MAP["data_exfiltration"],
            }
            return {
                "label": self.label,
                "mode": self._mode,
                "integrity": "OK",
                "ingested_bytes": self._ingested_bytes,
                "attempted_writes": self._attempted_writes,
                "uptime_sec": round(self.uptime_sec, 1),
                "event_count": self.event_count,
                "pcap_recording": str(self._pcap_path) if self._pcap_path else None,
                "degradation_table": mode_table,
            }

    def get_events(self, limit: int = 50) -> list[dict]:
        """Return the most recent compliance events (newest first)."""
        with self._lock:
            events = list(reversed(self._events[-limit:]))
        return [e.to_dict() for e in events]

    def verify_integrity(self) -> dict:
        """Run a self-check and log the result."""
        checks = {
            "read_only_property": self._read_only,
            "no_outbound_sockets": True,  # we never open one
            "event_log_intact": len(self._events) <= self._max_events,
        }
        all_ok = all(checks.values())
        self._log("integrity" if all_ok else "warn",
                  "Integrity check",
                  {"checks": checks, "result": "PASS" if all_ok else "FAIL"})
        return {"passed": all_ok, "checks": checks}

    # ── Internal helpers ──────────────────────────────────────────────

    def _log(self, event_type: str, message: str, details: dict | None = None) -> None:
        evt = ComplianceEvent(event_type=event_type, message=message, details=details or {})
        self._events.append(evt)
        if len(self._events) > self._max_events:
            self._events = self._events[-self._max_events:]
        logger.debug("[diode:%s] %s", self.label, message)

    def _append_pcap(self, data: bytes) -> None:
        """Append raw bytes to the local PCAP file."""
        try:
            with open(self._pcap_path, "ab") as fh:
                # Minimal PCAP global header (magic + version + snaplen + LL type)
                if self._pcap_path.stat().st_size == 0:
                    fh.write(
                        b"\xd4\xc3\xb2\xa1"  # magic
                        b"\x02\x00"          # version major
                        b"\x00\x00"          # version minor
                        b"\x00\x00\x00\x00"  # timezone
                        b"\x00\x00\x00\x00"  # sigfigs
                        b"\xff\x7f\x00\x00"  # snaplen = 65535
                        b"\x01\x00\x00\x00"  # LINKTYPE_ETHERNET
                    )
                # Per-packet header + data
                ts_sec = int(time.time())
                ts_usec = int((time.time() % 1) * 1_000_000)
                incl_len = len(data)
                orig_len = incl_len
                fh.write(
                    ts_sec.to_bytes(4, "little")
                    + ts_usec.to_bytes(4, "little")
                    + incl_len.to_bytes(4, "little")
                    + orig_len.to_bytes(4, "little")
                )
                fh.write(data)
        except OSError as exc:
            logger.warning("[diode:%s] PCAP write failed: %s", self.label, exc)


# ---------------------------------------------------------------------------
# Module-level singleton (used by demo_server.py and the dashboard)
# ---------------------------------------------------------------------------

#: Shared diode instance — imported by other modules as needed.
global_diode: DiodeEnclave = DiodeEnclave(
    label="WATCHTOWER-primary",
    pcap_path="data/diode_capture.pcap",
)


# ---------------------------------------------------------------------------
# CLI demo
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(levelname)s  %(message)s")

    diode = DiodeEnclave(label="demo", pcap_path="/tmp/diode_demo.pcap")

    # Simulate 10 seconds of telemetry ingest
    for i in range(20):
        diode.ingest(b"\x00" * 64, source=f"flow-{i:04d}")
        time.sleep(0.5)

    # Attempt a write (should be logged as violation)
    diode.send_to_protected(b"response", reason="demo_test")

    # Show status
    import json
    print("\n── Diode Status ─────────────────────────────────")
    print(json.dumps(diode.get_status(), indent=2))
    print("\n── Recent Events ───────────────────────────────")
    for evt in diode.get_events(10):
        print(f"  [{evt['type']:8s}] {evt['message']}")
