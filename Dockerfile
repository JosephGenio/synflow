# Stage 1: Base - Setup pnpm and workspace
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all workspace packages
COPY packages/server/package.json ./packages/server/
COPY packages/app/package.json ./packages/app/

# Stage 2: Dependencies - Install with build tools for bcrypt
FROM base AS dependencies

RUN apk add --no-cache python3 make g++

# Install with --ignore-scripts to skip the git-based prepare script
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 3: Builder - Compile TypeScript to JavaScript
FROM dependencies AS builder

COPY packages/server ./packages/server

COPY tsconfig.json ./

RUN pnpm --filter @synflow/server build

# Stage 4: Development - Compile and run with tsx
FROM dependencies AS development

# Copy source code and migrations
COPY packages/server ./packages/server
COPY tsconfig.json ./

# Build to create dist folder
RUN pnpm --filter @synflow/server build

WORKDIR /app/packages/server

# Run the built code
CMD ["node", "dist/index.js"]

# Stage 5: Production - Minimal runtime image
FROM node:24-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY --chown=nodejs:nodejs pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy workspace package.json files
COPY --chown=nodejs:nodejs packages/server/package.json ./packages/server/
COPY --chown=nodejs:nodejs packages/app/package.json ./packages/app/

# Install production dependencies only
RUN apk add --no-cache python3 make g++ && \
    pnpm install --prod --frozen-lockfile --ignore-scripts && \
    apk del python3 make g++

# Copy built application from builder stage
COPY --chown=nodejs:nodejs --from=builder /app/packages/server/dist ./packages/server/dist

# Copy migration SQL files
COPY --chown=nodejs:nodejs packages/server/migrations ./packages/server/migrations

# Switch to non-root user
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --spider --quiet http://localhost:3001/health || exit 1

CMD ["node", "packages/server/dist/index.js"]
