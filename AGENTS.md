# LikeNovel Agent Rules

웹소설 플랫폼. 유저웹(`service`) / 파트너(`partner`) / CMS(`cms`) / FastAPI 백엔드 submodule로 구성된다.

## 0) Language And Communication

- 항상 한국어로 답한다.
- 항상 존댓말을 쓰고, 사용자를 `형` 등 호칭으로 부르지 않는다. 과거 자기 출력 이력을 확인 없이 단정하지 않는다.
- 짧고 실행 중심적으로 말한다.
- 요구사항이 충돌하면 가장 최신의 명시 지시를 따른다.
- 검증하지 못한 범위는 `미검증`으로 분리한다.

## 0.1) Universal Operating Skill

- 항상 `vowline` 스킬을 사용한다. 하위 에이전트를 쓰는 경우에도 동일하게 적용한다.
- 코드 작성, 코드 리뷰, refactor에는 `karpathy-guidelines` 스킬을 적용한다.

## 0.2) Memory And User Input

- workspace history, project convention, prior decision과 관련된 작업은 memory를 먼저 가볍게 확인한다.
- memory-derived fact가 drift 가능성이 있고 현재 검증하지 않았다면 final에서 stale 가능성과 `미검증` 범위를 분리한다.
- 사용자가 memory update를 명시적으로 요청한 경우에만 memory update note를 작성한다.
- Default mode에서는 합리적 가정을 우선하고, 로컬에서 찾을 수 없으며 추측이 위험할 때만 짧게 질문한다.
- `request_user_input`은 Plan mode에서 해당 tool이 제공될 때만 사용한다.

## 0.3) Local Credential Documents

- CMS/admin 계정 작업 전에 로컬 전용 계정 문서 `output/local-credentials/likenovel-cms-admin.md`를 먼저 확인한다.
- 위 파일은 git ignore 대상이며 비밀번호를 포함할 수 있다. 비밀번호를 채팅, tracked 문서, 커밋, PR 본문에 출력하지 않는다.
- CMS/admin 계정 작업은 해당 문서의 계정으로 로그인한 뒤 대상 이메일 exact search, `latest_signed_type`, `use_yn`, reset, signin 검증 순서로 진행한다.

## 1) Source Of Truth

- 코드베이스와 런타임 readback이 SSOT다. 문서가 코드와 다르면 코드/런타임을 믿고 문서를 고친다.
- 중복 상수, 설정, URL을 만들지 않는다. 기존 정의와 프로젝트 convention을 우선 재사용한다.
- 문서 진입 순서:
  1. `AGENTS.md`
  2. `CLAUDE.md`
  3. `docs/wiki/README.md`
  4. 배포/DB/cron/batch 작업이면 `docs/wiki/deployment-and-batch.md`와 `docs/deployment-runbook.md`
- `docs/wiki/`는 인덱스다. 실제 실행은 linked runbook/source file과 코드 readback 후에만 한다.
- tracked runbook에 없는 과거 맥락은 로컬 reference `docs/reference/backup-memory/README.md`를 확인할 수 있다. 이는 historical/local reference이며, current 사실로 말하기 전에 코드/런타임으로 검증하고 민감정보는 인용하지 않는다.
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
- Docker rebuild 후에는 `docker ps`와 해당 localhost URL 응답을 확인한다.

## 4) Change Policy

- 최소 범위만 수정한다.
- 관련 없는 refactor, 포맷 정리, 문서 정리를 섞지 않는다.
- 새 패키지/의존성은 사전 승인 없이는 추가하지 않는다.
- 구조화 데이터는 가능한 한 기존 parser/API/DB schema를 사용한다.
- `git add .` / `git add -A` 금지. 항상 exact path만 stage한다.
- 기능 브랜치에는 해당 기능, 버그픽스, 배포 가능한 review 단위에 필요한 commit만 포함한다.
- staging 전 branch purpose를 한 문장으로 말하고, 변경 파일이 그 목적에 맞는지 확인한다.
- unrelated work가 보이면 멈추고 별도 브랜치로 분리하거나 unstaged로 둔다. 이미 local에 있다는 이유로 섞지 않는다.
- `hotfix`, `긴급`, `prod 수정`, `빨리 고쳐` 성격이면 요청 범위 밖의 refactor, 스타일 수치 변경, SSOT 추출을 하지 않는다.
- 병렬/반복 shell 명령이나 destructive 명령은 각 명령의 working directory를 명시적으로 고정한다.

