# ─────────────────────────────────────────────────────────────────────────────
# Hita Server — multi-stage Docker build (pnpm monorepo)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: base ────────────────────────────────────────────────────────────
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

# ── Stage 2: install all workspace deps ──────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ── Stage 3: build ───────────────────────────────────────────────────────────
FROM deps AS build
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/
# Generate Prisma client
RUN cd apps/server && npx prisma generate
# Build shared package first, then server
RUN pnpm --filter @hita/shared build
RUN pnpm --filter @hita/server build

# ── Stage 4: production ─────────────────────────────────────────────────────
FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace structure for pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/server/prisma apps/server/prisma
COPY --from=build /app/apps/server/node_modules/.prisma apps/server/node_modules/.prisma
COPY --from=build /app/packages/shared/dist packages/shared/dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "apps/server/dist/server.js"]
