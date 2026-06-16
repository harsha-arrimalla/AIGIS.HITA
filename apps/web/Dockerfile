# ─────────────────────────────────────────────────────────────────────────────
# Hita Web — multi-stage Docker build (Next.js + pnpm monorepo)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: base ────────────────────────────────────────────────────────────
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

# ── Stage 2: install all workspace deps ──────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile

# ── Stage 3: build ───────────────────────────────────────────────────────────
FROM deps AS build

# Build-time env vars (must be set via --build-arg)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL

COPY packages/shared/ packages/shared/
COPY packages/ui/ packages/ui/
COPY apps/web/ apps/web/

# Build shared packages first, then web
RUN pnpm --filter @hita/shared build
RUN pnpm --filter @hita/web build

# ── Stage 4: production ─────────────────────────────────────────────────────
FROM node:22-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Next.js standalone output — minimal footprint
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static apps/web/.next/static
COPY --from=build /app/apps/web/public apps/web/public

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "apps/web/server.js"]
