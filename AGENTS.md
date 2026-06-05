# LikeNovel Agent Rules

웹소설 플랫폼. 유저웹(`service`) / 파트너(`partner`) / CMS(`cms`) / FastAPI 백엔드 submodule로 구성된다.

## 0) Language And Communication

- 항상 한국어로 답한다.
- 짧고 실행 중심적으로 말한다.
- 요구사항이 충돌하면 가장 최신의 명시 지시를 따른다.
- 검증하지 못한 범위는 `미검증`으로 분리한다.

## 1) Source Of Truth

- 코드베이스와 런타임 readback이 SSOT다. 문서가 코드와 다르면 코드/런타임을 믿고 문서를 고친다.
- 문서 진입 순서:
  1. `AGENTS.md`
  2. `CLAUDE.md`
  3. `docs/wiki/README.md`
  4. 배포/DB/cron/batch 작업이면 `docs/wiki/deployment-and-batch.md`와 `docs/deployment-runbook.md`
- `docs/wiki/`는 인덱스다. 실제 실행은 linked runbook/source file과 코드 readback 후에만 한다.
- `likenovel-service-api/likenovel-service-api/CLAUDE.md`는 legacy backend deploy 메모다. 현재 실행 런북으로 쓰지 않는다.

## 2) Project Map

```text
service/        User web, Next.js 14, axios, Zustand
partner/        Partner dashboard, Next.js 15, fetch apiClient
cms/            CMS admin, Next.js 15, fetch apiClient
likenovel-service-api/likenovel-service-api/fastapi_be_server/
                Backend, FastAPI, SQLAlchemy async, MySQL
```

## 3) Local Runtime

- 로컬 프론트 기준은 root `docker-compose.yml`이다.
- 코드/자산/env 변경 후 사용자가 로컬 확인을 원하면 기본은 Docker rebuild다.

```bash
cd /home/hongsan/work/likenovel
docker compose up -d --build service   # http://localhost:3000
docker compose up -d --build partner   # http://localhost:3001
docker compose up -d --build cms       # http://localhost:3002
```

- 사용자가 `3000`을 말하면 `likenovel-service-local` 컨테이너 기준으로 확인한다. 임시 포트로 우회하지 않는다.
- 다른 포트가 필요하면 먼저 이유와 현재 점유 프로세스를 readback한다.
- `npm run dev`, `yarn dev`, `pnpm dev`, `bun dev`는 사용자가 명시하거나 runbook이 해당 경로를 요구할 때만 쓴다.

## 4) Change Policy

- 최소 범위만 수정한다.
- 관련 없는 refactor, 포맷 정리, 문서 정리를 섞지 않는다.
- 새 패키지/의존성은 사전 승인 없이는 추가하지 않는다.
- 구조화 데이터는 가능한 한 기존 parser/API/DB schema를 사용한다.
- `git add .` / `git add -A` 금지. 항상 exact path만 stage한다.

## 5) Edit Gate

파일을 수정하기 전에는 짧게 아래를 말한다.

- `Why`: 구체적 버그/리스크/요구
- `Scope`: 수정할 파일/영역
- `Impact`: 바뀌는 동작과 비대상 동작
- `Fallback`: 되돌리는 방법

## 6) Branch And Submodule Hygiene

- 기능/버그 브랜치는 해당 작업에 필요한 커밋만 포함한다.
- staging 전 branch purpose 한 문장과 staged file이 그 목적에 맞는지 확인한다.
- root repo와 backend submodule 상태를 분리해서 읽는다.
- submodule pointer 변경은 명시적 readback 후에만 stage한다.

필수 확인:

```bash
git fetch origin --quiet
git status --short --branch
git diff --submodule=log -- likenovel-service-api/likenovel-service-api
git -C likenovel-service-api/likenovel-service-api status --short --branch
```

- backend 변경이 운영에 같이 나가야 하면 backend repo에 먼저 commit/push하고 root repo에서 배포된 backend SHA로 pointer를 align한다.
- parent repo가 submodule remote에 없는 SHA를 가리키게 하지 않는다.
- 로컬 `main`/`dev`/`prod`에서 직접 통합 merge를 만들지 않는다. 필요하면 `origin/<target>` 기준 integration branch에서 작업한다.
- `dev`/`prod`는 작업 브랜치가 아니라 배포 환경 브랜치다.
- `git push --force` 금지.

## 7) Deployment And Runtime Gates

- 배포/DB/cron/batch/account/billing/CMS mutation은 최소 `Tier 2`로 본다.
- prod 영향이 있으면 `prod impact: yes/possible`을 명시한다.
- backend prod 배포 완료는 Actions/CodeDeploy/`/health` 단독으로 말하지 않는다.
- backend prod 완료 기준:
  - CodeDeploy success
  - `verify_backend_prod_deploy.sh`
  - systemd MainPID/pidfile
  - `10.0.100.110:3010` listener
  - `/health`
  - 필요한 route/schema/migration readback
  - AI-reader worker fresh cycle, 해당 시
  - prod monitor quick
- GitHub Actions가 push 후 60초 안에 matching run/check-suite를 만들지 않거나 `workflow_dispatch`가 HTTP 5xx면 재시도 1회 후 orchestration failure로 보고하고 fallback을 분리한다.

## 8) DB And Batch

