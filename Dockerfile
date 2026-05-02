# ── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: Production image ───────────────────────────────────
FROM node:20-alpine AS runner

# Set non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

WORKDIR /app

# Copy only what's needed
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs package.json ./
COPY --chown=nodeuser:nodejs server.js ./
COPY --chown=nodeuser:nodejs src/ ./src/
COPY --chown=nodeuser:nodejs public/ ./public/

USER nodeuser

# Cloud Run injects PORT — default to 8080 (Cloud Run standard)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check so Cloud Run knows when the container is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "server.js"]
