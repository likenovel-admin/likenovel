FROM node:20-alpine AS base

WORKDIR /app

# Enable corepack for yarn
RUN corepack enable

# Copy package.json and yarn.lock
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
FROM base AS deps
WORKDIR /app

RUN yarn install

# Build the application
FROM base AS build
WORKDIR /app

ARG GENERATE_SOURCEMAP=false
ARG NODE_OPTIONS=--max-old-space-size=16384
ARG ENV_FILE=.env

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NOTE:
# - 운영/스테이징 환경변수는 빌드 시점에 필요한 값이 존재합니다(특히 NEXT_PUBLIC_*).
# - CI에서 `.env.production`을 생성한 뒤 `--build-arg ENV_FILE=.env.production`으로 전달하는 방식을 권장합니다.
COPY ${ENV_FILE} .env
COPY ${ENV_FILE} .env.production

RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app .

EXPOSE 3001

CMD ["yarn", "start"]
