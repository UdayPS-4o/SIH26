# Multi-stage build: frontend + backend in one container
FROM python:3.11-slim AS python-base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

# ═══════════════════════════════════════════════════════════════════════
# Stage 2: build frontend
# ═══════════════════════════════════════════════════════════════════════
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ═══════════════════════════════════════════════════════════════════════
# Stage 3: final runtime image — EGRESS-LOCKED
# ═══════════════════════════════════════════════════════════════════════
FROM python:3.11-slim
WORKDIR /app

# ── Security hardening ──────────────────────────────────────────────────
# 1. Drop ALL capabilities
# 2. Read-only root filesystem (writable /tmp, /run only)
# 3. No-new-privileges
# 4. seccomp profile denying connect/sendto/sendmsg/sendmmsg
# 5. Network namespace: none (container cannot initiate any TCP/UDP)
# 6. Non-root user

# Install runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r watchtower && useradd -r -g watchtower -d /app -s /sbin/nologin watchtower

# Copy Python packages from stage 1
COPY --from=python-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-base /usr/local/bin /usr/local/bin

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist/ ./frontend/dist/

# Seccomp profile: deny all outbound socket operations
# This is the kernel-level enforcement of the unidirectional constraint.
# Allowed: socket(AF_PACKET) for capture, read, poll, epoll_wait, etc.
# Denied: connect(2), sendto(2), sendmsg(2), sendmmsg(2), socket(AF_INET/AF_INET6) for outbound
COPY docker/seccomp-profile.json /etc/watchtower-seccomp.json

# Switch to non-root
RUN chown -R watchtower:watchtower /app
USER watchtower

EXPOSE 8000

# Container runs with:
#   --read-only
#   --cap-drop ALL
#   --security-opt no-new-privileges
#   --security-opt seccomp=/etc/watchtower-seccomp.json
#   --network none  (no network namespace at all — only AF_PACKET via --pid=host)
#
# For the demo, use:  --network bridge --publish 8000:8000
#   (seccomp still blocks all outbound connect())
CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
