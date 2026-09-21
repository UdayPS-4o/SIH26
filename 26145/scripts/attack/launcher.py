#!/usr/bin/env python3
"""
Unified launcher — dispatches to attack scripts.
EKADHARA PS-26145

Usage:
    python launcher.py <attack> --target <ip> [options]
    python launcher.py list            # show active attacks
    python launcher.py stop            # stop all attacks
    python launcher.py stop <id>       # stop specific attack
"""
import argparse
import importlib
import os
import sys
import threading
import time
from datetime import datetime
from typing import Dict, Optional, Tuple

# ── ANSI Colors ─────────────────────────────────────────────────────────────
class Color:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

# ── Attack Registry ─────────────────────────────────────────────────────────
ATTACKS = {
    "syn_flood": {
        "module": "syn_flood",
        "description": "SYN Flood — sends spoofed TCP SYN packets",
        "args": ["target", "port", "count", "rate"],
    },
    "udp_flood": {
        "module": "udp_flood",
        "description": "UDP Flood — sends large UDP packets (DNS amplification)",
        "args": ["target", "port", "count", "size", "rate", "mode"],
    },
    "dns_tunnel": {
        "module": "dns_tunnel",
        "description": "DNS Tunneling / DGA — sends high-entropy DNS queries",
        "args": ["target", "count"],
    },
    "port_scan": {
        "module": "port_scan",
        "description": "Port Scanner — scans target ports",
        "args": ["target", "ports", "speed", "method", "timeout"],
    },
    "beacon": {
        "module": "beacon",
        "description": "C2 Beaconing — periodic TCP connections with jitter",
        "args": ["target", "port", "interval", "jitter", "count", "timeout"],
    },
}

# ── Active Attack Manager ───────────────────────────────────────────────────
class AttackManager:
    def __init__(self):
        self.attacks: Dict[str, dict] = {}
        self._counter = 0
        self._lock = threading.Lock()

    def register(self, name: str, thread, stats: dict, kwargs: dict) -> str:
        """Register a new attack and return its ID."""
        with self._lock:
            self._counter += 1
            attack_id = f"{name}_{self._counter}"
            self.attacks[attack_id] = {
                "name": name,
                "thread": thread,
                "stats": stats,
                "kwargs": kwargs,
                "started": datetime.now().strftime("%H:%M:%S"),
            }
            return attack_id

    def unregister(self, attack_id: str):
        with self._lock:
            self.attacks.pop(attack_id, None)

    def stop(self, attack_id: str) -> bool:
        """Stop a specific attack."""
        if attack_id not in self.attacks:
            return False
        attack = self.attacks[attack_id]
        if "stop_event" in attack["stats"]:
            attack["stats"]["stop_event"].set()
        attack["thread"].join(timeout=3)
        self.unregister(attack_id)
        return True

    def stop_all(self):
        """Stop all active attacks."""
        for attack_id in list(self.attacks.keys()):
            self.stop(attack_id)

    def list_active(self) -> dict:
        with self._lock:
            return {k: v for k, v in self.attacks.items()
                    if v["thread"].is_alive()}

manager = AttackManager()

# ── Banner ──────────────────────────────────────────────────────────────────
def banner():
    print(f"""{Color.BOLD}{Color.CYAN}
+================================================+
|  [EKADHARA] Attack Launcher - PS-26145        |
|  Unified Traffic Generator Interface           |
+================================================+{Color.RESET}""")


# ── Dispatch Logic ──────────────────────────────────────────────────────────

