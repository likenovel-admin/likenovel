# LikeNovel Deployment Runbook

> Status: CURRENT EXECUTION RUNBOOK
> If this runbook conflicts with source scripts or live server readback, trust
> source/runtime and update this document in the same task.

Last verified: 2026-05-26
DB/cron/batch code readback: 2026-06-03
Repository root: `/home/hongsan/work/likenovel`
Legacy Windows path: `C:\Users\Hongsan\Downloads\likenovel` (참고용)

## 1) 목적
이 문서는 아래 3가지를 표준 절차로 고정하기 위한 운영 문서다.

1. 로컬 구동 방법
2. `likenovel.dev`(스테이징) 구동 및 업데이트 배포 방법
3. `likenovel.net`(운영) 업데이트 배포 방법
4. 운영 변경 후 문서 갱신 기준

---

## 2) 시스템 구성 요약

| 영역 | 코드 위치 | 배포 트리거 | 현재 배포 방식 | 비고 |
|---|---|---|---|---|
| User Web | `service/` | root repo `dev`/`prod` push | Docker image build/push (ECR) | 워크플로: `docker-dev.yml`, `docker-prod.yml` |
| Partner Web | `partner/` | root repo `dev`/`prod` push | Docker image build/push (ECR) | 동일 |
| CMS Web | `cms/` | root repo `dev`/`prod` push | Docker image build/push (ECR) | 동일 |
| Backend API | `likenovel-service-api/likenovel-service-api/fastapi_be_server` | submodule repo `dev`/`prod` push | CodeDeploy | 워크플로: `deploy_be_actions_dev.yml`, `deploy_be_actions.yml` |

참조 파일:
- root frontend CI: `.github/workflows/docker-dev.yml`, `.github/workflows/docker-prod.yml`
- root legacy user CI: `.github/workflows/likenovel-user-dev.yml`, `.github/workflows/likenovel-user-prod.yml`
- backend CI: `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`, `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml`
- backend CodeDeploy 실행 스크립트: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/appspec.yml`, `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`
- backend 배포 스킬: `/home/hongsan/.codex/skills/likenovel-backend-deploy/SKILL.md`
- verified index: `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/verified-index.md`
- DB/cron/batch quick index: `docs/wiki/deployment-and-batch.md`
- batch source: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/`
- prod batch runtime path: `/home/ln-admin/likenovel/batch`
- dev batch runtime path: `/home/ln-admin/likenovel/batch-dev`

2026-06-03 코드 readback 기준:
- `.github/workflows/docker-dev.yml` and `.github/workflows/docker-prod.yml` deploy only frontend Docker images from the root repo.
- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml` packages dev backend CodeDeploy and replaces package `run_be.sh` with source `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`.
- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml` packages prod backend CodeDeploy, waits for deployment success, then runs `verify_backend_prod_deploy.sh` on ln-was.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh` syncs batch files to `/home/ln-admin/likenovel/batch-dev` but keeps `/etc/cron.d/likenovel-dev` manual.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh` syncs batch files to `/home/ln-admin/likenovel/batch` and guards only selected prod user-crontab lines.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_env.sh` maps `batch-dev` to `/home/ln-admin/likenovel/api-dev/.env`, `batch` to `/home/ln-admin/likenovel/api/.env`, and Docker fallback to `/proc/1/environ`.

주의:
- backend API는 submodule 별도 원격 저장소(`.gitmodules`) 기준으로 배포된다.
- root repo에만 push하면 backend 배포 워크플로는 실행되지 않는다.
- backend dev/prod 배포는 먼저 `likenovel-backend-deploy` 스킬의 Start Lock과 Actions Gate를 적용한다.
- GitHub Actions가 push 후 60초 안에 matching run/check-suite를 만들지 않거나 `workflow_dispatch`가 HTTP 5xx를 반환하면 재시도 1회까지만 한다. 이후는 `GitHub Actions orchestration failure`로 보고 AWS CLI CodeDeploy fallback을 사용한다.
- backend prod는 GitHub Actions/CodeDeploy 성공만으로 완료 판정하지 않는다. 운영 WAS의 systemd MainPID, `gunicorn.pid`, `10.0.100.110:3010` listener, `/health`, AI-reader worker fresh log, prod venv dependency, 필요한 migration의 실DB schema readback까지 통과해야 root prod 배포로 넘어간다.
- CodeDeploy 후 새 route나 migration이 보이지 않으면 root prod 배포를 중단한다. stale gunicorn/stale venv/pending migration을 먼저 해결하고, 수동 보정이 들어가면 `강제발동`으로 기록한다.

## 2.1 Backend 배포 공통 게이트

시작 전 lock:

```bash
git fetch origin --quiet
git branch --show-current
git status --short --branch
git rev-parse origin/main origin/dev origin/prod
for f in CHERRY_PICK_HEAD REBASE_HEAD MERGE_HEAD; do test -e .git/$f && echo "$f"; done
git merge-base --is-ancestor origin/main origin/dev; echo main_to_dev=$?
git merge-base --is-ancestor origin/dev origin/prod; echo dev_to_prod=$?
git remote -v
```

Actions 확인:

```bash
HEAD_SHA="$(git rev-parse origin/prod)"  # dev 배포면 origin/dev
gh api "repos/likenovel-admin/likenovel-service-api/commits/${HEAD_SHA}/check-suites" --jq '.total_count'
gh run list --branch prod --limit 5 --json databaseId,status,conclusion,workflowName,headSha,createdAt,event,url
```

60초 안에 matching run/check-suite가 없으면 계속 기다리지 않는다. PushEvent가 있는데 check-suite가 `0`이면 git push 문제가 아니라 GitHub Actions orchestration 문제로 본다.

AWS CLI CodeDeploy fallback 조건:
- Actions Gate 실패 또는 사용자 명시 승인
- dirty worktree가 아니라 exact commit SHA 기준으로 임시 디렉터리에서 package
- `.env.production`은 서버 기존 값을 임시 패키지에만 복사하고 커밋하지 않음
- fallback은 반드시 `workaround`/`강제발동`으로 보고하고 deployment id를 남김

Prod hard gate:

```bash
ssh -i /home/hongsan/.ssh/ln_kp.pem -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -o ProxyCommand="ssh -i /home/hongsan/.ssh/ln_kp.pem -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -W %h:%p ln-admin@3.34.11.39" \
  ln-admin@10.0.100.110 'bash /home/ln-admin/likenovel/api/verify_backend_prod_deploy.sh'
