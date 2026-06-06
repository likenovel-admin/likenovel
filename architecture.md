# LikeNovel Architecture

> Status: CURRENT OVERVIEW - NOT EXECUTION SSOT
> Source: restored from `likenovel-memory.tar.gz` and current runbook readback
> Last reviewed: 2026-06-06
> For deploy, DB, cron, batch, or runtime changes, use `AGENTS.md`,
> `docs/deployment-runbook.md`, and `docs/wiki/deployment-and-batch.md`.
> If this overview conflicts with source/runtime readback, trust source/runtime.

## System Map

```text
[사용자 브라우저]
   ├── service (유저웹)  ─┐
   ├── partner (파트너)   ├── Nginx (ln-web) ── Docker Compose
   └── cms (CMS 관리)   ─┘          │
                                     │ /api/* rewrite
                                     ▼
                          [FastAPI Backend] (ln-was, t2.small)
                           ├── gunicorn daemon (uvicorn worker, systemd managed)
                           ├── Keycloak 25.0.2 (port 8080, systemd)
                           └── Meilisearch v1.7 (port 7700, systemd)
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              [MySQL 8.0]    [Cloudflare R2]    [PortOne]
               (AWS RDS)      (CDN/Storage)     (결제)
```

## Domains And Ports

### Production (*.likenovel.net)

| Service | Domain | Runtime port | External |
|---|---|---:|---|
| User Web | www.likenovel.net | 3000 | 443 (Cloudflare SSL) |
| Partner | partner.likenovel.net | 3001 | 443 |
| CMS | cms.likenovel.net | 3002 | 443 |
| API | api.likenovel.net | 3010 | 443 |

### Staging (*.likenovel.dev)

| Service | Domain | Runtime port |
|---|---|---:|
| User Web | www.likenovel.dev | 3100 |
| Partner | partner.likenovel.dev | 3101 |
| CMS | cms.likenovel.dev | 3102 |
| API | api.likenovel.dev | 3011 |

### Local

| Service | URL |
|---|---|
| User Web | http://localhost:3000 |
| Partner | http://localhost:3001 |
| CMS | http://localhost:3002 |
| API | http://localhost:8000 |

Additional local backend infrastructure in
`likenovel-service-api/likenovel-service-api/fastapi_be_server/docker-compose.yml`:

- MySQL `3806:3306`
- Keycloak `8080:8080`
- Meilisearch `7700:7700`
- Nginx optional profile `8800:443`

## API Rewrites

- `service/next.config.mjs`: `/api/:path* -> ${NEXT_PUBLIC_API_SERVER_URI}/:path*`
- `partner/next.config.ts`: `/api/:path* -> ${NEXT_PUBLIC_API_URL}/:path*`
- `cms/next.config.mjs`: `/api/:path* -> ${NEXT_PUBLIC_API_URL}/:path*`

## CI/CD

### Frontend (Docker -> ECR)

```text
git push -> GitHub Actions (docker-{dev|prod}.yml)
  1. Checkout
  2. AWS credentials setup
  3. ECR login
  4. GitHub Secrets -> .env.production
  5. Docker build (ENV_FILE=.env.production)
  6. ECR push ({dev|prod}-latest, {dev|prod}-${SHA})
```

Root workflows:

- `.github/workflows/docker-dev.yml`
- `.github/workflows/docker-prod.yml`
- Legacy user workflows: `.github/workflows/likenovel-user-dev.yml`,
  `.github/workflows/likenovel-user-prod.yml`

### Backend (CodeDeploy)

```text
submodule repo push -> CodeDeploy -> ln-was server
  gunicorn daemon: api (prod, 3010), api-dev (dev, 3011)
  boot auto-start: systemd units (likenovel-api, likenovel-api-dev)
```

Backend workflows:

- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`
- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml`

## Branch Strategy

- `main`: documentation and SSOT management
- `dev`: staging deployment -> ECR `:dev-latest`
- `prod`: production deployment -> ECR `:prod-latest`
- Backend submodule: separate repository with dev/prod branches

Before branch/deploy work, verify the current rules in `docs/deployment-runbook.md`.

## Nginx Routing (ln-web)

- Host-based routing to the relevant container port
- Separate server blocks for dev/prod domains
- Cloudflare Origin certificate for SSL
- CORS allowlist managed by `$cors_allow` map

## Servers

- **ln-web** (10.0.0.201): Docker Compose for 3 frontend containers + Nginx
- **ln-was** (10.0.100.110, t2.small 2 GiB): FastAPI gunicorn daemon,
  Keycloak, Meilisearch, systemd auto-start
- **RDS**: MySQL 8.0, dev/prod separated

PM2 is not the current default runtime path. If older docs mention PM2, verify
with `docs/deployment-runbook.md` and live server readback first.

## Docker Compose

```yaml
# root docker-compose.yml
services:
  service:  # port 3000
  partner:  # port 3001
  cms:      # port 3002

# backend fastapi_be_server/docker-compose.yml
services:
  mysql:       # port 3806
  keycloak:    # port 8080
  meilisearch: # port 7700
  app:         # port 8000
  nginx:       # port 8800 (Linux only)
```

## External Integrations

| Service | Purpose | SDK/library |
|---|---|---|
| Keycloak | OAuth/JWT auth | httpx + PyJWT |
| PortOne | Payment | portone-server-sdk, @portone/browser-sdk |
| Cloudflare R2 | File storage | boto3 (S3 compatible) |
| Meilisearch | Full-text search | meilisearch SDK |
| Firebase | Push notification | firebase-admin |
| NICE | Identity verification | HTTP API |
| Mailtrap | Email delivery | mailtrap SDK |
| Naver/Kakao/Google/Apple | Social login | OAuth 2.0 |

## auto_migrate

- App startup runs `app/utils/auto_migrate.py` `run_auto_migrations()`.
- `dist/init/*.sql` files are applied in numeric order and tracked in
  `tb_schema_migration`.
- `01`, `02` files are Docker init/manual setup and skipped.
- Existing DDL objects are skipped by MySQL error code where supported.

## Security

- JWT RS256, Keycloak JWKS cached for 5 minutes
- Access token 300s, refresh token 1800s
- bcrypt password hashing
- CORS managed at Nginx level
- SQLAlchemy ORM parameterization
- Input validation: Pydantic backend, React Hook Form + Zod frontend

## Service -> Partner Auth Relay (Planned)

- Problem:
  - `service` and `partner` use different origins and separate auth stores.
  - Direct navigation causes Partner to redirect to `/login`.
- Decision:
  - Add one-time relay auth flow for Service -> Partner settlement/statistics entry.
  - First landing path: `/discover-products`.
  - Relay TTL: `60 seconds`.
- High-level flow:
  1. Service requests relay issue API.
  2. Backend returns one-time relay key.
  3. Service redirects to Partner relay page with the key.
  4. Partner consumes key, stores tokens, marks authenticated.
  5. Partner redirects to `/discover-products`.
