#!/bin/bash
set -e
echo "============================================"
echo "  EKADHARA — Cyber Threat Detection System"
echo "  DockPlay Deployment"
echo "============================================"
echo ""
echo "Building image..."
docker compose build

echo ""
echo "Starting services..."
docker compose up -d

echo ""
echo "Waiting for health check..."
RETRIES=0
MAX_RETRIES=12
until curl -sf http://localhost:8000/api/health > /dev/null 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "FAIL — service did not become healthy in time."
    echo "Check logs: docker compose logs ekadhara"
    exit 1
  fi
  sleep 5
done

echo "OK — service is healthy."
echo ""
echo "Dashboard:   http://localhost:8000"
echo "Health API:  http://localhost:8000/api/health"
echo "WebSocket:   ws://localhost:8000/ws"
echo ""
echo "Logs:    docker compose logs -f ekadhara"
echo "Stop:    docker compose down"
