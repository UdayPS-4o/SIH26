#!/usr/bin/env python3
"""
EKADHARA Unified Attack Launcher
PS-26145 | SIH 2026 Hackathon Prototype

Main entry point for all attack traffic generators.
Manages background attack threads, lists active attacks, and stops them.

Usage:
    python launcher.py <attack_type> --target <ip> [options]
    python launcher.py list                    # List all active attacks
    python launcher.py stop                    # Stop all attacks
    python launcher.py stop <attack_id>        # Stop specific attack
"""

import argparse
import importlib
import os
import random
import signal
import string
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

# ============================================================
# Constants
# ============================================================
SCRIPT_DIR = Path(__file__).parent

ATTACK_MODULES = {
    'syn_flood': {
        'script': 'syn_flood.py',
        'module': 'syn_flood',
        'name': 'SYN Flood',
        'description': 'TCP SYN flood with spoofed source IPs',
    },
    'udp_flood': {
        'script': 'udp_flood.py',
        'module': 'udp_flood',
        'name': 'UDP Flood',
        'description': 'UDP flood with DNS amplification payloads',
    },
    'dns_tunnel': {
        'script': 'dns_tunnel.py',
        'module': 'dns_tunnel',
        'name': 'DNS Tunnel',
        'description': 'DNS tunneling with DGA subdomains',
    },
    'port_scan': {
        'script': 'port_scan.py',
        'module': 'port_scan',
        'name': 'Port Scanner',
        'description': 'TCP port scanning with concurrent probes',
    },
    'beacon': {
        'script': 'beacon.py',
        'module': 'beacon',
        'name': 'C2 Beacon',
        'description': 'C2 beaconing with periodic TCP connections',
    },
}

# ============================================================
# ANSI Colors
# ============================================================
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
CYAN = "\033[96m"
WHITE = "\033[97m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

# ============================================================
# Active Attack Manager
# ============================================================
class AttackManager:
    """Manages running attack processes and threads."""

    def __init__(self):
        self.attacks = {}  # attack_id -> {process, info}
        self.lock = threading.Lock()
        self._id_counter = 0

    def _generate_id(self):
        """Generate a unique attack ID."""
        with self.lock:
            self._id_counter += 1
            return f"atk_{self._id_counter:03d}"

    def start_attack(self, attack_type, args):
        """Start an attack in a subprocess and return the attack ID."""
        if attack_type not in ATTACK_MODULES:
            print(f"{RED}[ERROR] Unknown attack type: {attack_type}{RESET}")
            return None

        module_info = ATTACK_MODULES[attack_type]
        script_path = SCRIPT_DIR / module_info['script']

        if not script_path.exists():
            print(f"{RED}[ERROR] Script not found: {script_path}{RESET}")
            return None

        # Build command
        cmd = [sys.executable, str(script_path)] + args

        attack_id = self._generate_id()
        start_time = datetime.now()

        # Start process
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=1,
                text=True,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0,
            )
        except Exception as e:
            print(f"{RED}[ERROR] Failed to start attack: {e}{RESET}")
            return None

        with self.lock:
            self.attacks[attack_id] = {
                'process': process,
                'type': attack_type,
                'name': module_info['name'],
                'description': module_info['description'],
                'script': module_info['script'],
                'args': ' '.join(args),
                'pid': process.pid,
                'start_time': start_time,
                'status': 'running',
            }

        print(f"{GREEN}[+] Started attack {attack_id}: {module_info['name']} (PID: {process.pid}){RESET}")
        return attack_id

    def stop_attack(self, attack_id):
        """Stop a specific attack by ID."""
        with self.lock:
            if attack_id not in self.attacks:
                print(f"{YELLOW}[!] Attack not found: {attack_id}{RESET}")
                return False

            attack = self.attacks[attack_id]
            process = attack['process']

            if process.poll() is not None:
                # Already terminated
                attack['status'] = 'terminated'
                print(f"{YELLOW}[!] Attack {attack_id} already stopped.{RESET}")
                return True

            # Try graceful stop first
            try:
                if sys.platform == 'win32':
                    process.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    process.send_signal(signal.SIGTERM)

                # Wait up to 3 seconds
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    # Force kill
                    process.kill()
                    process.wait()
            except Exception as e:
                print(f"{RED}[ERROR] Failed to stop attack: {e}{RESET}")
                # Force kill as fallback
                try:
                    process.kill()
                    process.wait()
                except Exception:
                    pass

            attack['status'] = 'stopped'
            print(f"{GREEN}[+] Stopped attack {attack_id}: {attack['name']}{RESET}")
            return True

    def stop_all(self):
        """Stop all running attacks."""
        with self.lock:
            attack_ids = list(self.attacks.keys())

        stopped = 0
        for attack_id in attack_ids:
            if self.stop_attack(attack_id):
                stopped += 1

        print(f"\n{GREEN}[+] Stopped {stopped} attack(s).{RESET}")

    def list_attacks(self):
        """List all active attacks with their details."""
        with self.lock:
            running = {
                k: v for k, v in self.attacks.items()
                if v['status'] == 'running'
            }

        if not running:
            print(f"{YELLOW}No active attacks.{RESET}")
            return

        now = datetime.now()
        print(f"\n{BOLD}{'='*70}{RESET}")
        print(f"{BOLD}{GREEN}  ACTIVE ATTACKS{RESET}")
        print(f"{BOLD}{'='*70}{RESET}")
        print(f"  {BOLD}{'ID':<10} {'Type':<14} {'PID':<8} {'Target':<20} {'Duration'}{RESET}")
        print(f"  {'-'*66}")

        for attack_id, info in sorted(running.items()):
            # Refresh status
            if info['process'].poll() is not None:
                info['status'] = 'terminated'
                continue

            duration = now - info['start_time']
            dur_str = f"{int(duration.total_seconds())}s"

            # Extract target from args
            target = "N/A"
            args_list = info['args'].split()
            for i, arg in enumerate(args_list):
                if arg == '--target' and i + 1 < len(args_list):
                    target = args_list[i + 1]
                    break

            id_str = f"{BOLD}{CYAN}{attack_id}{RESET}"
            type_str = f"{BOLD}{WHITE}{info['name']:<14}{RESET}"
            pid_str = f"{YELLOW}{info['pid']}{RESET}"

            print(f"  {id_str:<10} {type_str} {pid_str:<8} {target:<20} {dur_str}")

        print(f"{BOLD}{'='*70}{RESET}")
        print(f"  Total active: {BOLD}{GREEN}{len(running)}{RESET}\n")

    def cleanup(self):
        """Stop all attacks and clean up."""
        with self.lock:
            for attack_id, info in list(self.attacks.items()):
                if info['status'] == 'running':
                    try:
                        info['process'].kill()
                        info['process'].wait(timeout=2)
                    except Exception:
                        pass


