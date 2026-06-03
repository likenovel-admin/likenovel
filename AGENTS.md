# LikeNovel - AI Agent Context

웹소설 플랫폼. 유저웹(service) / CMS(cms) / 파트너(partner) 3개 프론트 + FastAPI 백엔드.

---

## 프로젝트 구조

```
service/          # 유저웹 (Next.js 14, axios, Zustand, Pretendard Variable)
partner/          # 파트너 대시보드 (Next.js 15, fetch apiClient, shadcn/ui)
cms/              # CMS 관리자 (Next.js 15, fetch apiClient, shadcn/ui)
likenovel-service-api/likenovel-service-api/fastapi_be_server/   # 백엔드 (FastAPI, SQLAlchemy async, MySQL)
```

## 상세 문서 (반드시 참조)

| 문서 | 경로 | 내용 |
|------|------|------|
| Claude 진입 문서 | `CLAUDE.md` | Claude Code용 브리지. 이 루트 `AGENTS.md`와 `docs/wiki/README.md`를 먼저 읽게 한다. |
| 문서 위키 인덱스 | `docs/wiki/README.md` | 현행 SSOT / legacy / snapshot 문서 분류. 기존 문서 경로는 유지하고 이동하지 않는다. |
| 디자인 시스템 | `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/design-system.md` | Figma 기반 3개 앱 디자인 토큰, 컬러, 타이포, 레이아웃, 컴포넌트 규칙 |
| 프로젝트 메모리 | `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/MEMORY.md` | 아키텍처, 기술스택, 포트, 컨벤션, 최근 작업 이력 |
| 백엔드 API 상세 | `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/backend-api.md` | CQRS 라우터 구조, 엔드포인트 목록 |
| 배포 런북 | `docs/deployment-runbook.md` | 환경별 구동/배포 절차, dev/prod DB 채널, backend CodeDeploy/systemd hard gate, batch/cron runtime 경로 |
| 레거시 backend 배포 메모 | `likenovel-service-api/likenovel-service-api/CLAUDE.md` | 과거 서버 접속/수동 마이그레이션/PM2 메모. 실행 금지, history 참고만 |
| AI 자유질문 계약 | `docs/ai-chat-freeform-contract.md` | freeform 채팅 백엔드 금지사항/허용 책임/read-only agent 계약 |
| 테이블 설명서 (레거시) | `/mnt/c/Users/Hongsan/Downloads/테이블설명서V1.xlsx` | 과거 DB 스키마 참고용 (불일치 시 코드/실DB 우선) |

---

