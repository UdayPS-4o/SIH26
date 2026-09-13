"""
VIMAAN — two-layer kill-switch: manual + automatic.

Manual: operator toggles a source to DISABLED in the config file.
Automatic: after 3 consecutive 429s from one domain within 24 h, the
  source is automatically quarantined for 24 h.
"""

import time
import threading
from dataclasses import dataclass
from datetime import datetime, timezone

try:
    from collectors.base import CollectorStatus  # type: ignore
except ImportError:
    class CollectorStatus:
        ACTIVE = "active"
        DISABLED = "disabled"
        COOLDOWN = "cooldown"


@dataclass
class KillSwitchEntry:
    source: str
    manual: bool = False
    auto_until: float = 0.0
    consecutive_429s: int = 0
    last_429: float = 0.0


class KillSwitchRegistry:
    def __init__(self):
        self._entries: dict = {}
        self._lock = threading.Lock()

    def trip(self, source: str, duration_s: int = 86_400) -> None:
        with self._lock:
            entry = self._entries.setdefault(source, KillSwitchEntry(source=source))
            entry.auto_until = time.time() + duration_s

    def manual_toggle(self, source: str, enabled: bool) -> None:
        with self._lock:
            entry = self._entries.setdefault(source, KillSwitchEntry(source=source))
            entry.manual = not enabled

    def is_active(self, source: str) -> bool:
        with self._lock:
            entry = self._entries.get(source)
            if not entry:
                return False
            if entry.manual:
                return True
            if time.time() < entry.auto_until:
                return True
            return False

    def record_429(self, source: str) -> None:
        with self._lock:
            entry = self._entries.setdefault(source, KillSwitchEntry(source=source))
            now = time.time()
            if now - entry.last_429 > 86_400:
                entry.consecutive_429s = 0
            entry.consecutive_429s += 1
            entry.last_429 = now
            if entry.consecutive_429s >= 3:
                entry.auto_until = now + 86_400  # 24 h quarantine

    def status(self, source: str) -> CollectorStatus:
        if self.is_active(source):
            return CollectorStatus.DISABLED
        return CollectorStatus.ACTIVE