```

추가 readback:
- `systemctl show likenovel-api.service -p ActiveState -p SubState -p MainPID -p ExecMainStartTimestamp`
- `ss -ltnp | grep '10.0.100.110:3010'`
- `curl -fsS http://10.0.100.110:3010/health`
- `crontab -l | grep -nE 'storyctx|build_story_agent_context_batch'`
- `bash /home/hongsan/.codex/skills/likenovel-prod-monitoring/scripts/run_monitor.sh quick`

위 hard gate 전부가 끝나기 전에는 "배포 완료"라고 말하지 않는다.

## 2.2 Dirty Worktree exact-SHA 배포 통합 경로

현재 checkout에 unrelated local change가 남아 있으면 `dev`/`prod`를 직접 checkout하지 않는다.
아래 순서로 Codex-owned clean integration worktree에서 배포 commit을 분리한다.

1. `origin/<target>` 기준 integration worktree에서 요청된 exact commit만 통합한다.
2. 같은 worktree에서 test/build와 outgoing diff를 검증한다.
3. 검증한 commit SHA를 같은 worktree에서 exact ref로 push한다.

```bash
git push origin <merge_sha>:dev
git push origin <merge_sha>:prod
```

Root pre-push hook은 위 명령의 outgoing ref와 commit object를 검사한다. 다른
checkout의 staged index, physical submodule HEAD, dirty working tree는 전송
대상이 아니므로 push blocker로 사용하지 않는다. 대신 `main`/`dev`/`prod`
삭제와 non-fast-forward, 환경 ancestry 위반을 차단한다. Feature branch의
명시적인 `--force-with-lease`는 이 환경 브랜치 보호 범위에 포함하지 않는다.

Submodule pointer가 포함되면 아래를 먼저 확인한다.

```bash
git diff --submodule=log origin/<target> <merge_sha> -- likenovel-service-api/likenovel-service-api
git ls-tree origin/<target> -- likenovel-service-api/likenovel-service-api
git ls-tree <merge_sha> -- likenovel-service-api/likenovel-service-api
git -C likenovel-service-api/likenovel-service-api fetch origin --quiet
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <old_pointer_sha> <pointer_sha>
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <pointer_sha> origin/<target>
```

의도된 pointer push일 때만 해당 명령 1회에 한해
`ALLOW_SUBMODULE_POINTER_PUSH=1`을 붙인다. 이 flag는 의도 확인만 생략하며,
backend remote 도달성과 pointer 비후퇴 검사는 우회하지 않는다.

## 2.3 Deploy Merge Conflict Stop Rules

dev/prod 반영 중 conflict resolution은 배포를 위한 최소 정합화만 허용한다.

- 코드 conflict: 이미 검증한 feature diff와 target branch diff를 읽고, 새 동작을 만들지 않는다.
- 문서 conflict: 배포 중에 새 blended 문서를 작성하지 않는다. add/add 또는 의미 병합이 필요하면 중단하고 사용자에게 선택지를 보고한다.
- submodule conflict:
  - root dev는 backend `origin/dev` SHA를 가리킨다.
  - root prod는 backend prod workflow 완료 후 다시 fetch한 backend `origin/prod` SHA를 가리킨다.
  - backend prod workflow가 `version update` 커밋을 만들면 그 최신 SHA가 root prod pointer의 기준이다.

이 규칙을 어기면 배포 성공 여부와 무관하게 `부분 조치`로 보고하고, 새로 작성한 conflict resolution 내용을 별도 review 대상으로 분리한다.

---

## 3) 환경별 기본 매핑

| 환경 | 웹 도메인 | 웹 런타임 포트(기준) | API 도메인 | API 런타임 |
|---|---|---|---|---|
| Local | localhost | `3000/3001/3002` | localhost | `8000` |
| Staging | `*.likenovel.dev` | `3100/3101/3102` | `api.likenovel.dev` | dev CodeDeploy 대상 |
| Production | `*.likenovel.net` | `3000/3001/3002` | `api.likenovel.net` | prod CodeDeploy 대상 |