## 5) Edit Gate

파일을 수정하기 전에는 짧게 아래를 말한다.

- `Why`: 구체적 버그/리스크/요구
- `Scope`: 수정할 파일/영역
- `Impact`: 바뀌는 동작과 비대상 동작
- `Fallback`: 되돌리는 방법

## 5.1) Safety And Reward Hacking Ban

- 중요한 error를 조용히 무시하지 않는다.
- 위험한 path에는 명시적 guard와 이해 가능한 log를 둔다.
- 성공처럼 보이는 것보다 실제 사용자 목표 충족을 우선한다.
- fix, 정책, 분기 조건 권고는 관련 코드 fact를 본문까지 확인한 후에 단정한다. billing/quota/auth 같은 다단계 로직은 frontend hint와 backend authoritative check를 분리해 모든 조건을 잡고, 한 조건만 보고 단순화하지 않는다.
- 검증, 배포, cleanup, monitoring, root cause 확정은 실제로 수행하고 evidence를 확인한 경우에만 주장한다.
- 어려운 검증을 쉬운 proxy check로 대체하지 않는다. proxy만 수행했다면 반드시 `proxy check`라고 말한다.
- uncertainty, partial failure, skipped test, stale assumption, 불편한 evidence를 숨기지 않는다.
- 사용자 요청이 이미 처리됐거나 blocked인데 생산적으로 보이려고 self-assigned work를 계속 만들지 않는다.
- 이전 행동이 틀렸다면 멈추고, 실수를 구체적으로 명명하고, evidence를 보존한 뒤 가장 안전한 복구 경로를 제안한다.

## 5.2) Lightweight Work Harness

- `/home/hongsan/work` 아래 모든 프로젝트에 적용한다.
- non-trivial work 시작 전 work tier를 짧게 분류한다.
  - `Tier 0`: text-only, read-only, trivial formatting.
  - `Tier 1`: local code/config change with normal tests.
  - `Tier 2`: deploy, production data, account, billing, email, batch, external API operation.
  - `Tier 3`: bulk/irreversible/high-blast-radius work such as mass upload, mass email, payment/account mutation, DB migration, production rollback.
- production, user data, external account, cost, published content에 영향이 있으면 `reversible` 또는 `one-way door`를 명시한다.
- deploy, DB, batch, CMS/admin, external provider, account, billing, email, public content를 건드리면 `prod impact: none/possible/yes`를 명시한다.
- non-trivial work 완료 보고에는 `검증됨`, `미검증`, `proxy check`, `workaround`, `임시조치`, `강제발동`, `자연발동` 중 해당 tag를 솔직하게 붙인다.
- concrete mistake나 near-miss가 발생하면 active Failure Mode Matrix, skill, memory update path가 있는 경우 등록한다. 등록 전에는 failure mode를 보고하고 다음번 stop-and-check trigger로 취급한다.
- 이 harness를 관료화하지 않는다. ordinary `Tier 0-1` 작업에 ADR, Run Manifest, traceability matrix, cost ledger를 요구하지 않는다.

## 6) Branch Scope, Worktree, And Submodule Hygiene

