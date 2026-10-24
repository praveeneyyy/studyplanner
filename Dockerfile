# ==============================================================================
# Multi-Stage Production Dockerfile for Smart Study Planner & Student IDE
# ==============================================================================

# Stage 1: Build Dependencies & Compile Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install build prerequisites
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./
COPY packages/domain/package*.json ./packages/domain/
COPY packages/shared-schemas/package*.json ./packages/shared-schemas/
COPY packages/api-client/package*.json ./packages/api-client/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies across all npm workspaces
RUN npm ci

# Copy entire source repository
COPY . .

# Generate Prisma Client for database operations
RUN npm run db:generate --workspace=@ai-study/api

# Compile internal packages
RUN npm run build --workspace=@ai-study/domain
RUN npm run build --workspace=@ai-study/shared-schemas
RUN npm run build --workspace=@ai-study/api-client

# Compile production frontend assets
RUN npm run build --workspace=@ai-study/web

# Stage 2: Production Runtime Image
FROM node:20-alpine AS runner

WORKDIR /app

# Ensure security non-root user
ENV NODE_ENV=production
ENV PORT=4000

# Install runtime dependencies for SQLite and language runtimes (Python)
RUN apk add --no-cache openssl python3

# Copy built workspace from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Expose web & API port
EXPOSE 4000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

# Start the unified backend & frontend server
CMD ["node", "apps/api/src/server.js"]