## 작업 고정 규칙 (반드시 준수)
- 코딩 컨벤션은 본 문서의 `코딩 컨벤션` 섹션을 최우선으로 따른다.
- 디자인 관련 작업은 `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/design-system.md`를 기준으로 한다.
- 백엔드 API는 CQRS 패턴을 따른다: `*_query.py` → `/v1/query/`, `*_command.py` → `/v1/command/`.
- 새 테이블/컬럼/인덱스 추가 시 `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/NN-*.sql` 작성 후 `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/models/` ORM 모델을 동기화한다.
- `.env` 파일은 절대 커밋하지 않는다 (`.env*`, 비밀키 포함 파일 포함).
- freeform AI 채팅 백엔드 작업은 `docs/ai-chat-freeform-contract.md`를 반드시 따른다.
- freeform 작업 중 legacy 재사용, allowlist 확장, 응답 계약 변경이 모호하면 추측하지 말고 먼저 사용자에게 질문한다.
- 코드, 운영 절차, 배포 기준, API 계약, DB/배치 정책, UI/디자인 계약이 바뀌어 문서 업데이트가 필요하면 같은 작업 안에서 관련 문서를 반드시 함께 업데이트한다. 채팅 보고만으로 대체하지 않는다.
- 문서 갱신 대상은 변경 영역의 SSOT 문서를 우선한다: agent/작업 규칙은 이 루트 `AGENTS.md`, 배포/운영/dev-prod DB/cron/batch runtime 경로는 `docs/deployment-runbook.md`와 `docs/wiki/deployment-and-batch.md`, freeform 계약은 `docs/ai-chat-freeform-contract.md`, 디자인은 `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/design-system.md`, DB schema는 migration/source 문서다.
- 이전 세션이나 문서 기반 작업을 이어받을 때는 먼저 `docs/wiki/README.md`를 열어 current/legacy/snapshot 분류를 확인한다.
- Claude Code로 작업을 시작하거나 이어받을 때는 루트 `CLAUDE.md`가 이 `AGENTS.md`와 `docs/wiki/README.md`를 가리키는 브리지인지 확인한다. nested `CLAUDE.md`를 프로젝트 SSOT로 착각하지 않는다.
- 배포/DB/cron/batch 관련 작업을 이어받을 때는 `docs/wiki/deployment-and-batch.md`와 `docs/deployment-runbook.md`를 둘 다 읽고, 실제 코드/서버 readback 전에는 legacy 문서나 wiki 요약만으로 실행하지 않는다.
- 기존 문서가 ignored/local-only일 수 있으므로 "git에 추적되지 않음"을 "읽을 수 없음"으로 해석하지 않는다. 로컬 파일 존재 여부와 git 추적 여부를 분리해서 보고한다.
- 문서 업데이트가 필요해 보이지만 범위가 모호하면 구현 완료로 말하지 말고 `문서 갱신 미완료` 또는 `미검증`으로 보고한 뒤 어떤 관련 문서를 갱신해야 하는지 확인한다.
- 모든 실질 작업은 조사, 계획, 구현, 수정 방향 전환 단계마다 사용자와 의논하며 진행한다. 독단적으로 확정하거나 크게 진행하지 않는다.
- 배치/DB/로컬 테스트를 시작하기 전에는 반드시 `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/verified-index.md`와 `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/deployment-env.md`를 먼저 확인한다.
- 로컬 백엔드/배치 테스트의 기본 DB 채널은 `host.docker.internal:13306` (SSH 터널 뒤 dev RDS)로 본다. `3806` Docker MySQL 등 다른 경로를 쓰려면 먼저 사용자 확인을 받는다.
- 테스트 채널, 실행 경로, 재빌드 필요 여부가 조금이라도 모호하면 추측하지 말고 바로 사용자에게 먼저 확인한다.
- 검수 결과는 `critical → high → medium → low` 순서로 정리한다.
- root repo의 `likenovel-service-api/likenovel-service-api` submodule pointer는 기본적으로 커밋하지 않는다. `git add .` / `git add -A` 금지, 항상 명시 경로만 stage한다.
- LikeNovel 평상시 브랜치 전략은 단순하게 유지한다: 모든 기능/버그 수정 커밋은 `origin/main` 기준 작업 브랜치에서만 만들고, `main`에 통합한 뒤 `main -> dev -> prod` 순서로만 배포한다.
- Bart 또는 외부 작업자는 `origin/main` 기준 task branch push까지만 담당한다. `main/dev/prod` 머지와 배포는 우리가 검수 후 수행한다.
- `main`에 이미 통합된 작업 브랜치는 닫힌 것으로 보고 재사용하지 않는다. 같은 이름의 로컬 브랜치가 남아 있어도 그 위에 새 기능/버그 커밋을 얹지 말고, 최신 `origin/main` 기준으로 새 작업을 시작한다.
- 현재 브랜치가 `origin/main` 기준 `ahead`와 `behind`를 동시에 가지면 push/merge 전에 중단하고, local-only 커밋과 origin-only 커밋을 분리해 읽는다. 이미 통합된 브랜치 위에 새 local-only 커밋이 생긴 경우에는 `origin/main` 기준으로 재정렬하고 submodule pointer가 최신 main 기준에서 내려가지 않는지 먼저 확인한다.
- `dev`와 `prod`는 작업 브랜치가 아니라 배포 환경 브랜치다. `dev`/`prod` 기준 브랜치나 `deploy-*dev*`/`deploy-*prod*` 브랜치에는 기능 커밋을 만들지 않는다.
- `deploy-*` 브랜치는 배포/복구 중 임시로만 사용하고 재사용하지 않는다. `clean branch`, patch 이식, 수동 submodule pointer 정렬은 꼬임 복구용 절차이지 평상시 개발 전략이 아니다.
- backend 변경을 운영에 같이 배포해야 하는 경우에는 backend repo의 해당 브랜치(`main`/`dev`/`prod`)에 먼저 커밋·푸시하고, root repo에서는 그 배포된 backend SHA로 pointer를 의도적으로 align하는 별도 커밋을 만든다.
- backend prod 배포에서 GitHub Actions/CodeDeploy 성공은 완료 신호가 아니다. root prod로 넘어가기 전에 반드시 운영 WAS의 실제 gunicorn PID/기동시각, `:3010` listener, prod openapi/route 노출, 필요한 `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/` migration 기록과 `information_schema` 실스키마를 readback한다.
- backend prod 배포 후 새 route/migration이 안 보이면 즉시 root prod 배포를 중단한다. stale gunicorn, stale venv, migration pending을 먼저 해결하고 `자연발동`인지 `강제발동`인지 보고한다.
- backend 배포 중 GitHub Actions가 push 후 60초 안에 matching run/check-suite를 만들지 않거나 `workflow_dispatch`가 HTTP 5xx를 반환하면, 재시도 1회까지만 하고 즉시 GitHub Actions orchestration failure로 판정한다. 이때 Actions를 계속 기다리지 말고 AWS CLI CodeDeploy fallback으로 전환하되, fallback은 `workaround/강제발동`으로 보고하고 `verify_backend_prod_deploy.sh`, systemd MainPID/pidfile, `10.0.100.110:3010` listener, `/health`, AI-reader worker fresh log, prod monitor quick까지 직접 readback해야 완료로 말할 수 있다.
- LikeNovel backend 배포/검증 작업은 Codex skill `/home/hongsan/.codex/skills/likenovel-backend-deploy/SKILL.md`를 먼저 적용한다. 특히 dirty worktree에서 배포 산출물을 만들지 말고, 의도한 commit SHA 기준 임시 디렉터리에서 패키징한다.
- submodule pointer align 커밋은 제목에 `align backend submodule` 또는 동등한 문구를 넣고, 로컬 hook이 요구하면 `ALLOW_SUBMODULE_POINTER_COMMIT=1 git commit ...`로 의도를 명시한다.
- pointer가 dirty로 보이면 다운그레이드/브랜치 불일치 가능성을 먼저 확인한다. 혼동 제거 목적으로 `git submodule update --checkout`을 바로 실행하지 않는다.