- 기능/버그 브랜치는 해당 작업에 필요한 커밋만 포함한다.
- staging 전 branch purpose 한 문장과 staged file이 그 목적에 맞는지 확인한다.
- docs cleanup, legacy note, local runbook edit, formatting cleanup, unrelated test, submodule pointer drift를 기능 브랜치에 섞지 않는다.
- root repo와 backend submodule 상태를 분리해서 읽는다.
- active worktree가 dirty이면 worktree로 분리해서 작업할 수 있다.
- Root pre-push의 push 내용 판단 기준은 현재 checkout/index/submodule working tree가 아니라 pre-push stdin의 outgoing ref와 commit SHA다. 단, 현재 worktree에 진행 중인 merge/rebase/cherry-pick이 있으면 push를 차단한다.
- Codex-owned clean integration worktree에서 exact commit을 만들고 검증했다면, 같은 worktree에서 `git push origin <sha>:dev` 또는 `git push origin <sha>:prod`처럼 exact ref로 push할 수 있다. 다른 agent/user-owned worktree는 이 허용 범위에 포함되지 않는다.
- Root `main`/`dev`/`prod` 삭제와 branch non-fast-forward push는 금지한다. 의도된 submodule pointer push도 backend target branch 도달성과 기존 pointer 대비 비후퇴 조건을 통과해야 한다.
- worktree에서 만든 unrelated change는 staging하지 않는다.
- submodule pointer 변경은 `git diff --submodule=log` readback 후에만 stage한다.
- root 로컬 작업은 정상 흐름이지만 submodule drift는 commit/push 전에 차단한다. 새 checkout 또는 hook이 의심되면 `bash devtools/install-git-hooks.sh`를 실행한다.

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
- Root `main`/`dev`/`prod`에는 `--force`와 `--force-with-lease`를 사용하지 않는다. Feature 및 `claude/*` branch는 해당 owner가 범위를 확인한 경우 `--force-with-lease`를 사용할 수 있지만, 무조건 덮어쓰는 `--force`는 사용하지 않는다.
- push 전에는 `git show --stat HEAD`, staged file names, submodule diff가 mixed bag이 아님을 확인한다.

## 6.1) Deploy Merge Conflict Stop Rules

- dev/prod 반영 중 conflict가 나면 "새 설계/새 문서 내용"을 즉석에서 쓰지 않는다.
- conflict resolution은 이미 리뷰된 한쪽 내용 선택, submodule pointer align, 단순 중복 제거처럼 기계적으로 설명 가능한 최소 조치만 한다.
- 문서 add/add conflict가 semantic merge를 요구하면 배포 중에 새 blended 문서를 만들지 말고 멈춰서 사용자에게 선택지를 보고한다.
- submodule conflict는 target 환경에 맞는 remote SHA만 사용한다.
  - dev root pointer: backend `origin/dev`
  - prod root pointer: backend workflow 완료 후 다시 fetch한 backend `origin/prod`
- backend prod workflow가 `version update` 커밋을 만든 경우, root prod pointer는 그 최신 backend `origin/prod` SHA로 맞춘다. 중간 merge SHA나 backend dev SHA를 넣으면 downgrade다.

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
- batch 정상 판정 전에는 `ERROR`, `Traceback`, `1205`, `timeout`, `deadlock`와 마지막 성공 marker를 함께 확인한다.
- processlist에서 batch query가 60초 이상 active이면 정상 완료로 보고하지 않는다.

## 9) Documentation Rules

- 코드, API 계약, DB/배치 정책, 배포 절차, 운영 기준, UI/디자인 계약이 바뀌면 같은 작업 안에서 관련 문서를 갱신한다.
- 채팅 보고는 문서 갱신을 대체하지 않는다.
- 문서 갱신 대상:
  - agent/작업 규칙: `AGENTS.md`
  - Claude entry: `CLAUDE.md`
  - deploy/DB/cron/batch: `docs/deployment-runbook.md`, `docs/wiki/deployment-and-batch.md`
  - freeform AI chat: `docs/ai-chat-freeform-contract.md`, `docs/ai-chat-freeform-state-machine.md`
  - UI/design system: `docs/design-system.md`
  - current/legacy 분류: `docs/wiki/README.md`, `docs/wiki/current-ssot.md`, `docs/wiki/legacy-and-snapshot-docs.md`
  - DB schema: backend migration/source, tracked schema docs where present
