# Multi-stage build: frontend → lightweight production single container
# No ML models, no heavy deps — just realistic dummy data

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent 2>/dev/null || npm install --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: Minimal Python runtime — no ML, no scipy, no sklearn
FROM python:3.11-slim
WORKDIR /app

# Minimal deps — just fastapi + uvicorn
RUN pip install --no-cache-dir fastapi uvicorn websockets python-multipart

# Copy backend (lite server.py with no ML imports)
COPY backend/ ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

# Single worker — Dokploy has limited resources
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "warning"]