### 엔지니어링 원칙 (전역)
- **TDD**: 기능/버그 수정은 실패하는 테스트를 먼저 만들고, 실패를 확인한 뒤 최소 구현으로 통과시킨다. 테스트 없이 production code를 먼저 쓰지 않는다.
- **SSOT**: 코드/DB/설정의 단일 진실원을 먼저 찾고 재사용한다. 같은 상수, 계약, 쿼리, 정책을 새로 복제하지 않는다.
- **DRY**: 의미 있는 중복은 기존 함수/서비스/쿼리/컴포넌트로 모은다. 단, 성급한 추상화로 읽기 어려워지면 하지 않는다.
- **KISS**: 요구를 만족하는 가장 단순한 구조를 우선한다. 새 패키지, 새 인프라, 새 계층은 기존 구조로 해결 불가능할 때만 추가한다.
- **YAGNI**: 지금 명시된 요구와 검증 가능한 리스크에 필요한 것만 만든다. "나중에 쓸 수도 있음"만으로 기능/필드/추상화를 추가하지 않는다.
- **SOLID**: 변경 범위를 작게 유지하고 책임을 분리한다. 특히 UI, 비즈니스 로직, 데이터 접근, 외부 API 호출은 한 파일/함수에 섞지 않는다.

### 브랜치/서브모듈 히스토리 복구 런북
브랜치 히스토리나 submodule pointer가 꼬였을 때는 아래 절차를 SSOT로 따른다.

#### 절대 금지
- `git cherry-pick`으로 main/dev/prod를 맞추지 않는다.
- `git worktree`로 우회 작업하지 않는다.
- public branch에 `git push --force` 또는 force 계열을 쓰지 않는다.
- `git add .` / `git add -A`를 쓰지 않는다.
- `main`/`dev`/`prod` 로컬 브랜치에서 직접 통합 merge를 만들지 않는다. 항상 `origin/<target>` 기준 `integrate/...` 브랜치를 새로 만들어 통합하고, 검증 후 `HEAD:<target>`으로만 push한다.
- Git 명령이 하나라도 실패하면 즉시 중단한다. 실패한 명령 뒤에 merge/push/checkout/reset을 이어서 실행하지 않는다.
- `git reset --ff-only` 같은 존재하지 않는/검증 안 된 명령을 런북 명령처럼 사용하지 않는다. fast-forward 확인은 `merge-base`, 부모 SHA 비교, `git merge --ff-only`처럼 실제 지원되는 명령으로만 한다.
- `;`, 개행 나열, `|| true`로 배포/브랜치 조작 명령을 이어 붙이지 않는다. 꼭 묶어야 하면 `set -e`와 명시적인 검증을 먼저 둔다.
- submodule pointer를 브랜치명(`prod`, `origin/prod`) 감으로 stage하지 않는다. 항상 fetch 후 명시 SHA를 확인한다.
- 기능/버그 수정 커밋을 `dev`/`prod` 또는 `deploy-*dev*`/`deploy-*prod*` 기반에 얹지 않는다. 그런 커밋이 발견되면 그대로 밀지 말고 `origin/main` 기준 작업 브랜치에 필요한 변경만 다시 얹는다.
- 이미 `main`에 merge된 feature/fix 브랜치를 새 작업 브랜치처럼 재사용하지 않는다. 특히 `ahead 1, behind N` 상태에서 local-only 커밋을 그대로 push하지 않는다.

#### 정상화 기본 순서
1. backend repo에서 `main -> dev`를 `--no-ff` merge commit으로 연결한다.
2. backend repo에서 `dev -> prod`를 `--no-ff` merge commit으로 연결한다.
3. root repo에서 `main -> dev`를 `--no-ff` merge commit으로 연결한다.
4. root repo에서 `dev -> prod`를 `--no-ff` merge commit으로 연결한다.
5. 각 단계는 하나씩 끊고, push 전후로 Actions와 모니터링을 확인한다.

#### 보호 브랜치 통합 stop-rule
아래는 2026-05-27 로컬 `main` 오염 사고의 재발 방지 규칙이다. 이 규칙을 어기면 push 전이라도 즉시 중단하고 사용자에게 상태를 보고한다.