도메인/포트 기준 근거:
- `DEPLOYMENT.md`의 운영/스테이징 포트 분리 지침
- 웹 런타임 compose 파일: `service/prod.docker-compose.yml`, `partner/prod.docker-compose.yml`, `cms/docker-compose.prod.yml`

---

## 4) 로컬 구동 표준

## 4.1 프론트 로컬 검증 표준 (Docker)

사전조건:
- `service/.env`, `partner/.env`, `cms/.env` 준비

기본 포트:
- service: `http://localhost:3000`
- partner: `http://localhost:3001`
- cms: `http://localhost:3002`

실행:

```bash
cd /home/hongsan/work/likenovel
docker compose up -d --build service
docker compose up -d --build partner
docker compose up -d --build cms
```

전체 재빌드가 필요하면:

```bash
docker compose up -d --build
```

중지:

```bash
docker compose down
```

참조: root `docker-compose.yml`.

사용자가 `3000`에서 확인하겠다고 하면 `likenovel-service-local` 컨테이너를 rebuild/readback한다. 다른 임시 포트로 우회하지 않는다.

## 4.2 User Web dev server 예외 경로 (명시 요청 시)

Hot reload 자체가 목적이거나 사용자가 dev server를 명시한 경우에만 쓴다.

PowerShell:

```powershell
cd c:\Users\Hongsan\Downloads\likenovel
powershell -ExecutionPolicy Bypass -File .\scripts\user-web-dev.ps1 -Port 3000
```

참조: `scripts/user-web-dev.ps1`.
이 스크립트는 `service/`에서 `corepack enable`, `yarn --immutable`, `yarn dev`를 실행한다.

## 4.3 Backend API 로컬 실행
옵션 A: 전체 의존성 포함(Docker Compose)

```bash
cd C:\Users\Hongsan\Downloads\likenovel\likenovel-service-api\likenovel-service-api\fastapi_be_server
docker-compose up -d
```

옵션 B: API 단독(Poetry)

```bash
cd /c/Users/Hongsan/Downloads/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry install
poetry run uvicorn app.main:be_app --reload --host 0.0.0.0 --port 8000
```

참조: `likenovel-service-api/likenovel-service-api/fastapi_be_server/docker-compose.yml`

---

## 5) `likenovel.dev` 업데이트 배포 표준

## 5.1 Web(User/Partner/CMS) 배포
배포 트리거:
- root repo `dev` 브랜치 push
- 워크플로: `.github/workflows/docker-dev.yml`

워크플로 동작:
1. `service/partner/cms` 각각에 `.env.production` 생성
2. Docker build (`ENV_FILE=.env.production`)
3. ECR push
4. 태그 규칙
   - `dev-latest`
   - `dev-${GITHUB_SHA}`

필수 GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `ECR_REPO_SERVICE`
- `ECR_REPO_PARTNER`
- `ECR_REPO_CMS`
- `SERVICE_ENV_DEV`
- `PARTNER_ENV_DEV`
- `CMS_ENV_DEV`

서버 반영 표준:
1. dev compose 이미지가 ECR 이미지(`...:dev-latest` 또는 고정 SHA 태그)를 바라보는지 확인
2. dev 컨테이너만 pull/up

```bash
# user-dev
docker compose -f /home/ln-admin/likenovel/service-dev/docker/docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/service-dev/docker/docker-compose.yml up -d --remove-orphans

# partner-dev
docker compose -f /home/ln-admin/likenovel/partner-dev/docker/docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/partner-dev/docker/docker-compose.yml up -d --remove-orphans

# cms-dev
docker compose -f /home/ln-admin/likenovel/cms-dev/docker/docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/cms-dev/docker/docker-compose.yml up -d --remove-orphans
```

검증:
- `https://likenovel.dev`
- `https://partner.likenovel.dev`
- `https://cms.likenovel.dev`

## 5.2 Backend API 배포
배포 트리거:
- submodule repo `dev` 브랜치 push
- 워크플로: `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`

워크플로 동작:
1. Poetry build (`poetry build`)
2. `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/`에서 배포 zip 생성 (`*.whl`, `appspec.yml`, `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`, `gconf.py`)
3. S3 업로드
4. CodeDeploy 실행 (앱/그룹은 DEV secrets 사용)

필수 GitHub Secrets(backend dev):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `CODEDEPLOY_APP_NAME_BACKEND_DEV`
- `CODEDEPLOY_GROUP_NAME_BACKEND_DEV`
- `CODEDEPLOY_S3_BUCKET`
- `CODEDEPLOY_CONFIG_NAME_BACKEND_DEV` (옵션, 없으면 `CodeDeployDefault.AllAtOnce`)

검증:
- `https://api.likenovel.dev/docs` 접근 확인
- 2.1의 Actions Gate를 적용한다. dev Actions가 안 뜨면 prod와 동일하게 60초 기준으로 fallback 여부를 판정하되, dev 크론은 자동 활성화하지 않는다.
- dev `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`는 `/home/ln-admin/likenovel/releases/api-dev` release 디렉터리와 `/home/ln-admin/likenovel/api-dev` symlink를 사용한다. 최근 5개 release만 유지한다.
- dev story context cron은 의도적으로 자동 설치하지 않는다. 필요할 때 수동으로만 `/etc/cron.d/likenovel-dev`를 설치한다.

---

## 6) `likenovel.net` 업데이트 배포 표준

