# Production Dockerfile for Next.js (npm)
FROM node:20-alpine AS base

WORKDIR /app

# Copy lockfile + package.json to leverage Docker layer caching
COPY package.json package-lock.json ./

# --- deps
FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN npm ci

# --- build
FROM base AS build
ARG ENV_FILE=.env
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=16384

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy environment file to both .env and .env.production
COPY ${ENV_FILE} .env
COPY ${ENV_FILE} .env.production

RUN npm run build

# --- runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Copy environment files
COPY --from=build /app/.env .env
COPY --from=build /app/.env.production .env.production

USER nextjs

EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