1. `main` 반영은 `git switch -c integrate/<topic>-main-<date> origin/main`에서만 한다.
2. `dev` 반영은 `git switch -c integrate/<topic>-dev-<date> origin/dev`에서만 한다.
3. `prod` 반영은 `git switch -c integrate/<topic>-prod-<date> origin/prod`에서만 한다.
4. 통합 merge 후 `git show -s --format='%H%nparents: %P%nsubject: %s' HEAD`를 읽고, 1번 부모가 push 대상 원격 SHA와 정확히 같은지 확인한다.
5. `git diff --stat origin/<target>..HEAD`가 이번 작업의 예상 파일/라인 범위를 넘으면 push하지 않는다.
6. push 직전에는 `git ls-remote --heads origin <target>` 값과 merge commit 1번 부모 SHA를 비교한다. 다르면 push하지 않는다.
7. 잘못된 로컬 merge commit이 생겼고 아직 push 전이면 먼저 `backup/bad-<target>-merge-<date>-<sha>` 브랜치로 보존한 뒤, 원격 기준 integration 브랜치에서 다시 만든다.
8. 로컬 `main`/`dev`/`prod` 포인터가 원격과 다르면, 작업 시작 전에 사용자가 볼 수 있게 보고하고 원격 기준으로 맞춘다.

#### 각 단계 시작 전 lock
아래 항목을 먼저 기록하고, 예상과 다르면 작업을 멈춘다.
```bash
git fetch origin --quiet
git branch --show-current
git status --short --branch
git rev-parse --short origin/main origin/dev origin/prod
for f in CHERRY_PICK_HEAD REBASE_HEAD MERGE_HEAD; do test -e .git/$f && echo $f; done
git merge-base --is-ancestor origin/main origin/dev; echo main_to_dev=$?
git merge-base --is-ancestor origin/dev origin/prod; echo dev_to_prod=$?
```

#### submodule pointer 처리
- root merge에서 submodule conflict가 나면 Git의 자동 제안을 그대로 믿지 않는다.
- backend repo에서 `git fetch origin --quiet` 후 목표 SHA가 양쪽 부모를 포함하는지 확인한다.
```bash
git -C likenovel-service-api/likenovel-service-api fetch origin --quiet
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <old-root-pointer> <target-backend-sha>
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <incoming-root-pointer> <target-backend-sha>
```
- 둘 다 `0`일 때만 아래처럼 명시 SHA로 checkout 후 명시 경로만 stage한다.
```bash
git -C likenovel-service-api/likenovel-service-api checkout --detach <target-backend-sha>
git add likenovel-service-api/likenovel-service-api
```
- submodule local branch가 stale일 수 있으므로 `git checkout prod` 같은 브랜치명 기반 resolve는 금지한다.
- 의도된 pointer 커밋은 hook을 우회하지 말고 의도를 명시한다.
```bash
ALLOW_SUBMODULE_POINTER_COMMIT=1 git commit --no-edit
```

#### push 전 gate
```bash
git fetch origin --quiet
git diff --cached --name-status
git diff --cached --submodule=log -- likenovel-service-api/likenovel-service-api
git diff --cached --check
git diff --name-only --diff-filter=U
git show -s --format='%H%nparents: %P%nsubject: %s' HEAD
```
- 원격 branch SHA가 lock 시점과 달라졌으면 push하지 않는다.
- 허용 파일 외 diff가 있으면 push하지 않는다.
- stale backend SHA나 downgrade SHA가 보이면 push하지 않는다.
- service 변경이 포함되면 `corepack yarn --cwd service build`를 통과해야 한다.
- push 전 레드팀이 critical/high blocker 없음을 확인해야 한다.

#### 이미 꼬였을 때 조치
- merge 중이고 아직 commit 전이면 `git merge --abort` 후 lock 단계부터 다시 시작한다.
- local commit만 만들고 push 전이면 push하지 않는다. diff와 parents를 보고, 사용자 승인 후 local branch를 원격 기준으로 되돌리거나 새 merge commit을 다시 만든다.
- 이미 `main`에 통합된 작업 브랜치 위에 새 local-only 커밋을 만든 경우, 현재 브랜치를 그대로 push하지 않는다. 새 커밋이 공개되지 않았고 local-only가 명확하면 `origin/main` 위로 재정렬하되, 재정렬 후 `git diff --submodule=log origin/main..HEAD -- likenovel-service-api/likenovel-service-api`가 비어 있고 root submodule pointer가 `origin/main`보다 내려가지 않는지 확인한다.
- 이미 잘못 push했다면 force-push로 지우지 않는다. 현재 원격 SHA를 새 lock으로 잡고, 올바른 SHA로 forward-fix merge/align commit을 추가한다.
- backend prod 배포가 CodeDeploy 등으로 version update commit을 추가했으면 root prod pointer는 그 최신 backend prod SHA로 align한다. dev bridge SHA로 내리면 downgrade다.
- 복구 완료 판정은 root/backend 모두에서 아래가 `0`일 때만 한다.
```bash
git merge-base --is-ancestor origin/main origin/dev
git merge-base --is-ancestor origin/dev origin/prod
```