- 로컬 백엔드/배치 검증 기본 DB 채널은 `host.docker.internal:13306`이다. 이는 SSH tunnel 뒤 dev RDS다.
- `localhost:3806` Docker MySQL은 별도 로컬 격리 DB다. 기본 검증 채널로 가정하지 않는다.
- DB/cron/batch 작업 전에는 `docs/wiki/deployment-and-batch.md`, `docs/deployment-runbook.md`, backend batch source를 읽는다.
- batch/log 판정은 최근성, exit code, DB row/readback 기준으로 한다. 타임스탬프 없는 grep으로 정상/실패를 단정하지 않는다.

## 9) Documentation Rules

- 코드, API 계약, DB/배치 정책, 배포 절차, 운영 기준, UI/디자인 계약이 바뀌면 같은 작업 안에서 관련 문서를 갱신한다.
- 채팅 보고는 문서 갱신을 대체하지 않는다.
- 문서 갱신 대상:
  - agent/작업 규칙: `AGENTS.md`
  - Claude entry: `CLAUDE.md`
  - deploy/DB/cron/batch: `docs/deployment-runbook.md`, `docs/wiki/deployment-and-batch.md`
  - freeform AI chat: `docs/ai-chat-freeform-contract.md`
  - current/legacy 분류: `docs/wiki/README.md`, `docs/wiki/current-ssot.md`, `docs/wiki/legacy-and-snapshot-docs.md`
  - DB schema: backend migration/source, tracked schema docs where present
- local-only 문서가 읽히더라도 current SSOT로 취급하지 않는다. 파일 존재와 git tracking을 분리해서 보고한다.
- 문서만 바꾼 작업은 runtime test 대신 edited section readback, `git diff --check`, status/staged file 확인으로 검증한다.

## 10) Engineering Discipline

- 코드 작성/리뷰/refactor에는 `karpathy-guidelines`를 적용한다.
- 단순성 우선: 지금 명시된 요구와 검증 가능한 리스크에 필요한 것만 만든다.
- TDD 우선: 기능/버그 수정은 가능한 한 실패 테스트를 먼저 만들고 통과시킨다.
- `SSOT`, `DRY`, `KISS`, `YAGNI`, `SRP`, `SOC`를 따른다.
- pre-existing dead code나 unrelated cleanup은 발견해도 직접 고치지 말고 보고한다.

## 11) Verification And Reporting

- 완료, 해결, fixed라고 말하려면:
  1. root cause가 구체적이어야 한다.
  2. 필요한 최소 변경만 있어야 한다.
  3. 실패했을 테스트 또는 문서 readback이 있어야 한다.
  4. 관련 검증 명령이 실제로 통과해야 한다.
  5. 인접 edge case를 확인해야 한다.
  6. 못 한 검증은 `미검증`으로 표시해야 한다.
- 검수 결과는 `critical -> high -> medium -> low` 순서로 적는다.
- proxy check는 proxy라고 말한다.
- UNKNOWN을 정상으로 해석하지 않는다.

## 12) Review Priority

- 먼저 버그, 회귀, 보안, 권한, 데이터 손상, 운영 사고 가능성을 본다.
- 스타일 개선이나 구조 미감은 후순위다.
- 프론트 변경은 실제 route/component/API 흐름과 렌더링 surface를 확인한다.
- DB 변경은 schema, migration idempotency, lock, transaction, rollback 가능성을 확인한다.

## 13) Role Mapping

커스텀 agent type을 만들 수 없는 런타임에서는 builtin 역할로 매핑한다.

| Virtual role | Runtime role |
| --- | --- |
| default | default |
| worker | worker |
| explorer | explorer |
| monitor | monitor |
| reviewer | reviewer |
| sub_orchestrator | default |
| security_reviewer | reviewer |
| performance_profiler | performance_profiler |
| db_guardian | db_guardian |
| release_manager | default |
| documentation_curator | worker |
| test_engineer | worker |

하위 에이전트를 쓸 때 첫 줄에 `[ROLE: <virtual_role>]`를 넣는다.

## 14) Browser Verification

- 브라우저 검증은 가능한 한 실제 사용자 플로우로 한다.
- 로그인 필요한 화면은 로그인 상태부터 확인한다.
- direct URL만으로 정상 판정하지 않는다.
- viewer/editor/iframe은 로딩 후 재대기하고 실제 텍스트 surface를 확인한다.
- 보고에는 계정, 작품명, 회차, 실제 화면에서 보인 상태를 적는다.

## 15) LikeNovel Operational Defaults

- 벌크업로드는 실제 CMS/API readback과 schedule stop rule까지 포함한 운영 작업이다.
- episode/content 작업의 SSOT는 `원본 -> DB/editor -> EPUB/R2 -> viewer` 순서로 확인한다.
- 작가명/닉네임/이메일/product_id는 exact match다.
- direct/feature slot 운영은 slot id/name/order/product_ids와 public 노출을 readback한다.
- AI/websochat 작업은 main path, fallback path, system reply path를 분리해서 본다.
- 비용 큰 local cron/batch는 기본 off로 두고, 실행 전 비용/DB 채널/대상 범위를 명시한다.

## 16) Stop Rules

- 최신 사용자 지시가 범위를 줄이면 즉시 구조정리/refactor를 멈추고 검증/요약만 한다.
- 같은 종류의 정리 작업을 2회 이상 반복하려면 새 실패 테스트, 명시 요청, 명시 리스크, 또는 명시 임계치가 있어야 한다.
- green test나 더 나은 구조 가능성만으로 추가 정리를 계속하지 않는다.