# ============================================================
# Launcher Banner
# ============================================================
LAUNCHER_BANNER = f"""{BOLD}{MAGENTA}
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ██████╗  █████╗ ██╗    ██╗███╗   ██╗██╗██████╗  ██╗  ║
║   ██╔══██╗██╔══██╗██║    ██║████╗  ██║██║██╔══██╗██║  ║
║   ██████╔╝███████║██║ █╗ ██║██╔██╗ ██║██║██║  ██║██║  ║
║   ██╔═══╝ ██╔══██║██║███╗██║██║╚██╗██║██║██║  ██║██║  ║
║   ██║     ██║  ██║╚███╔███╔╝██║ ╚████║██║██████╔╝██║  ║
║   ╚═╝     ╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═══╝╚═╝╚═════╝ ╚═╝  ║
║                                                          ║
║   Attack Traffic Generator — PS-26145 | SIH 2026        ║
║   Unified Launcher                                       ║
╚══════════════════════════════════════════════════════════╝{RESET}"""


# ============================================================
# Main
# ============================================================
manager = AttackManager()


def cmd_list(args):
    """List all attacks."""
    manager.list_attacks()


def cmd_stop(args):
    """Stop attacks."""
    if args.attack_id:
        manager.stop_attack(args.attack_id)
    else:
        manager.stop_all()


def cmd_launch(attack_type, attack_args):
    """Launch an attack."""
    if attack_type not in ATTACK_MODULES:
        print(f"{RED}[ERROR] Unknown attack type: {attack_type}{RESET}")
        print(f"    Available: {', '.join(ATTACK_MODULES.keys())}")
        return

    module_info = ATTACK_MODULES[attack_type]
    print(f"\n{BOLD}[*] Launching {BOLD}{module_info['name']}{RESET} — {module_info['description']}{RESET}")
    attack_id = manager.start_attack(attack_type, attack_args)
    if attack_id:
        print(f"    {DIM}Use 'python launcher.py list' to see active attacks{RESET}")
        print(f"    {DIM}Use 'python launcher.py stop {attack_id}' to stop this attack{RESET}")
        print(f"    {DIM}Use 'python launcher.py stop' to stop all attacks{RESET}\n")


