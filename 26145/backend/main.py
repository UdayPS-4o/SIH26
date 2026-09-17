"""
Entry point for the cyber threat detection backend server.

Starts the FastAPI server with uvicorn on 0.0.0.0:8000.

Usage:
    python main.py                          # normal start
    python main.py --self-test-egress       # run egress audit then exit
"""

import os
import sys
from pathlib import Path

# Fix Windows console encoding for Unicode characters
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


def main() -> None:
    """Start the threat detection server or run security self-test."""
    project_root = Path(__file__).resolve().parent.parent

    # Add project root so `backend` resolves as a package
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    # Handle egress self-test flag
    if "--self-test-egress" in sys.argv:
        from backend.self_test import run_self_test_blocking
        print("Running egress self-test...")
        run_self_test_blocking()
        return

    import uvicorn
    from backend.server import app

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print("╔══════════════════════════════════════════════════════════╗")
    print("║              WATCHTOWER / EKADHARA                       ║")
    print("║     AI-Based Unidirectional Threat Detection             ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print("║  Enclave mode: READ-ONLY (no return path)                ║")
    print("║  Capture:    passive (PCAP/AF_PACKET/NetFlow)           ║")
    print("║  Decryption: NONE (TLS/JA4 metadata only)               ║")
    print("║  Processing: streaming (not batch)                       ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print(f"║  Dashboard:  http://{host}:{port}                       ║")
    print(f"║  API docs:   http://{host}:{port}/docs                  ║")
    print(f"║  WebSocket:  ws://{host}:{port}/ws                      ║")
    print(f"║  Sec test:   http://{host}:{port}/api/security/self-test ║")
    print("╚══════════════════════════════════════════════════════════╝")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True,
    )


if __name__ == "__main__":
    main()