def load_attack_module(attack_type: str):
    """Dynamically load an attack module."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)

    if attack_type not in ATTACKS:
        print(f"{Color.RED}[!] Unknown attack type: {attack_type}{Color.RESET}")
        print(f"{Color.YELLOW}[*] Available attacks: {', '.join(ATTACKS.keys())}{Color.RESET}")
        sys.exit(1)

    module_name = ATTACKS[attack_type]["module"]
    try:
        module = importlib.import_module(module_name)
        return module
    except ImportError as e:
        print(f"{Color.RED}[!] Failed to load {module_name}: {e}{Color.RESET}")
        sys.exit(1)


def launch_attack(attack_type: str, args) -> Optional[str]:
    """Launch an attack and return its ID."""
    module = load_attack_module(attack_type)
    run_fn = getattr(module, "run_attack", None)
    if not run_fn:
        print(f"{Color.RED}[!] Module {attack_type} has no run_attack() function.{Color.RESET}")
        sys.exit(1)

    # Build kwargs from argparse namespace, filtering to only valid args
    valid_args = set(ATTACKS[attack_type]["args"])
    kwargs = {k: v for k, v in vars(args).items()
              if k in valid_args and v is not None}

    print(f"\n{Color.MAGENTA}{'─'*55}{Color.RESET}")
    thread, stats = run_fn(**kwargs)

    if thread and thread.is_alive():
        attack_id = manager.register(attack_type, thread, stats, kwargs)
        print(f"{Color.GREEN}[+] Attack started with ID: {attack_id}{Color.RESET}")
        print(f"{Color.GREEN}[+] Use 'python launcher.py stop {attack_id}' to stop.{Color.RESET}")
        return attack_id
    return None


def list_attacks():
    """List all active attacks."""
    active = manager.list_active()
    if not active:
        print(f"{Color.YELLOW}[*] No active attacks.{Color.RESET}")
        return

    print(f"\n{Color.CYAN}{'─'*70}{Color.RESET}")
    print(f"  {Color.WHITE}{'ID':<25}  {'Type':<15}  {'Target':<20}  {'Started':>8}{Color.RESET}")
    print(f"{Color.CYAN}{'─'*70}{Color.RESET}")

    for attack_id, info in active.items():
        target = info["kwargs"].get("target", "?")
        if "port" in info["kwargs"]:
            target += f":{info['kwargs']['port']}"
        started = info["started"]
        print(f"  {Color.YELLOW}{attack_id:<25}{Color.RESET}  "
              f"{Color.CYAN}{info['name']:<15}{Color.RESET}  "
              f"{Color.WHITE}{target:<20}{Color.RESET}  "
              f"{Color.DIM}{started:>8}{Color.RESET}")

    print(f"{Color.CYAN}{'─'*70}{Color.RESET}")
    print(f"  {Color.GREEN}Total: {len(active)} active attack(s){Color.RESET}\n")


def stop_attacks(attack_id: Optional[str] = None):
    """Stop all or specific attacks."""
    if attack_id:
        if manager.stop(attack_id):
            print(f"{Color.GREEN}[+] Stopped attack: {attack_id}{Color.RESET}")
        else:
            print(f"{Color.RED}[!] Attack not found: {attack_id}{Color.RESET}")
    else:
        count = len(manager.list_active())
        manager.stop_all()
        print(f"{Color.GREEN}[+] Stopped {count} attack(s).{Color.RESET}")


# ── Main Entry ──────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        banner()
        print(f"""
{Color.WHITE}Usage:{Color.RESET}
  {Color.CYAN}python launcher.py{Color.RESET} <attack> --target <ip> [options]
  {Color.CYAN}python launcher.py{Color.RESET} {Color.YELLOW}list{Color.RESET}              Show active attacks
  {Color.CYAN}python launcher.py{Color.RESET} {Color.YELLOW}stop{Color.RESET}              Stop all attacks
  {Color.CYAN}python launcher.py{Color.RESET} {Color.YELLOW}stop <id>{Color.RESET}        Stop specific attack

{Color.WHITE}Attacks:{Color.RESET}""")
        for name, info in ATTACKS.items():
            print(f"  {Color.CYAN}{name:<15}{Color.RESET}  {info['description']}")

        print(f"""
{Color.WHITE}Examples:{Color.RESET}
  {Color.DIM}python launcher.py syn_flood --target 127.0.0.1 --port 80{Color.RESET}
  {Color.DIM}python launcher.py udp_flood --target 127.0.0.1 --port 53 --rate 500{Color.RESET}
  {Color.DIM}python launcher.py dns_tunnel --target 127.0.0.1 --count 200{Color.RESET}
  {Color.DIM}python launcher.py port_scan --target 127.0.0.1 --ports 1-1000{Color.RESET}
  {Color.DIM}python launcher.py beacon --target 127.0.0.1 --port 8080 --interval 5{Color.RESET}
{Color.RESET}""")
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == "list":
        banner()
        list_attacks()
        return
    elif command == "stop":
        banner()
        attack_id = sys.argv[2] if len(sys.argv) > 2 else None
        stop_attacks(attack_id)
        return
    elif command not in ATTACKS:
        banner()
        print(f"{Color.RED}[!] Unknown command: {command}{Color.RESET}")
        print(f"{Color.YELLOW}[*] Available: {', '.join(list(ATTACKS.keys()) + ['list', 'stop'])}{Color.RESET}")
        sys.exit(1)

    # Parse attack-specific args
    parser = argparse.ArgumentParser(
        prog=f"launcher.py {command}",
        description=f"EKADHARA {command} attack launcher",
    )
    parser.add_argument("--target", required=True, help="Target IP or hostname")

    # Add attack-specific arguments
    attack_info = ATTACKS[command]
    if "port" in attack_info["args"]:
        parser.add_argument("--port", type=int, default=80, help="Target port")
    if "count" in attack_info["args"]:
        parser.add_argument("--count", type=int, default=0, help="Number of packets/beacons (0=unlimited)")
    if "rate" in attack_info["args"]:
        parser.add_argument("--rate", type=float, default=100, help="Packets per second")
    if "size" in attack_info["args"]:
        parser.add_argument("--size", type=int, default=1024, help="Payload size in bytes")
    if "mode" in attack_info["args"]:
        parser.add_argument("--mode", default="random", help="Payload mode")
    if "ports" in attack_info["args"]:
        parser.add_argument("--ports", default="common", help="Port specification")
    if "speed" in attack_info["args"]:
        parser.add_argument("--speed", choices=["slow", "normal", "fast"], default="normal")
    if "method" in attack_info["args"]:
        parser.add_argument("--method", choices=["connect", "syn"], default="connect")
    if "timeout" in attack_info["args"]:
        parser.add_argument("--timeout", type=float, default=2.0, help="Timeout in seconds")
    if "interval" in attack_info["args"]:
        parser.add_argument("--interval", type=float, default=10.0, help="Beacon interval in seconds")
    if "jitter" in attack_info["args"]:
        parser.add_argument("--jitter", type=float, default=0.3, help="Jitter percentage 0.0-1.0")

    args = parser.parse_args()

    banner()
    launch_attack(command, args)


if __name__ == "__main__":
    main()