### 에피소드 복구/정합성 판정 원칙
- `raw run signal`은 미해결 판정이 아니다. `2-run`, `3-run`, `inner br`, `dense br` 집계는 신호일 뿐이며, source-truth/복구 이력/현재 화면 검증 전에는 재발·미수리·완료 실패로 단정하지 않는다.
- 복구 판정은 항상 `고친 작품 / 원고 source / 백업 / 적용 회차 / EPUB 재생성 / 표지 포함 / 최종 검증`을 함께 본다. 하나라도 빠지면 `완료`라고 말하지 않는다.
- 원고가 있는 작품은 패턴치환보다 source-truth rebuild를 우선한다. 원고가 없을 때만 회차별 문맥을 보고 selective repair를 판단한다.
- `원문 = 에디터 = 메모장 = EPUB = 뷰어` 정합성을 기준으로 본다. DB/API 값만으로 화면 정합성을 확정하지 않는다.
- 이전에 고친 작품군은 다시 후보로 말하기 전에 백업/적용 기록과 현재 source-like 예외 여부를 먼저 대조한다.
- 에피소드 복구 작업 전후에는 `output/episode-repair-backups/`와 관련 repair ledger 문서를 먼저 확인한다.

### 브라우저 테스트 운영 원칙
- 브라우저 테스트는 반드시 로그인부터 시작한다. 비로그인 상태에서 페이지를 먼저 열고 추정하지 않는다.
- 브라우저 검증은 반드시 정식 유저 플로우로만 진행한다. 기본 순서는 `로그인 → 글쓰기 → 작가 홈 → 작품 카드 → 회차관리 → 회차 행 클릭 → 회차 수정`이다.
- 회차 수정/상세 페이지는 direct URL로 먼저 진입하지 않는다. 반드시 목록에서 실제 행을 클릭해 진입한다.
- 화면 상단의 작품명/회차명, 제목 input, 에디터 본문이 실제로 렌더될 때까지 기다린 후에만 판단한다.
- viewer/에디터는 로딩이 느릴 수 있으므로 본문 iframe, 에디터 content DOM, 표지 토글 직후 상태를 충분히 기다린 뒤 다시 확인한다. 로딩 중간 상태(예: cover-only, 빈 iframe, placeholder)만 보고 실패로 단정하지 않는다.
- iframe 본문이나 에디터 본문이 비어 보이면 즉시 결론내리지 말고 재대기 후 재조회한다. 최소 한 번 이상 같은 세션에서 재확인한 뒤에만 정상/비정상을 판정한다.
- URL 숫자, API 응답, DB 값보다 실제 화면 텍스트를 우선 SSOT로 본다. 화면 확인 전에는 정상/비정상을 단정하지 않는다.
- 작품 하나당 브라우저 세션 하나를 원칙으로 한다. 다른 작품을 확인할 때는 새 세션을 열어 섞지 않는다.
- API/DB 검증은 브라우저 UI 확인 이후의 보조 증거로만 사용한다. UI 확인 전에 API/DB만으로 결론 내리지 않는다.
- 브라우저 검증 결과 보고는 최소한 `계정 / 작품명 / 회차 / 화면에서 실제 보인 제목·본문 상태`를 함께 적는다.

---

## 에이전트 체계

### 역할 매핑 (레거시 `.claude/agents/` 참고)
> `.claude/agents/`는 과거 Claude 워크플로 문서다. 현재 런타임 역할/모델 정책의 SSOT는 이 루트 `AGENTS.md`다.

| 에이전트 | 레거시 참고 파일 | 모델 | 임무 |
|----------|------|------|------|
| default | (본체) | opus | 오케스트레이션: 작업 분해, 에이전트 배정, 리뷰 트리거 판단, 결과 통합 |
| worker | `worker.md` | sonnet | 구현/수정: 최소 변경 원칙, 변경 파일 목록 보고 |
| explorer | `explorer.md` | sonnet | 조사: 코드 경로 추적, 원인 축소, 영향범위 파악 (읽기 전용) |
| reviewer | `reviewer.md` | opus | 기능/회귀 검수 |
| security_reviewer | `security_reviewer.md` | opus | 보안 검수 (reviewer 엔진, 보안 프롬프트) |
| db_guardian | `db_guardian.md` | opus | DB 안정성 검수 |
| maintainability_guard | `reviewer.md` | opus | 유지보수 복잡성 견제, 과도한 방어로직/오버엔지니어링 검수 |
| userweb_fit_reviewer | `reviewer.md` | opus | 유저웹 운영 적합성 검수: 프론트 훅/함수/API 호출, 백엔드 로직, DB 상태전이가 관련 변수 기준으로 매끄럽게 조화를 이루는지 점검 |

### 런타임 모델 배정 규칙
- 메인 롤아웃은 항상 최고 추론 강도로 운용한다. 기본값은 `xhigh`다.
- 서브에이전트는 역할과 관계없이 모두 `gpt-5.4`를 사용하고, 추론 강도는 항상 `high`로 고정한다.
- `default`, `worker`, `explorer`, `reviewer`, `security_reviewer`, `db_guardian`, `maintainability_guard`, `userweb_fit_reviewer`, `monitor`, `performance_profiler` 모두 동일하게 적용한다.
- 레거시 `.claude/agents/*.md` 안의 구형 `opus/sonnet` 표기는 참고자료로만 보고, 실제 실행 모델 결정은 이 루트 `AGENTS.md`를 SSOT로 삼는다.

