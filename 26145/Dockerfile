# Multi-stage build: frontend → production single container
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production --silent || npm install --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: Production runtime image
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy built frontend static files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create logs directory
RUN mkdir -p /app/logs

# Expose port (FastAPI serves both API/WS and frontend)
EXPOSE 8000

# Run with uvicorn — 2 workers for reliability
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "info"]