def cmd_info(args):
    """Show information about available attacks."""
    print(f"\n{BOLD}{GREEN}Available Attack Types:{RESET}\n")
    for key, info in ATTACK_MODULES.items():
        print(f"  {BOLD}{CYAN}{key:<14}{RESET} {info['name']:<16} — {info['description']}")
        print(f"  {DIM}  Script: {info['script']}{RESET}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="EKADHARA Unified Attack Launcher — PS-26145",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
{BOLD}Attack Types:{RESET}
  syn_flood    SYN Flood attack
  udp_flood    UDP flood with DNS amplification
  dns_tunnel   DNS tunneling simulator
  port_scan    TCP port scanner
  beacon       C2 beaconing simulator

{BOLD}Examples:{RESET}
  python launcher.py syn_flood --target 127.0.0.1 --port 8080
  python launcher.py udp_flood --target 127.0.0.1 --port 53 --size 4096
  python launcher.py dns_tunnel --target 127.0.0.1 --domain example.com
  python launcher.py port_scan --target 127.0.0.1 --ports 1-1024 --speed fast
  python launcher.py beacon --target 127.0.0.1 --port 8080 --interval 3
  python launcher.py list
  python launcher.py stop
  python launcher.py stop atk_001
        """
    )

    # Subcommands
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Attack type commands (pass-through to individual scripts)
    for attack_key, module_info in ATTACK_MODULES.items():
        sub = subparsers.add_parser(attack_key, help=f"Launch {module_info['name']}")
        sub.add_argument('--target', required=True, help='Target IP address')
        # We'll collect remaining args
        sub.add_argument('extra', nargs='*', help='Additional arguments passed to the attack script')

    # List command
    subparsers.add_parser('list', help='List active attacks')

    # Stop command
    stop_parser = subparsers.add_parser('stop', help='Stop attacks')
    stop_parser.add_argument('attack_id', nargs='?', default=None, help='Attack ID to stop (omit to stop all)')

    # Info command
    subparsers.add_parser('info', help='Show available attack types')

    # Launcher banner
    print(LAUNCHER_BANNER)
    print(f"\n{RED}{BOLD}[!] LEGAL WARNING:{RESET} Only use against localhost or systems you OWN.\n")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == 'list':
        cmd_list(args)
    elif args.command == 'stop':
        cmd_stop(args)
    elif args.command == 'info':
        cmd_info(args)
    elif args.command in ATTACK_MODULES:
        # Launch the attack — pass all known args + extras
        extra_args = args.extra if hasattr(args, 'extra') else []

        # Build the kwargs for run_attack()
        kwargs = {
            'target': args.target,
        }

        # Parse extra args for common parameters
        i = 0
        while i < len(extra_args):
            arg = extra_args[i]
            if arg == '--port' and i + 1 < len(extra_args):
                kwargs['port'] = int(extra_args[i + 1])
                i += 2
            elif arg == '--count' and i + 1 < len(extra_args):
                kwargs['count'] = int(extra_args[i + 1])
                i += 2
            elif arg == '--size' and i + 1 < len(extra_args):
                kwargs['size'] = int(extra_args[i + 1])
                i += 2
            elif arg == '--interval' and i + 1 < len(extra_args):
                kwargs['interval'] = float(extra_args[i + 1])
                i += 2
            elif arg == '--jitter' and i + 1 < len(extra_args):
                kwargs['jitter'] = int(extra_args[i + 1])
                i += 2
            elif arg == '--domain' and i + 1 < len(extra_args):
                kwargs['domain'] = extra_args[i + 1]
                i += 2
            elif arg == '--ports' and i + 1 < len(extra_args):
                kwargs['ports'] = extra_args[i + 1]
                i += 2
            elif arg == '--speed' and i + 1 < len(extra_args):
                kwargs['speed'] = extra_args[i + 1]
                i += 2
            elif arg == '--rate' and i + 1 < len(extra_args):
                kwargs['rate'] = int(extra_args[i + 1])
                i += 2
            elif arg == '--verbose':
                kwargs['verbose'] = True
                i += 1
            else:
                i += 1

        # Set defaults for known attacks
        if args.command == 'port_scan':
            kwargs.setdefault('ports', '1-1024')
            kwargs.setdefault('speed', 'normal')
        elif args.command == 'dns_tunnel':
            kwargs.setdefault('domain', 'example.com')
        elif args.command == 'beacon':
            kwargs.setdefault('port', 8080)
            kwargs.setdefault('interval', 5.0)
            kwargs.setdefault('jitter', 20)
        elif args.command == 'udp_flood':
            kwargs.setdefault('port', 53)
            kwargs.setdefault('size', 512)
        elif args.command == 'syn_flood':
            kwargs.setdefault('port', 80)

        cmd_launch(args.command, extra_args if extra_args else [])

        # Now run directly by importing and calling run_attack
        sys.path.insert(0, str(SCRIPT_DIR))
        try:
            mod = importlib.import_module(ATTACK_MODULES[args.command]['module'])
            mod.run_attack(**kwargs)
        except KeyboardInterrupt:
            print(f"\n\n{YELLOW}[*] Attack interrupted by user.{RESET}")
        except Exception as e:
            print(f"{RED}[ERROR] {e}{RESET}")
    else:
        parser.print_help()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}[*] Cleaning up...{RESET}")
        manager.cleanup()
        print(f"{GREEN}[+] Done.{RESET}")