### 실행 흐름
```
요청 접수
  ├─ 원인 불명확 → explorer 투입 → 결과 보고
  └─ 원인 확정 → worker 배정
                    ↓
              worker 완료 보고 (변경 파일 목록)
                    ↓
              default가 리뷰 트리거 매트릭스 대조
                    ↓
              해당 리뷰어 병렬 실행
                    ↓
              리뷰 결과 취합
              → critical 있으면 worker 재배정
              → 없으면 유저에게 최종 보고
```

### 멀티에이전트 작업 프로토콜 (기본)
모든 실질 작업은 멀티에이전트를 통한 다각도 분석/공격을 기본 절차로 삼는다. 단일 시각으로 바로 구현에 들어가지 않는다.

1. 기존 로그, 에러, 변경 이력, 관련 코드를 토대로 현재 문제와 다음 작업 방향을 멀티에이전트로 분석한다.
2. 분석 결과를 사람이 빠르게 검토할 수 있는 요약문으로 정리한다.
3. 사용자가 요약문을 검토하고 관점을 보강하면, 그 내용을 반영해 다음 작업 계획을 수립한다.
4. 수립된 계획은 구현 전에 반드시 레드팀 관점에서 다시 공격하고, 빈틈·오탐·과한 변경 범위를 보강한다.
5. 보강된 계획을 기준으로 실제 작업 전에 추가로 잠가야 할 지점을 먼저 처리하고, 품질 대비 효율 비교를 통해 ROI가 가장 높은 단 하나의 계획만 남긴다.
6. 최종 계획은 즉시 구현 가능한 품질의 문서/작업안 형태로 정리한 뒤 구현에 들어간다.
7. 구현 후에는 놓친 부분, 불필요한 코드, 중복 로직, 정합성 문제를 정리하는 클리닝 단계를 반드시 수행한다.

### 팀 편성 및 회의 운영 원칙
- 회의와 검토는 리더 1명의 단독 판단으로 끝내지 않는다. 각 팀은 내부적으로 기획, 설계, 구현, 디버깅, 운영 관점을 모두 맡고 있다고 가정한 뒤 의견을 요약한다.
- 사용자가 `기획팀`, `레드팀`, `설계팀`, `디버깅팀`, `운영팀`, 또는 동등한 팀 호출을 명시하면 혼자 팀원 의견을 연기하거나 시뮬레이션하지 않는다. 반드시 실제 sub-agent 도구로 해당 역할들을 호출하고, 도구 사용이 불가능하면 불가능한 이유와 대체 절차를 먼저 보고한다.
- 팀 호출 결과를 보고할 때는 어떤 실제 agent를 어떤 역할로 띄웠는지, 각 agent가 낸 결론이 무엇인지, main 오케스트레이터가 무엇을 수렴했는지를 분리해서 적는다.
- 기본 편성은 아래를 따른다.
  - 기획팀: 2명
  - 설계구현팀: 2~3명
  - 디버깅팀: 2~3명
- 각 팀의 리더는 팀 내부의 다각도 의견을 압축해 전달하는 역할이며, 리더 개인의 취향이나 편향을 팀 결론으로 간주하지 않는다.
- 팀원은 최대한 넓고 창의적으로 가설, 대안, 우회 접근, 사용자 경험 개선 아이디어를 발산한다. 초기에 지나치게 보수적으로 자기검열하지 않는다.
- 리더는 팀원들이 낸 아이디어를 그대로 확장하지 않고, 리스크·복잡도·ROI 기준으로 보수적으로 수렴시킨다.
- main 오케스트레이터는 작업의 복잡도, 리스크, 병목에 따라 남는 리소스를 필요 팀에 동적으로 재배치한다.
- 회의 결과를 정리할 때는 반드시 아래 4축을 함께 본다.
  1. 사용자 체감과 제품 가치
  2. 설계 정합성과 최소수정 가능성
  3. 디버깅 난이도와 회귀 위험
  4. 운영/배포/모니터링 영향
- 어느 한 팀의 관점이 과도하게 주도권을 가져 전체 방향을 왜곡하면, main 오케스트레이터가 다시 범위를 잠그고 우선순위를 재조정한다.

### 기본 레드팀 구성
구현 전/후 레드팀은 아래 4개 관점을 기본 세트로 삼는다. 보안/권한 경계를 건드릴 때만 `security_reviewer`를 추가한다.

1. `reviewer`
- 기능/회귀, 사용자 흐름, 명백한 버그

2. `db_guardian`
- 락, 트랜잭션, 인덱스, 마이그레이션, 배치 안정성

3. `maintainability_guard`
- 유지보수 복잡성, 과도한 방어로직, 오버엔지니어링, 장기 복잡도 증가

4. `userweb_fit_reviewer`
- 유저웹 운영 적합성, 유저웹과의 정합성, 사용자 노출 계약과의 충돌 여부
- 특히 유저웹 프론트의 관련 변수/훅/함수/API 호출로직이 백엔드 처리와 DB 상태전이까지 끊김 없이 이어지는지 본다.