## 6.1 Web(User/Partner/CMS) 배포
배포 트리거:
- root repo `prod` 브랜치 push
- 워크플로: `.github/workflows/docker-prod.yml`

워크플로 동작:
1. `service/partner/cms` 각각에 `.env.production` 생성
2. Docker build (`ENV_FILE=.env.production`)
3. ECR push
4. 태그 규칙
   - `prod-latest`
   - `prod-${GITHUB_SHA}`

필수 GitHub Secrets:
- `SERVICE_ENV_PROD`
- `PARTNER_ENV_PROD`
- `CMS_ENV_PROD`
- (AWS/ECR 공통 secrets는 dev와 동일)

서버 반영 표준:

```bash
# user(prod)
docker compose -f /home/ln-admin/likenovel/service/prod.docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/service/prod.docker-compose.yml up -d --remove-orphans

# partner(prod)
docker compose -f /home/ln-admin/likenovel/partner/prod.docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/partner/prod.docker-compose.yml up -d --remove-orphans

# cms(prod)
docker compose -f /home/ln-admin/likenovel/cms/docker-compose.prod.yml pull
docker compose -f /home/ln-admin/likenovel/cms/docker-compose.prod.yml up -d --remove-orphans
```

검증:
- `https://likenovel.net`
- `https://partner.likenovel.net`
- `https://cms.likenovel.net`

## 6.2 Backend API 배포
배포 트리거:
- submodule repo `prod` 브랜치 push
- 워크플로: `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml`

워크플로 동작:
1. `poetry version patch` (자동 버전 증가)
2. `poetry build`
3. `pyproject.toml` 자동 commit/push
4. CodeDeploy 실행
   - Application: `ln-dep`
   - Deployment Group: `ln-dep-grp-back`
   - S3 Bucket: `ln-s3`

검증:
- `https://api.likenovel.net/docs` 접근 확인
- 2.1의 Actions Gate와 Prod hard gate를 반드시 통과한다.
- prod `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`는 `set -euo pipefail`, `.env.production` 검증, `.venv-next` 준비, DB smoke check, systemd stop/start, 이전 orphan gunicorn 정리, AI-reader worker 재시작, batch 파일 동기화를 수행한다.
- prod runtime 확인은 public `/docs`만 보지 말고 `verify_backend_prod_deploy.sh`와 changed file/behavior readback을 같이 본다.

주의:
- prod backend 워크플로는 자동으로 버전 커밋을 추가 생성한다.
- prod workflow가 만든 version bump 커밋이 있으면 root submodule pointer는 그 최신 backend prod SHA로 align한다. dev bridge SHA로 내리면 downgrade다.

## 6.3 Story Context 배치 모니터링
웹소챗 story context 적재 상태는 `tb_story_agent_context_product.ready_episode_count`만 보면 오판하기 쉽다.
실행 중에는 product row가 마지막에만 갱신되므로, 운영 확인은 전용 watch 스크립트를 우선 사용한다.

스크립트:
- `scripts/prod_storyctx_watch.sh`

기본 예시:

```bash
INTERVAL_SEC=60 ITERATIONS=30 /home/hongsan/work/likenovel/scripts/prod_storyctx_watch.sh
```

특정 작품만 보기:

```bash
PRODUCT_IDS=1102,1106 INTERVAL_SEC=30 ITERATIONS=20 /home/hongsan/work/likenovel/scripts/prod_storyctx_watch.sh
```

이 스크립트가 보는 것:
- `build_story_agent_context.py` 실행 프로세스
- `build_story_agent_context_batch.log` tail
- `tb_story_agent_context_product`
- `tb_story_agent_context_summary` 타입별 개수
- 최근 summary row
- 공개 작품 중 아직 `n/n`이 안 된 목록

주의:
- read-only 관측 도구다. 배치/DB 상태를 수정하지 않는다.
- 중간 진행률은 `ready_episode_count`보다 `로그 + recent summaries + summary count`를 우선 신뢰한다.

현재 운영 기준(2026-06-15):
- prod crontab active line은 `STORYCTX_MAX_PARALLEL=1 STORYCTX_BUILD_MODE=delta STORYCTX_MAX_MISSING_EPISODES=20`을 명시한다. 20화 수동 가속 테스트가 성공해 백로그 회복 속도를 높였고, 병렬도는 1로 유지한다.
- 시간은 매시 10분이다.

```cron
10 * * * * STORYCTX_MAX_PARALLEL=1 STORYCTX_BUILD_MODE=delta STORYCTX_MAX_MISSING_EPISODES=20 bash /home/ln-admin/likenovel/batch/build_story_agent_context_batch.sh >> /home/ln-admin/likenovel/batch/build_story_agent_context_batch.log 2>&1
```

