# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install electron runtime dependencies
RUN apk add --no-cache \
    python3 make g++ \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    libgtk-3.0 libx11 libxcb xdg-utils wget

# Install electron globally
RUN npm install -g electron@28.0.0

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/electron ./electron
COPY --from=builder /app/package*.json ./

CMD ["electron", "."]