### 레드팀 운영 원칙
- 레드팀의 주임무는 설계 미스, 회귀 위험, 디버깅 포인트, 유지보수 비용 증가를 조기에 찾아내는 것이다.
- 레드팀은 제품 목표나 우선순위를 대체하지 않는다. 서비스PM과 설계구현팀의 진행 자체를 멈추게 하는 것이 목적이 되어서는 안 된다.
- 레드팀 피드백은 가능한 한 최소수정 대안과 함께 제시한다. 문제 제기만 하고 구현 방향을 과도하게 확장하지 않는다.
- 레드팀의 공격이 주가 되어 작업이 과도하게 방어적이거나 복잡해지면, 서비스PM이 ROI 기준으로 범위를 다시 잠근다.
- 레드팀은 새 상태, 새 스키마, 새 UI, 새 추상화 제안을 기본값으로 삼지 않는다. 먼저 기존 구조 안에서 줄일 수 있는 위험부터 찾는다.

### 리뷰 트리거 매트릭스
default는 worker의 변경 파일 보고를 받은 뒤, 아래 기준으로 리뷰어를 선택한다.

| 변경 대상 | reviewer | security_reviewer | db_guardian |
|-----------|:--------:|:-----------------:|:-----------:|
| 프론트 컴포넌트/페이지 | O | | |
| API 라우터 추가/수정 | O | O | |
| 인증/권한 (`auth`, `token`, `role`, `permission`, `middleware`) | O | O | |
| 서비스 레이어 (비즈니스 로직) | O | | |
| 서비스 내 raw SQL (`text("""`) | O | | O |
| `app/models/*.py` (ORM 모델) | | | O |
| `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/*.sql` (마이그레이션) | | | O |
| `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/*.sql` (배치) | | | O |
| `.env`, 설정, 시크릿 관련 | | O | |

**단축 규칙:**
- 변경이 프론트만 → reviewer 단독
- SQL/모델이 하나라도 포함 → db_guardian 필수
- auth 경계를 건드림 → security_reviewer 필수
- 판단 불가 → 3개 다 실행

---

## 코딩 컨벤션

### 공통
- Python: 4 spaces, LF, UTF-8
- JS/TS: 2 spaces, LF, UTF-8
- 에러 무시/삼키기 금지, 로그 또는 사용자 알림 필수
- 새 패키지 추가 전 기존 의존성으로 해결 가능한지 먼저 확인
- 요청하지 않은 기능 추가 금지, 과도한 추상화 금지

### 프론트엔드
- React Query v5 (staleTime: 5000 기본값)
- Tailwind CSS, shadcn/ui (Radix)
- 프론트 API rewrite: `/api/:path*` → 백엔드
- React TDZ 크래시 방지: `const/let` 선언 이전 참조 금지

### 백엔드
- CQRS: `*_query.py` → `/v1/query/`, `*_command.py` → `/v1/command/`
- `app/main.py` `auto_include_routers()`로 라우터 자동 발견/등록
- DB 마이그레이션: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/NN-*.sql` 스크립트 → 앱 시작 시 자동 실행 (`likenovel-service-api/likenovel-service-api/fastapi_be_server/app/utils/auto_migrate.py`)
- 새 테이블 추가 시: SQL 스크립트 + `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/models/` ORM 모델 둘 다 작성

---

## 앱별 기술 차이

| | service (유저웹) | partner/cms |
|---|---|---|
| HTTP | axios (interceptor 토큰 갱신) | fetch 기반 apiClient.ts |
| 색상 | 하드코딩 hex 토큰 (tailwind.config.ts) | shadcn/ui HSL CSS변수 |
| 폰트 | Pretendard Variable | Arial (기본) |
| 간격 | `pxr` 단위 (px→rem) | Tailwind 기본 |
| 반응형 | 모바일 우선 (`md:` = 데스크톱) | 데스크톱 전용 |
| 다크모드 | 없음 | `darkMode: ["class"]` |

---

## 최근 구현 완료 (2026-02-28 기준)

### 1. 비밀번호 재설정 (비로그인, 이메일 링크 기반)
- 백엔드: `POST /v1/command/auth/password/reset/send-code` + `PUT /v1/command/auth/password/reset`
- 스키마: `app/schemas/auth.py` — `PasswordResetSendCodeReqBody`, `PublicPasswordResetReqBody`
- 서비스: `app/services/auth/auth_service.py` — `post_password_reset_send_code()`, `put_public_password_reset()`
- DB: `tb_email_verification_code` (토큰 저장, 5분 TTL)
- 이메일: `app/utils/email.py` — `send_password_reset_email()` (SMTP, Google Workspace)
- 프론트: `service/app/find-password/page.tsx` → `service/app/reset-password/page.tsx`
- API 훅: `usePasswordResetSendEmail()`, `usePublicPasswordReset()`

### 2. CMS 임의계정 발급
- 백엔드: `POST /v1/command/admins/users/create-account`
- 스키마: `app/schemas/admin.py` — `AdminCreateAccountReqBody`
- 프론트: `cms/app/users/page.tsx` — "임의계정 발급" 버튼 + Dialog 모달
- API 훅: `cms/api/user/index.ts` — `useCreateAccount()`

### 3. AI 취향 추천 시스템
- DB: `tb_product_ai_metadata`, `tb_user_taste_profile`
- 백엔드:
  - `app/routers/ai/ai_query.py` — GET 4개 (taste-profile, recommendations, onboarding-products, product-metadata)
  - `app/routers/ai/ai_command.py` — POST 2개 (onboarding, recommend)
  - `app/services/ai/recommendation_service.py` (778줄) — Claude LLM 연동, DNA 매칭
  - `app/schemas/ai_recommendation.py`
- 프론트 (service):
  - `app/api/query/recommendation/` — React Query 훅 5개
  - `components/recommendation/OnboardingModal.tsx` — 2단계 온보딩
  - `components/recommendation/TasteSection.tsx` — 메인 취향 구좌 (캐러셀)
  - `components/recommendation/AiChatRecommend.tsx` — 하단 AI 챗 (프리셋+자유입력)
  - `components/recommendation/TasteDashboard.tsx` — 마이페이지 대시보드
  - `app/page.tsx` — 메인에 통합 완료
- 배치: `scripts/extract_product_dna.py` — 작품 DNA 추출 (Claude API)
- 환경변수: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `R2_SC_CDN_URL`

### 4. DB 자동 마이그레이션
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/utils/auto_migrate.py` — 앱 시작 시 `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/*.sql` 자동 실행
- `app/main.py` lifespan에 연결
- `tb_schema_migration` 테이블로 적용 이력 추적
- MySQL advisory lock으로 멀티워커 안전
- GitHub Actions zip에 `init/` 폴더 포함 (dev/prod 모두 자동 적용)