Story context 비용 가드:
- `build_story_agent_context.py --build-mode delta`는 기본적으로 RP profile/example refresh를 하지 않는다.
- delta 중 RP refresh가 필요한 경우에만 `--refresh-rp`를 명시한다. 일반 cron/증분 수집에서는 사용하지 않는다.
- `episode_character_signals`는 기본적으로 DeepSeek direct API(`DEEPSEEK_BASE_URL`, 기본 `https://api.deepseek.com`)의 `STORY_AGENT_RP_DEEPSEEK_FALLBACK_MODEL` 기본값 `deepseek-v4-pro`를 사용한다. `STORY_AGENT_RP_REASONING_MODEL`을 명시한 경우에만 Anthropic reasoning 경로를 먼저 탄다.
- RP character plan/profile refresh는 `STORY_AGENT_RP_OPENROUTER_MODEL` 기본값 `google/gemma-4-31b-it`와 `STORY_AGENT_RP_OPENROUTER_PROVIDER_ONLY` 기본값 `deepinfra,together`를 사용한다. `deepinfra`를 우선하고 `together`만 제한 fallback으로 허용한다. `:free` 모델 변형은 사용하지 않는다.
- RP plan/profile 결과가 없거나, 캐릭터 표시명이 일반어이거나, exact-match 대사 예시가 `STORY_AGENT_RP_PROFILE_MIN_EXAMPLES` 기본값 3개 미만이면 새 profile/example을 저장하지 않고 기존 active 값을 유지한다.
- 정상 비용가드 로그는 verbose 실행 기준 `[delta-rp-skip] product_id=... affected_scope_keys=...`다.
- full build는 `STORYCTX_ALLOW_FULL=1` 없이는 차단된다. 수동 backfill 외에는 full build를 쓰지 않는다.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`의 cron 보장 로직은 기존 crontab에 같은 batch path가 있으면 건드리지 않는다. prod 배포 전후에는 반드시 `crontab -l`로 실제 active line이 위 기준인지 readback한다.
- 코드 fallback 기준은 `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`의 `STORYCTX_CRON_LINE`이며, 현재 파일상 fallback은 `STORYCTX_MAX_PARALLEL=2`만 명시한다. 기존 active line이 있으면 이 fallback이 덮어쓰지 않는다.
- 따라서 story context cron은 "문서상 기대값", "`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh` fallback", "현재 crontab active line"을 분리해서 보고한다.

## 6.4 Batch/Cron 경로 매트릭스

| 구분 | 기준 파일 | 실제 실행 경로 | 활성화 방식 |
|---|---|---|---|
| 소스 | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/` | 서버 실행 경로 아님 | 배포 zip에 포함 |
| Docker cron | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh` | `/app/dist/batch/*.sh`, 로그 `/app/logs/*.log` | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/start-cron.sh`가 컨테이너에서 `crontab /app/dist/batch/cron_job.sh` 실행 |
| Dev 서버 cron | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.dev.sh` | `/home/ln-admin/likenovel/batch-dev/*.sh`, 로그 같은 디렉터리 | `/etc/cron.d/likenovel-dev`, `ln-admin` 사용자, 자동 설치 안 함 |
| Prod 서버 cron | `crontab -l` + `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh` 보장 로직 | `/home/ln-admin/likenovel/batch/*.sh`, 로그 같은 디렉터리 | `ln-admin` crontab, 배포 후 반드시 readback |

`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_env.sh`는 디렉터리명으로 env를 고른다.
- `batch-dev`이면 `/home/ln-admin/likenovel/api-dev/.env`
- `batch`이면 `/home/ln-admin/likenovel/api/.env`
- Docker 환경 fallback은 `/proc/1/environ`

`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`는 active release의 `/home/ln-admin/likenovel/api-dev/batch`를 `/home/ln-admin/likenovel/batch-dev`로 복사하지만 dev cron은 자동 설치하지 않는다.

`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`는 `/home/ln-admin/likenovel/api/batch`를 `/home/ln-admin/likenovel/batch`로 복사하고, prod main rule slot/story context 일부 cron만 보장한다. 전체 cron 상태의 SSOT는 배포 후 `crontab -l` readback이다.

## 6.5 Batch Log Triage

배치 정상 판정은 로그 파일 존재나 오래된 `grep ERROR` 총합만으로 하지 않는다.

1. 먼저 실제 런타임 경로를 확인한다.
   - Docker: `/app/logs/*.log`
   - Dev 서버: `/home/ln-admin/likenovel/batch-dev/*.log`
   - Prod 서버: `/home/ln-admin/likenovel/batch/*.log`
2. 관련 로그마다 마지막 error 계열 줄과 마지막 success 계열 줄을 비교한다.
3. 최소 검색어:
   - `ERROR`
   - `Traceback`
   - `1205`
   - `timeout`
   - `deadlock`
   - `lock wait`
4. `completed`, `DONE`, `RELEASE_LOCK`, `completed_yn='Y'` 같은 success marker가 마지막 error보다 뒤에 있어도 같은 batch/run window인지 확인한다.
5. `processlist`에서 batch query가 60초 이상 active이면 정상 완료가 아니라 active/risky로 보고한다.
6. `BASH_ENV`나 cron shell 동작을 bash 수동 실행 결과만으로 단정해 batch source를 고치지 않는다. 실제 cron 실행, 로그, DB row/readback을 함께 본다.

---

## 7) Legacy 경로 (기본 비권장)

아래는 현재 표준 경로가 아니라 “필요 시 수동 실행” 용도다.

1. `/.github/workflows/likenovel-user-dev.yml`
2. `/.github/workflows/likenovel-user-prod.yml`

특징:
- 둘 다 `workflow_dispatch`만 가능
- User Web만 CodeDeploy(zip) 방식
- `service/run_fe.sh`, `service/run_fe_dev.sh`, `service/appspec*.yml` 사용

정리:
- 현재 기본 표준은 “web=ECR Docker, backend=CodeDeploy”
- legacy user CodeDeploy는 예외 상황에서만 사용

---

## 8) 장애 대응 / 롤백 표준

## 8.1 Web 롤백
원칙:
- `dev-${SHA}`, `prod-${SHA}` 태그가 남아 있으므로, compose 이미지 태그를 직전 정상 SHA로 되돌려 재기동

실행:

```bash
# 예: user를 직전 정상 태그로 롤백할 때
# 1) compose의 image 태그를 정상 SHA(dev-xxxx / prod-xxxx)로 변경
# 2) pull + up
docker compose -f /home/ln-admin/likenovel/service/prod.docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/service/prod.docker-compose.yml up -d --remove-orphans
```

## 8.2 Backend 롤백
원칙:
- 직전 정상 배포 zip(S3 key: `<old_sha>.zip`)으로 CodeDeploy 재실행

실행:
- AWS Console CodeDeploy에서 이전 revision 재배포
- 또는 AWS CLI `create-deployment`로 이전 key 지정

---

## 9) DB 세팅 상세

## 9.1 DB 연결 구조 (코드 기준)

| 구분 | 기준 코드/설정 | 실제 연결 방식 |
|---|---|---|
| Frontend(User/Partner/CMS) | `service/`, `partner/`, `cms/` | DB 직접 접속 없음 (HTTP로 Backend API 호출) |
| Backend DB URL 조합 | `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/const.py` | `DB_USER_ID`, `DB_USER_PW`, `DB_IP`, `DB_PORT`로 `LIKENOVEL_DB_URL` 생성 |
| Backend DB 드라이버 | `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/rdb.py` | `mysql+aiomysql` (SQLAlchemy async) |
| Local DB 컨테이너 | `likenovel-service-api/likenovel-service-api/fastapi_be_server/docker-compose.yml` | `mysql:8.0`, host 노출 `3806:3306` |
| Local Keycloak DB | 같은 파일 | `KC_DB_URL=jdbc:mysql://mysql:3306/keycloak` |

핵심:
1. 백엔드는 `DB_*` 환경변수 기반으로 DB 접속 문자열을 만든다.
2. 로컬 Docker에서는 DB host가 `mysql` 서비스명이다.
3. 스테이징/운영에서는 DB host를 RDS endpoint로 넣어야 한다.
4. 프론트는 DB에 직접 접속하지 않는다. DB 오염 여부는 backend API/env/batch 경로에서 판단한다.

## 9.1.1 DB 채널 실수 방지 매트릭스

| 채널 | 사용 시점 | 연결 기준 | 주의 |
|---|---|---|---|
| Local Docker MySQL | 완전 로컬 격리 검증 | `localhost:3806` 또는 컨테이너 내부 `mysql:3306` | LikeNovel 기본 검증 채널로 가정하지 않는다 |
| Local -> dev RDS tunnel | 로컬 백엔드/배치 검증 기본값 | `host.docker.internal:13306` | SSH 터널 뒤 dev RDS다. `3806`과 다르다 |
| Dev API DB | `api.likenovel.dev` 런타임 | `DB_IP=<dev-rds-endpoint>`, `DB_PORT=3306` | `.env.dev` 파일 존재만으로 반영됐다고 보지 않는다 |
| Prod API DB | `api.likenovel.net` 런타임 | 운영 `.env`/프로세스 env의 `DB_IP`, `DB_PORT=3306` | endpoint 추측 금지, 서버 env readback 필요 |

## 9.2 Local DB 세팅 표준
대상: 로컬 API 개발/검증

1. 파일 준비: `likenovel-service-api/likenovel-service-api/fastapi_be_server/.env`
2. 최소 DB 키 확인:
   - `DB_USER_ID`
   - `DB_USER_PW`
   - `DB_IP` (`mysql`)
   - `DB_PORT` (`3306`)
3. 구동:

```bash
cd /c/Users/Hongsan/Downloads/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
docker-compose up -d
```

4. 확인:
   - API: `http://localhost:8000/docs`
   - MySQL host 포트: `localhost:3806`

## 9.3 `likenovel.dev` DB 세팅 표준
대상: 스테이징 API

원칙:
1. 운영 DB와 분리된 dev RDS 사용
2. 백엔드 런타임 환경에 아래 키 주입
   - `DB_IP=<dev-rds-endpoint>`
   - `DB_PORT=3306`
   - `DB_USER_ID=<dev-user>`
   - `DB_USER_PW=<dev-password>`
3. RDS 보안그룹은 API 서버에서만 접근 허용

주의:
- `app/const.py`에는 `env_file` 자동 로딩 설정이 없다.
- 즉, 스테이징에서 `.env.dev` 파일을 두기만 해서는 부족하고, 실제 프로세스 환경변수로 주입되어야 한다.

### 9.3.1 로컬 PC에서 dev RDS 붙여서 검증할 때 (SSH 터널)

증상:
- 로컬에서 API가 dev RDS로 직접 붙지 못하면(사설망/보안그룹), 유저웹은 `localhost:3000`에서 스피너가 계속 돌 수 있다.
- 이 경우 API 로그에 `Can't connect to MySQL server on '<dev-rds-endpoint>'` 또는 프론트 로그에 proxy `ECONNREFUSED`가 나타난다.

표준 절차:
1. Git Bash에서 SSH 터널 유지 창을 1개 띄운다.

```bash
ssh -i "/c/Users/Hongsan/Downloads/ln_kp.pem" -o IdentitiesOnly=yes \
  -o "ProxyCommand=ssh -i /c/Users/Hongsan/Downloads/ln_kp.pem -o IdentitiesOnly=yes -W %h:%p ln-admin@3.34.11.39" \
  -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -N \
  -L 13306:likenovel-dev.c9wkga0gurzf.ap-northeast-2.rds.amazonaws.com:3306 \
  -L 18080:127.0.0.1:8080 \
  ln-admin@10.0.100.110
```

2. PowerShell에서 터널 포트를 확인한다.

```powershell
Test-NetConnection 127.0.0.1 -Port 13306
Test-NetConnection 127.0.0.1 -Port 18080
```

3. 백엔드 API 컨테이너를 재생성해 런타임 env를 다시 반영한다.

```powershell
cd C:\Users\Hongsan\Downloads\likenovel\likenovel-service-api\likenovel-service-api\fastapi_be_server
docker compose up -d --force-recreate api
```

4. 로컬 백엔드 런타임 값(컨테이너 기준)을 아래로 맞춘다.
   - `DB_IP=host.docker.internal`
   - `DB_PORT=13306`
   - `KC_DOMAIN=http://host.docker.internal:18080`
   - `ROOT_PATH=/tmp`

운영 팁:
- Windows/Git Bash 환경에서는 `-J ln-admin@3.34.11.39` 방식이 첫 홉에 키를 제대로 전달하지 못해 `Permission denied (publickey)`가 나는 경우가 있다.
- 위 runbook에서는 `ProxyCommand` 방식을 표준으로 사용한다.

## 9.4 `likenovel.net` DB 세팅 표준
대상: 운영 API

원칙:
1. 운영 RDS endpoint를 `DB_IP`로 사용
2. 운영 DB 계정/암호는 운영 전용 값 사용
3. 배포 후 최소 점검:
   - `https://api.likenovel.net/docs`
   - 로그인/작품조회/결제 전 기본 조회 API smoke test

---

## 10) Env 파일 표준

## 10.1 Frontend env 파일 (service/partner/cms)

| 파일 | 위치 | 용도 | 로딩 시점 | 관리 주체 |
|---|---|---|---|---|
| `.env` | `service/`, `partner/`, `cms/` | 로컬 개발/로컬 Docker 기본값 | 로컬 실행/로컬 빌드 | 개발자 로컬 |
| `.env.production` | 각 앱 폴더 | 배포 빌드 입력 파일 | CI 빌드 시점 | GitHub Actions가 Secrets에서 생성 |

근거:
- CI에서 `.env.production` 생성: `.github/workflows/docker-dev.yml`, `.github/workflows/docker-prod.yml`
- Legacy PM2/env copy scripts still exist for history, but are not current deployment paths. See `docs/wiki/legacy-and-snapshot-docs.md`.

## 10.2 Frontend 빌드/런타임에서 env가 쓰이는 방식

| 항목 | 설명 |
|---|---|
| `NEXT_PUBLIC_*` | Next.js 빌드 시 번들에 반영될 수 있는 공개 변수 |
| `API_SERVER_URI`, `IRON_SESSION_PASSWORD`, `NICE_*` 등 | 서버 런타임 변수 (유저웹 기준) |
| `NAVER_SITE_VERIFICATION` | 유저웹의 네이버 사이트 소유확인 metadata. `docker-prod.yml`이 별도 GitHub Secret에서 prod 빌드에만 추가하며 dev에는 주입하지 않음 |
| Dockerfile 동작 | `ARG ENV_FILE`로 전달된 파일을 `.env`와 `.env.production`으로 복사 후 build |

근거 Dockerfile:
- `service/Dockerfile`
- `partner/Dockerfile`
- `cms/Dockerfile`

### 10.2.1 Frontend Local Env Key Inventory

Do not document secret values. This list is a key-name inventory only, verified
against the May backup `likenovel-local-env.tar.gz` and the current local
`.env` files on 2026-06-06.

`service/.env` keys:

- `API_SERVER_URI`
- `IRON_SESSION_PASSWORD`
- `NEXT_PUBLIC_API_SERVER_URI`
- `NEXT_PUBLIC_APPLE_CLIENT_ID`
- `NEXT_PUBLIC_APPLE_SIGNIN_REDIRECT_URI`
- `NEXT_PUBLIC_APPLE_SIGNUP_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_SIGNIN_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_SIGNUP_REDIRECT_URI`
- `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- `NEXT_PUBLIC_KAKAO_SIGNIN_REDIRECT_URI`
- `NEXT_PUBLIC_KAKAO_SIGNUP_REDIRECT_URI`
- `NEXT_PUBLIC_NAVER_CLIENT_ID`
- `NEXT_PUBLIC_NAVER_SIGNIN_REDIRECT_URI`
- `NEXT_PUBLIC_NAVER_SIGNUP_REDIRECT_URI`
- `NEXT_PUBLIC_PARTNER_SITE_URL`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
- `NEXT_PUBLIC_PORTONE_STORE_ID`
- `NEXT_PUBLIC_WWW_SERVER_URI`
- `NICE_CLIENT_ID`
- `NICE_CLIENT_SECRET`
- `NICE_PRODUCT_ID`
- `NICE_RETURN_URL`

`partner/.env` keys:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CMS_SITE_URL`
- `NEXT_PUBLIC_HOST_CDN_URL`
- `NEXT_PUBLIC_HOST_PARTNER_URL`
- `NEXT_PUBLIC_USER_SITE_URL`

`cms/.env` keys:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PARTNER_SITE_URL`

## 10.3 Backend env 파일 (fastapi_be_server)

| 파일 | 용도 | 실제 반영 방식 |
|---|---|---|
| `.env` | 로컬 Docker Compose 실행 기본 env | `docker-compose.yml`의 `api.env_file`로 주입 |
| `.env.dev` | dev용 참조/운영 파일 | 코드 자동 로딩 아님, 프로세스 환경변수 주입 필요 |
| `.env.prod` | prod용 참조/운영 파일 | 코드 자동 로딩 아님, 프로세스 환경변수 주입 필요 |

최소 필수(백엔드 DB 기준):
- `DB_USER_ID`
- `DB_USER_PW`
- `DB_IP`
- `DB_PORT`

주의:
- 같은 키를 `.env`에 중복 선언하지 않는다. 마지막 선언값으로 덮어써져 의도와 다른 런타임이 된다.
- 특히 `KC_DOMAIN`, `ROOT_PATH` 중복 여부를 반드시 확인한다.

## 10.4 env 파일 선택 규칙 (실무 기준)

| 상황 | 실제로 쓰는 파일 |
|---|---|
| 로컬 Next 개발 (`yarn dev`) | 각 앱의 `.env` |
| 로컬 Docker 빌드 (root `docker-compose.yml`) | 각 앱의 `.env` (`ENV_FILE=.env`) |
| 표준 CI 배포(dev/prod) | GitHub Secrets로 생성된 `.env.production` |

Legacy PM2 dev/prod env copy flows are preserved only as historical reference in `docs/wiki/legacy-and-snapshot-docs.md`.

## 10.5 CI Secrets와 env 파일 매핑

| Secret | 대상 파일 | 사용 워크플로 |
|---|---|---|
| `SERVICE_ENV_DEV` | `service/.env.production` | `.github/workflows/docker-dev.yml` |
| `PARTNER_ENV_DEV` | `partner/.env.production` | `.github/workflows/docker-dev.yml` |
| `CMS_ENV_DEV` | `cms/.env.production` | `.github/workflows/docker-dev.yml` |
| `SERVICE_ENV_PROD` | `service/.env.production` | `.github/workflows/docker-prod.yml` |
| `PARTNER_ENV_PROD` | `partner/.env.production` | `.github/workflows/docker-prod.yml` |
| `CMS_ENV_PROD` | `cms/.env.production` | `.github/workflows/docker-prod.yml` |

---

## 11) 배포 전 체크리스트 (공통)

1. 배포 대상 repo/브랜치가 맞는가
2. GitHub Secrets가 환경(dev/prod)에 맞게 최신인가
3. 도메인 라우팅(`*.dev`, `*.net`, `api.*`)과 Nginx 분기가 맞는가
4. 서버에서 대상 stack만 갱신하는가(불필요한 컨테이너 재시작 금지)
5. 배포 직후 `/docs` 또는 주요 로그인/결제/작품조회 API smoke test를 수행했는가
6. 배포/배치/cron/systemd/env/hard gate가 바뀌었으면 이 런북과 verified-index를 같은 턴에서 갱신했는가
7. 운영 장애나 반복 실수가 있었으면 관련 skill/memory/AGENTS.md 중 최소 하나에 재발 방지 규칙을 남겼는가

---

## 12) 문서 갱신 기준

문서 갱신은 주기보다 트리거 기준으로 강제한다. 아래 중 하나라도 발생하면 해당 작업이 끝난 같은 턴에서 문서를 갱신한다.

- prod/dev 배포 절차, fallback, verification gate 변경
- systemd/gunicorn/CodeDeploy 책임 경계 변경
- cron, batch schedule, max parallel, lock, 비용가드 변경
- DB migration/auto_migrate 적용 경로 또는 검증 기준 변경
- env 파일 생성/복사/검증 방식 변경
- 운영 사고, near-miss, manual workaround 발생
- 코드, API 계약, DB/배치 정책, UI/디자인 계약, 운영 절차가 바뀌어 문서 업데이트가 필요하다고 판단되는 경우

채팅 보고는 문서 갱신을 대체하지 않는다. 문서 갱신이 필요한데 범위가 모호하면 완료로 말하지 말고 `문서 갱신 미완료` 또는 `미검증`으로 보고한 뒤 관련 SSOT 문서를 확인한다.

갱신 대상:
- 운영 절차: `docs/deployment-runbook.md`
- agent/작업 규칙: 루트 `AGENTS.md`
- API/기능 계약: 해당 `docs/*contract*.md`, tracked 기능별 설계 문서, 또는 backend code/schema readback. Local-only `backend-api.md`가 있더라도 current handoff 기준으로 단독 사용하지 않는다.
- 디자인/UI 계약: `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/design-system.md` 또는 관련 QA 문서
- DB/배치 정책: schema/runbook/verified-index 관련 문서
- 검증된 현재 상태: `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/verified-index.md`
- 반복 실수 방지: `AGENTS.md`, 관련 Codex skill, memory note
