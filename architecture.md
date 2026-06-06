# LikeNovel 전체 아키텍처

> Status: CURRENT GUIDE
> Source: restored from `likenovel-memory.tar.gz`
> Use `docs/deployment-runbook.md` before deploy, DB, cron, batch, or runtime changes.

## 시스템 구성도

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

## 도메인 & 포트 맵

### 운영 (*.likenovel.net)

| 서비스 | 도메인 | 컨테이너 포트 | 외부 |
|--------|--------|--------------|------|
| 유저웹 | www.likenovel.net | 3000 | 443 (Cloudflare SSL) |
| 파트너 | partner.likenovel.net | 3001 | 443 |
| CMS | cms.likenovel.net | 3002 | 443 |
| API | api.likenovel.net | 3010 | 443 |

### 스테이징 (*.likenovel.dev)

| 서비스 | 도메인 | 컨테이너 포트 |
|--------|--------|--------------|
| 유저웹 | www.likenovel.dev | 3100 |
| 파트너 | partner.likenovel.dev | 3101 |
| CMS | cms.likenovel.dev | 3102 |
| API | api.likenovel.dev | 3011 |

## CI/CD 파이프라인

### 프론트엔드 (Docker -> ECR)

```text
git push -> GitHub Actions (docker-{dev|prod}.yml)
  1. Checkout
  2. AWS credentials 설정
  3. ECR Login
  4. GitHub Secrets -> .env.production 생성
  5. Docker build (ENV_FILE=.env.production)
  6. ECR push ({dev|prod}-latest, {dev|prod}-${SHA})
```

### 백엔드 (CodeDeploy)

```text
submodule repo push -> CodeDeploy -> ln-was 서버
  gunicorn daemon: api (prod, 3010), api-dev (dev, 3011)
  부팅 자동기동: systemd unit (likenovel-api, likenovel-api-dev)
```

## Git 브랜치 전략

- `main`: 문서/SSOT 관리
- `dev`: 스테이징 배포 -> ECR `:dev-latest`
- `prod`: 운영 배포 -> ECR `:prod-latest`
- 백엔드 submodule: 별도 repo, dev/prod 브랜치

## Nginx 라우팅 (ln-web)

- Host 기반 라우팅 -> 해당 컨테이너 포트 포워딩
- dev/prod 도메인별 별도 server block
- Cloudflare Origin 인증서 (SSL)
- CORS: `$cors_allow` map으로 origin allowlist 관리

## 서버 구성

- **ln-web** (10.0.0.201): Docker Compose (3 프론트 컨테이너) + Nginx
- **ln-was** (10.0.100.110, t2.small 2 GiB): gunicorn daemon (FastAPI) + Keycloak + Meilisearch, systemd 자동기동
- **RDS**: MySQL 8.0 (dev/prod 분리)

PM2는 현재 기본 실행 경로로 보지 않는다. 과거 문서에 PM2 언급이 남아있으면 `docs/deployment-runbook.md`와 실제 server readback으로 현재 경로를 먼저 확인한다.

## Docker Compose (로컬)

```yaml
# 루트 docker-compose.yml
services:
  service:  # port 3000
  partner:  # port 3001
  cms:      # port 3002

# 백엔드 fastapi_be_server/docker-compose.yml
services:
  mysql:       # port 3806
  keycloak:    # port 8080
  meilisearch: # port 7700
  app:         # port 8000
  nginx:       # port 8800 (Linux only)
```

## 외부 서비스 연동

| 서비스 | 용도 | SDK/라이브러리 |
|--------|------|---------------|
| Keycloak | OAuth/JWT 인증 | httpx + PyJWT |
| PortOne | 결제 | portone-server-sdk, @portone/browser-sdk |
| Cloudflare R2 | 파일 스토리지 | boto3 (S3 호환) |
| Meilisearch | 전문 검색 | meilisearch SDK |
| Firebase | 푸시 알림 | firebase-admin |
| NICE | 본인인증 | HTTP API |
| Mailtrap | 이메일 발송 | mailtrap SDK |
| Naver/Kakao/Google/Apple | 소셜 로그인 | OAuth 2.0 |

## auto_migrate (DDL 자동 마이그레이션)

- 앱 시작 시 `app/utils/auto_migrate.py`의 `run_auto_migrations()` 실행
- `dist/init/*.sql` 파일을 번호순으로 자동 적용, `tb_schema_migration` 테이블로 이력 추적
- 01, 02번 파일은 Docker init/수동 셋업이라 skip 대상이다.
- 이미 존재하는 DDL(테이블/컬럼/인덱스)은 MySQL 에러코드로 자동 스킵한다.

## 보안

- JWT RS256 (Keycloak JWKS, 5분 TTL 캐싱)
- Access token 300s, refresh token 1800s
- bcrypt 비밀번호 해싱
- CORS: Nginx 레벨 관리
- SQLAlchemy ORM 파라미터화
- 입력 검증: Pydantic (백엔드), React Hook Form + Zod (프론트)