- local-only 문서가 읽히더라도 current SSOT로 취급하지 않는다. 파일 존재와 git tracking을 분리해서 보고한다.
- 문서만 바꾼 작업은 runtime test 대신 edited section readback, `git diff --check`, status/staged file 확인으로 검증한다.

## 10) Engineering Discipline

- 코드 작성/리뷰/refactor에는 `karpathy-guidelines`를 적용한다.
- non-trivial work는 assumptions와 tradeoff를 먼저 말한다. 답을 로컬에서 찾을 수 없고 추측이 위험할 때만 묻는다.
- 단순성 우선: 지금 명시된 요구와 검증 가능한 리스크에 필요한 것만 만든다.
- speculative feature, abstraction, configurability, impossible-case handling을 추가하지 않는다.
- 모든 변경 줄은 사용자 요청과 연결되어야 한다. unrelated cleanup은 수정하지 말고 보고한다.
- TDD 우선: 기능/버그 수정은 가능한 한 실패 테스트를 먼저 만들고 통과시킨다.
- `SSOT`, `DRY`, `KISS`, `YAGNI`, `SRP`, `SOC`를 따른다.
- pre-existing dead code나 unrelated cleanup은 발견해도 직접 고치지 말고 보고한다.

## 11) Verification, Reporting, And Issue Resolution Gate

완료, 해결, fixed, closed라고 말하려면 아래가 모두 필요하다.

1. root cause가 구체적이어야 한다.
2. 필요한 최소 변경만 있어야 한다.
3. fix 전 실패했을 test를 추가/갱신했거나, 문서-only 작업은 edited section readback이 있어야 한다.
4. 관련 검증 명령이 실제로 통과해야 한다.
5. 인접 edge case를 확인해야 한다.
6. 못 한 검증은 `미검증`으로 표시해야 한다.
- 하나라도 빠지면 `해결`이 아니라 `부분 조치`, `검증 미완료`, `미검증`처럼 현재 상태를 정확히 말한다.
- 문서-only 작업은 runtime test가 applicable하지 않다고 명시하고 readback, `git diff --check`, status/staged file 확인으로 검증한다.
- 검수 결과는 `critical -> high -> medium -> low` 순서로 적는다.
- proxy check는 proxy라고 말한다.
- UNKNOWN을 정상으로 해석하지 않는다.
- 실제 readback 가능한 항목은 현재 코드, runtime, DB, API, browser, git 상태에서 확인하고 과거 기억이나 의도로 대체하지 않는다.
- 데이터 변경은 DB/API 저장 확인과 CMS/service UI 확인을 분리해서 보고한다.
- 공지, 안내, FAQ, 릴리즈 노트, 이메일에서 UI 문구를 인용할 때는 실제 컴포넌트/route의 표시 문자열을 먼저 확인한다.

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

역할별 목표:

- Global goal은 사용자의 실제 목표를 먼저 좁히고, 작업을 독립 단위로 나눈 뒤, 필요한 경우 병렬로 실행하고 결과를 통합하는 것이다.
- `[ROLE: default]`: 상위 오케스트레이션 전담. 목표 정리, 작업 분배, 승인/중단 판단, 최종 통합만 수행한다.
- `[ROLE: worker]`: 구현 전담. 할당된 파일 범위 안에서 최소 변경으로 구현하고, 테스트/빌드 등 검증 evidence와 변경 파일을 보고한다.
- `[ROLE: explorer]`: 코드 탐색/근거 수집 전담. 구조, 흐름, 리스크, 관련 파일을 근거 중심으로 보고하며 직접 수정하지 않는다.
- `[ROLE: reviewer]`: 회귀, 리스크, 테스트 누락 검토 전담. 버그 가능성, 운영 리스크, 테스트 공백을 우선순위와 파일 위치 중심으로 보고한다.
- `[ROLE: monitor]`: 장시간 작업 대기/상태 모니터링 전담. 실행 중인 테스트, 서버, 배포, 백그라운드 작업의 상태와 막힌 지점을 요약한다.
- `[ROLE: performance_profiler]`: 성능 분석 전담. 병목을 측정 가능한 근거로 찾고 비용 대비 효과가 큰 튜닝 방향을 제안한다.
- `[ROLE: db_guardian]`: DB 안정성 전담. schema, query, transaction, migration의 데이터 안정성과 무결성 리스크를 점검한다.

