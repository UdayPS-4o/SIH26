#!/usr/bin/env python3
"""
EKADHARA Demo Launcher — one-click start for the full SIH demo.

Usage:
    python demo_launcher.py                 # start backend + open browser
    python demo_launcher.py --no-browser    # backend only
    python demo_launcher.py --attack syn    # launch a specific attack after boot
"""
import argparse
import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
FRONTEND_DIR = REPO_ROOT / "frontend"
PORT = 8000
FRONTEND_PORT = 5178

def run(cmd, cwd=None, bg=False, label=""):
    print(f"[DEMO] {'Starting' if bg else 'Running'}: {label or cmd}")
    try:
        if bg:
            p = subprocess.Popen(cmd, cwd=cwd, shell=isinstance(cmd, str))
            time.sleep(1.5)  # let it initialize
            return p
        else:
            subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), check=False)
    except KeyboardInterrupt:
        print(f"\n[DEMO] Stopping {label}...")
        if bg:
            subprocess.run(f"taskkill /F /PID {p.pid}", shell=True, capture_output=True)

def check_deps():
    """Check that required tools are available."""
    issues = []
    # Check python venv
    venv_python = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        issues.append("Backend venv not found. Run: cd backend && python -m venv venv && venv\\Scripts\\pip install -r requirements.txt")
    # Check node_modules
    if not (FRONTEND_DIR / "node_modules").exists():
        issues.append("Frontend deps not found. Run: cd frontend && npm install")
    if issues:
        print("[DEMO] Setup issues found:")
        for i in issues:
            print(f"  ✗ {i}")
        print("[DEMO] Attempting to continue anyway...")

def main():
    parser = argparse.ArgumentParser(description="EKADHARA Demo Launcher")
    parser.add_argument("--no-browser", action="store_true", help="Don't open browser")
    parser.add_argument("--attack", default=None, help="Launch this attack after 5s (syn, udp, beacon, scan, dns, tls, exfil, chain)")
    parser.add_argument("--duration", type=int, default=30, help="Attack duration in seconds")
    parser.add_argument("--frontend-only", action="store_true", help="Start only the frontend (mock mode)")
    args = parser.parse_args()

    print("=" * 60)
    print("  EKADHARA THREAT DETECTION SYSTEM")
    print("  PS-26145 — SIH26 Demo Launcher")
    print("=" * 60)

    check_deps()

    if args.frontend_only:
        print("\n[DEMO] Starting frontend in mock/demo mode...")
        run(f"npm run dev -- --port {FRONTEND_PORT}", cwd=FRONTEND_DIR, label="Frontend Dev Server")
        url = f"http://localhost:{FRONTEND_PORT}"
        print(f"[DEMO] Opening {url}")
        if not args.no_browser:
            webbrowser.open(url)
        return

    # Start backend
    print("\n[DEMO] Starting backend server...")
    venv_python = str(BACKEND_DIR / "venv" / "Scripts" / "python.exe")
    if Path(venv_python).exists():
        backend_cmd = f'"{venv_python}" -m uvicorn server:app --host 0.0.0.0 --port {PORT} --reload'
    else:
        backend_cmd = f'python -m uvicorn server:app --host 0.0.0.0 --port {PORT} --reload'
    backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND_DIR, shell=True)

    # Start frontend
    print("[DEMO] Starting frontend dev server...")
    frontend_proc = subprocess.Popen(
        f"npm run dev -- --port {FRONTEND_PORT}",
        cwd=FRONTEND_DIR, shell=True
    )

    time.sleep(3)

    url = f"http://localhost:{FRONTEND_PORT}"
    print(f"\n[DEMO] ✓ Backend  → http://localhost:{PORT}")
    print(f"[DEMO] ✓ Frontend → {url}")
    print("[DEMO] Press Ctrl+C to stop all services\n")

    if not args.no_browser:
        webbrowser.open(url)

    # Launch attack if specified
    if args.attack:
        print(f"[DEMO] Launching attack '{args.attack}' in 5s...")
        time.sleep(5)
        attack_script = REPO_ROOT / "scripts" / "attack_sim.py"
        subprocess.Popen(
            [sys.executable, str(attack_script), args.attack, "-d", str(args.duration), "-t", "127.0.0.1"],
            shell=(sys.platform == "win32")
        )

    try:
        # Keep running until Ctrl+C
        while True:
            time.sleep(1)
            # Check processes are still alive
            if backend_proc.poll() is not None:
                print("[DEMO] Backend stopped unexpectedly")
                break
            if frontend_proc.poll() is not None:
                print("[DEMO] Frontend stopped unexpectedly")
                break
    except KeyboardInterrupt:
        print("\n[DEMO] Shutting down...")
    finally:
        for p in [backend_proc, frontend_proc]:
            try:
                p.terminate()
                p.wait(timeout=5)
            except:
                pass
        print("[DEMO] All services stopped.")

if __name__ == "__main__":
    main()
