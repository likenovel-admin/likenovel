# LikeNovel Architecture
Last updated: 2026-02-18

> Status: CURRENT OVERVIEW - NOT EXECUTION SSOT
> Last reviewed: 2026-06-03
> For deploy, DB, cron, or batch work, use `AGENTS.md`,
> `docs/deployment-runbook.md`, and `docs/wiki/deployment-and-batch.md`.
> If this overview conflicts with code/runtime readback, trust code/runtime.

## 1) 시스템 구성
- 웹 3개 프론트: `service`, `partner`, `cms`
- 백엔드 1개: `likenovel-service-api/likenovel-service-api/fastapi_be_server`
- 프론트는 Next.js 서버를 API 게이트웨이처럼 사용하고, 실 API는 FastAPI로 전달합니다.

## 2) 도메인/포트
| 구분 | 로컬 | 스테이징(문서 기준) | 운영(문서 기준) |
| --- | --- | --- | --- |
| User Web | `localhost:3000` | `likenovel.dev` -> `3100` | `likenovel.net` -> `3000` |
| Partner Web | `localhost:3001` | `partner.likenovel.dev` -> `3101` | `partner.likenovel.net` -> `3001` |
| CMS Web | `localhost:3002` | `cms.likenovel.dev` -> `3102` | `cms.likenovel.net` -> `3002` |
| API | `localhost:8000` | `api.likenovel.dev` | `api.likenovel.net` |

추가 로컬 백엔드 인프라(`likenovel-service-api/likenovel-service-api/fastapi_be_server/docker-compose.yml`):
- MySQL `3806:3306`
- Keycloak `8080:8080`
- Meilisearch `7700:7700`
- Nginx(옵션 profile) `8800:443`

## 3) 앱별 API Rewrite
- `service/next.config.mjs`: `/api/:path* -> ${NEXT_PUBLIC_API_SERVER_URI}/:path*`
- `partner/next.config.ts`: `/api/:path* -> ${NEXT_PUBLIC_API_URL}/:path*`
- `cms/next.config.mjs`: `/api/:path* -> ${NEXT_PUBLIC_API_URL}/:path*`

## 4) 배포/CI-CD
루트(프론트):
- `.github/workflows/docker-dev.yml`
- `.github/workflows/docker-prod.yml`
- 레거시: `.github/workflows/likenovel-user-dev.yml`, `.github/workflows/likenovel-user-prod.yml`

백엔드(서브모듈):
- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`
- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml`

현재 가이드 기준 흐름(실행 전 runbook/source readback 필수):
- 프론트: Docker 이미지 빌드/푸시 후 Compose 재기동
- 백엔드: CodeDeploy 기반 배포

## 5) 외부 연동 서비스
`app/const.py` 기준:
- Keycloak: 인증/JWT
- Cloudflare R2: 이미지/첨부/EPUB 저장소
- Meilisearch: 검색
- PortOne: 결제
- NICE: 본인인증
- SNS OAuth: Naver/Kakao/Google/Apple

## 6) 주요 인프라 파일
- `docker-compose.yml`
- `service/prod.docker-compose.yml`
- `partner/prod.docker-compose.yml`
- `cms/docker-compose.prod.yml`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/docker-compose.yml`
- `DEPLOYMENT.md` (frontend Docker/staging background only)
- `docs/deployment-runbook.md` (execution runbook)
- `docs/wiki/deployment-and-batch.md` (DB/cron/batch quick index)

## 7) 확인 필요
- 운영 실서버 호스트(`ln-web`, `ln-was`)와 최신 네트워크/배포/DB/cron 상태는
  `DEPLOYMENT.md` 단독 기준이 아닙니다. 실행 전 `docs/deployment-runbook.md`,
  `docs/wiki/deployment-and-batch.md`, 관련 source script, live server readback을
  함께 확인해야 합니다.

## 8) Service -> Partner Auth Relay (Planned)
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