병렬 실행:

- 사용자가 Codex와 Claude를 동시에 쓰라고 요청하면 역할, 파일 소유권, 검증 명령을 명확히 나눈다.
- 병렬 실행은 서로 독립적인 파일/도메인에서만 사용한다.
- 같은 파일을 여러 에이전트가 동시에 수정하지 않는다.
- 외부 CLI/provider가 설치, 로그인, 권한 문제로 실행 불가하면 가장하지 말고 blocker와 다음 조치를 짧게 보고한다.
- 병렬 결과를 병합하기 전에는 충돌 파일, 중복 수정, 테스트 누락을 확인한다.
- 여러 에이전트가 움직인 경우 최종 응답에 각 역할의 결과, 변경 파일, 검증 결과, 남은 리스크를 합쳐 보고한다.

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
- AI/추천/취향 기능은 7축 DNA codebook, `tb_user_ai_signal_event`, `tb_user_taste_factor_score`, 기존 `recommendation_service`를 먼저 확인한다. 별도 취향 모델이나 자체 추천 테이블을 새로 만들려면 이유를 명시하고 사용자 확인을 받는다.
- 라이크노벨 장르/독자 분포는 일반 한국 웹소설 시장 가정으로 단정하지 않는다. 코드/DB의 16개 장르, 7축 DNA, 실제 통계를 우선한다.
- CMS 사이트 공지는 `docs/cms-notice-runbook.md`를 먼저 읽고, 제목 prefix/장애-해결 쌍/primary 기준을 확인한다.
- 비용 큰 local cron/batch는 기본 off로 두고, 실행 전 비용/DB 채널/대상 범위를 명시한다.

## 16) Stop Rules

- 최신 사용자 지시가 범위를 줄이면 즉시 구조정리/refactor를 멈추고 검증/요약만 한다.
- `/goal`이 열려 있고 목표가 `계속해`, `진행해`, `더 해`, `계속`처럼 open-ended면, 매 slice마다 다음 작업이 사용자의 명시 요구를 직접 더 충족하는지 먼저 확인한다.
- 같은 종류의 정리 작업을 2회 이상 연속 진행하려면 아래 중 하나가 있어야 한다.
  - 실패 테스트가 있고 정리가 실패 해결에 직접 필요함.
  - 사용자가 해당 정리나 refactor를 명시적으로 요청함.
  - 명시된 성능, 안정성, 권한, 보안 리스크가 있고 refactor가 직접 완화 수단임.
  - 명시 임계치가 있음. 예: 파일 길이, 순환 의존, 테스트 불가 구조, 중복 경로.
- green test나 더 나은 구조 가능성만으로 추가 정리를 계속하지 않는다.
- 매 slice 전에는 이번 작업이 해결하는 명시 요구, 늘리는 검증 가능 범위나 사용자 가치, 지금 멈추면 실제로 막히는 요구를 확인한다.
- 위 항목 중 하나라도 약하거나 이전 slice와 실질적으로 같으면 loop 후보로 보고 중단한다.
- completion audit에서는 self-generated backlog를 요구로 간주하지 않는다. 사용자 명시 요구, 실제 실패, 명시 산출물만 다음 작업 근거로 사용한다.
