"""
Entry point for the cyber threat detection backend server.

Starts the FastAPI server with uvicorn on 0.0.0.0:8000.
"""

import os
import sys
from pathlib import Path


def main() -> None:
    """Start the threat detection server."""
    project_root = Path(__file__).resolve().parent.parent

    # Add project root so `backend` resolves as a package
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    import uvicorn
    from backend.server import app

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print(f"Starting Cyber Threat Detection Server on {host}:{port}")
    print(f"WebSocket endpoint: ws://{host}:{port}/ws")
    print(f"REST API docs: http://{host}:{port}/docs")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True,
    )


if __name__ == "__main__":
    main()
