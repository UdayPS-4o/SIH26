#!/bin/bash
# Build and deploy EKADHARA
set -e

echo "Building EKADHARA Docker image..."
docker compose build

echo "Starting EKADHARA container..."
docker compose up -d

sleep 5

echo "Checking health..."
if curl -sf http://localhost:8000/api/health > /dev/null; then
    echo "OK"
else
    echo "FAIL"
fi

echo ""
echo "Dashboard: http://<host>:8000"
