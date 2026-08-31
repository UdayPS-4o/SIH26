#!/bin/bash
# ============================================================
# Samdarshi SIH 2026 — Quick Start (macOS / Linux)
# ============================================================
set -e

# Make sure .env exists
if [ ! -f .env ]; then
    echo "[setup] .env not found — copying from .env.example"
    cp .env.example .env
fi

echo "[start] Building and starting Samdarshi prototype..."
docker-compose up -d --build

echo ""
echo "============================================================"
echo "  Samdarshi Prototype Started!"
echo "  Kiosk UI : http://localhost:8080"
echo "  API      : http://localhost:8080/api"
echo "  Health   : http://localhost:8080/health"
echo "============================================================"
echo ""
echo "Tail logs with:  docker-compose logs -f"
echo "Stop with     :  docker-compose down"