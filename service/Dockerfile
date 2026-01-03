FROM node:20-alpine AS base

WORKDIR /app

COPY package.json yarn.lock* ./
COPY .yarnrc.yml ./

RUN corepack enable

#----
FROM base AS deps

WORKDIR /app

RUN yarn --immutable

#----
FROM base AS build

WORKDIR /app

ARG GENERATE_SOURCEMAP=false
ARG NODE_OPTIONS=--max-old-space-size=16384
ARG ENV_FILE=.env

COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ${ENV_FILE} .env
COPY ${ENV_FILE} .env.production

RUN yarn build

#----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Copy environment files
# - Next.js 서버 런타임에서 `.env` / `.env.production`을 읽어 `process.env`로 로드할 수 있습니다.
# - 특히 IRON_SESSION_PASSWORD, NICE_* 등 서버 전용 값은 런타임에 필요하므로 포함합니다.
COPY --from=build --chown=nextjs:nodejs /app/.env .env
COPY --from=build --chown=nextjs:nodejs /app/.env.production .env.production

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