---

## 보류/미착수 기능

### CMS 선물함 관리
- 작품별 탭: `tb_direct_promotion` 활용, admin-gift 타입
- 유저별 탭: `post_user_giftbook()` 활용, admin_direct acquisition_type
- 백엔드 POST 엔드포인트 2개 + CMS UI 필요

### AI 추천 미완료 항목
- staleTime 캐싱 미설정
- 피드백 루프 미구현
- 스키마 인코딩 정리

---

## 디자인 시스템 핵심 규칙 (요약)

### 유저웹 (service)
- 폰트: Pretendard Variable 단일 (뷰어 제외)
- letter-spacing: -2% 전역
- 컨텐츠: `max-w-[1120px] mx-auto`
- 모바일 패딩: `px-16pxr`, 데스크톱: `md:px-0`
- 카드: `rounded-[10px]`, 모달: `rounded-[20px]`, 버튼: `rounded-lg`
- 색상: 기존 Tailwind 토큰만 사용, 인라인 hex 최소화

### partner/cms
- shadcn/ui 토큰 사용 (`bg-background`, `text-foreground` 등)
- 사이드바 224px, 테이블 행 91px
- 모달: `rounded-[20px]`, shadow `0px 2px 4px rgba(12,33,88,0.1)`
- 페이지네이션: `rounded-[6px]` 버튼

### 절대 금지
- 앱 간 디자인 토큰 혼용 (service ↔ partner/cms)
- Figma 미확인 상태로 새 페이지 디자인
- 새 색상 토큰 임의 추가
- 데스크톱에서 모바일 패딩 남기기

---

## 인프라 요약
- 스테이징: `*.likenovel.dev` (포트 31xx)
- 운영: `*.likenovel.net` (포트 3xxx)
- 백엔드 로컬: `localhost:8000`
- Figma: `Li8iKpIsY9BaDsEEAARbp9` (3 pages: userweb, partner, cms)

## 작업 환경 메모
- 기본 작업 환경: WSL (`/home/hongsan/work/likenovel`)
- Windows 경로는 참고용: `C:\Users\Hongsan\Downloads\likenovel` (WSL로 이관 완료)

## 같은 org의 사내 도구 (likenovel-saas)

[likenovel-saas](https://github.com/likenovel-saas) — 사내 SaaS/유틸 도구 모음 (samkok24 owner, Free plan, 2026-05-10 신설). 운영 코어인 `likenovel-admin` user 계정과 분리해서 권한·시크릿·과금 경계를 명확히 했음.

| 리포 | 로컬 경로 | 스택 | 용도 |
|------|-----------|------|------|
| [autoshort](https://github.com/likenovel-saas/autoshort) | `~/work/autoshort` | Next.js + Python uv (monorepo) | 회차 본문 → 5줄 요약 → t2i → first_frame → LTX i2v → 15-25초 숏폼 자동화. M1 진행 중 |
| [vidcut](https://github.com/likenovel-saas/vidcut) | `~/work/vidcut` | Electron + Whisper STT + FFmpeg | Vrew 스타일 영상 편집기 (자막 편집 = 영상 컷팅) |
| [novel-pd-assistant](https://github.com/likenovel-saas/novel-pd-assistant) | `~/work/novel-pd-assistant` | Node + DeepSeek / OpenRouter | 작가 영업 자동화 (네이버 베스트리그 판타지 → 감상평 → 메일머지). 별도 Claude 세션 운영 |
| [epub-maker](https://github.com/likenovel-saas/epub-maker) | `~/work/epub-maker` | Python + Windows + anaconda | HWP/HWPX → EPUB 변환 |

각 도구 폴더의 `CLAUDE.md` / `README.md` / `PRD.md` / `AGENTS.md`(autoshort)에 상세 컨텍스트.
