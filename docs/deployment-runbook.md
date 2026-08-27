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

2026-07-25 코드·서버 readback 기준:
- `.github/workflows/docker-dev.yml` and `.github/workflows/docker-prod.yml` checkout the backend submodule recursively, then run hook, service lint, service utility/contract tests, and CMS contract gates before building frontend Docker images. The prod job runs only for `refs/heads/prod`. Both workflows pull images before recreating containers and verify internal ports plus public URLs after deployment.
- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml` renews the exact DEV RDS one-hour lease after AWS credential setup, starts the DB only when needed, packages dev backend CodeDeploy, waits for CodeDeploy, then runs `verify_backend_dev_deploy.sh` on ln-was.
- `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml` runs only for `refs/heads/prod`, packages prod backend CodeDeploy, waits for deployment success, then runs `verify_backend_prod_deploy.sh` on ln-was.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh` syncs batch files to `/home/ln-admin/likenovel/batch-dev` but keeps `/etc/cron.d/likenovel-dev` manual.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh` syncs batch files to `/home/ln-admin/likenovel/batch` and guards only selected prod user-crontab lines.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_env.sh` maps `batch-dev` to `/home/ln-admin/likenovel/api-dev/.env`, `batch` to `/home/ln-admin/likenovel/api/.env`, and Docker fallback to `/proc/1/environ`.

주의:
- backend API는 submodule 별도 원격 저장소(`.gitmodules`) 기준으로 배포된다.
- root repo에만 push하면 backend 배포 워크플로는 실행되지 않는다.
- backend dev/prod 배포는 먼저 `likenovel-backend-deploy` 스킬의 Start Lock과 Actions Gate를 적용한다.
- GitHub Actions가 push 후 60초 안에 matching run/check-suite를 만들지 않거나 `workflow_dispatch`가 HTTP 5xx를 반환하면 재시도 1회까지만 한다. 이후는 `GitHub Actions orchestration failure`로 보고 AWS CLI CodeDeploy fallback을 사용한다.
- backend prod는 GitHub Actions/CodeDeploy 성공만으로 완료 판정하지 않는다. 운영 WAS의 systemd MainPID, `gunicorn.pid`, `10.0.100.110:3010` listener, `/health`, AI-reader worker fresh log, prod venv dependency, 필요한 migration의 실DB schema readback까지 통과해야 완료다.
- CodeDeploy 후 새 route나 migration이 보이지 않으면 backend 배포를 완료로 보고하지 않는다. stale gunicorn/stale venv/pending migration을 먼저 해결하고, 수동 보정이 들어가면 `강제발동`으로 기록한다.

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

`main_to_dev`와 `dev_to_prod`는 환경 차이를 읽는 진단값이다. root와 backend의
`dev`/`prod`는 각각 독립적인 배포 ledger이므로 0이 아니어도 그 자체로 배포를
막거나 다른 환경 branch를 merge하지 않는다. target remote tip을 fast-forward하는
exact commit만 통합한다.

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
push는 remote 이름이 정확히 `origin`일 때만 허용하고, 삭제와 non-fast-forward,
gitlink remote reachability 및 pointer downgrade를 차단한다. `dev`가 effective
`main`을 포함하지 않거나 `prod`가 effective `dev`를 포함하지 않으면 1인 운영의
hotfix 유연성을 위해 명확한 `WARNING`을 출력하되 push는 허용한다. 검증 직전에
root/backend의 `origin/*`
remote-tracking ref를 prune하므로 삭제된 원격 branch를 도달성 근거로 쓰지 않는다.
검증 범위는 각 outgoing ref의 최종 commit과 그 push diff이며, 범위 안의 모든
중간 commit을 별도 재검사하지 않는다. Feature branch의
명시적인 `--force-with-lease`는 이 환경 브랜치 보호 범위에 포함하지 않는다.

Hook은 shared hooks dir에 checkout과 독립적인 self-contained 파일로 설치한다.
기존 LikeNovel legacy/managed pre-push를 교체할 때는 최초 상태를
`pre-push.likenovel-backup`으로 보존하며, 알 수 없는 custom hook은 중단한다.

```bash
bash devtools/install-git-hooks.sh
git rev-parse --git-path hooks
```

Rollback이 필요하면 push를 멈춘 상태에서 설치된 `pre-push`를 별도 보존한 뒤
같은 hooks dir의 `pre-push.likenovel-backup`을 `pre-push`로 복원한다.

Submodule pointer가 포함되면 아래를 먼저 확인한다.

```bash
git diff --submodule=log origin/<target> <merge_sha> -- likenovel-service-api/likenovel-service-api
git ls-tree origin/<target> -- likenovel-service-api/likenovel-service-api
git ls-tree <merge_sha> -- likenovel-service-api/likenovel-service-api
git -C likenovel-service-api/likenovel-service-api fetch origin --quiet --prune
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <old_pointer_sha> <pointer_sha>
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <pointer_sha> origin/<target>
```

의도된 pointer push일 때만 해당 명령 1회에 한해
`ALLOW_SUBMODULE_POINTER_PUSH=1`을 붙인다. 이 flag는 의도 확인만 생략하며,
backend remote 도달성과 pointer 비후퇴 검사는 우회하지 않는다. backend-only
배포에서는 이 flag나 root pointer 변경을 사용하지 않는다. root 코드가 특정 backend
snapshot을 실제로 요구하는 동일 deploy unit에서만 pointer 변경을 포함한다.

### 2.2.1 Backend-only 배포 후 primary backend 동기화 hard gate

backend DEV/PROD 배포와 runtime hard gate가 끝난 뒤 clean integration worktree를
primary 동기화 증거로 대신하지 않는다. 명시적 prod-only hotfix가 아닌 한 PROD의
exact 변경을 DEV에도 먼저 정렬하고, primary backend checkout을 최종
`origin/dev`로 맞춘다.

```bash
cd /home/hongsan/work/likenovel
BACKEND=likenovel-service-api/likenovel-service-api

git -C "$BACKEND" fetch origin --quiet --prune
test -z "$(git -C "$BACKEND" status --porcelain)"
test -z "$(git diff --cached --name-only -- "$BACKEND")"
git -C "$BACKEND" switch --detach origin/dev

BACKEND_PRIMARY_SHA="$(git -C "$BACKEND" rev-parse HEAD)"
BACKEND_DEV_SHA="$(git -C "$BACKEND" rev-parse origin/dev)"
test "$BACKEND_PRIMARY_SHA" = "$BACKEND_DEV_SHA"
test -z "$(git -C "$BACKEND" status --porcelain)"
test -z "$(git diff --cached --name-only -- "$BACKEND")"

printf 'backend-primary=%s backend-origin/dev=%s backend=clean root-gitlink=preserved\n' \
  "$BACKEND_PRIMARY_SHA" "$BACKEND_DEV_SHA"
```

추가 검증:

- 이번 배포 핵심 파일은 primary backend `HEAD:<path>`와 `origin/dev:<path>` blob을 비교한다.
- outer root의 `HEAD`와 index가 기록한 gitlink는 바꾸지 않는다. backend checkout이
  gitlink보다 앞서면 root `git status`의 submodule `M`은 예상된 로컬 sync 표시다.
- 이 `M`을 없애려고 root gitlink를 stage/commit/push하거나 backend를 stale gitlink로
  reset하지 않는다. root-owned 코드가 해당 backend snapshot을 요구하는 별도 deploy
  unit에서만 pointer 변경을 수행한다.
- primary backend sync가 실패하면 `배포 성공, 로컬 동기화 미완료`로 보고하고 다음
  배포 작업으로 넘어가지 않는다.

## 2.3 Root web 배포 후 primary 동기화 hard gate

`service`/`partner`/`cms` DEV 또는 PROD 배포는 Actions, image digest, public
endpoint, browser 검증이 성공해도 끝나지 않는다. 마지막 배포가 끝난 뒤 Codex
primary checkout `/home/hongsan/work/likenovel`을 canonical local code로 정렬한다.
clean integration worktree는 이 검증을 대신하지 않는다.

```bash
cd /home/hongsan/work/likenovel
git -c fetch.recurseSubmodules=false fetch origin --quiet --prune --no-recurse-submodules

PRIMARY_SHA="$(git rev-parse HEAD)"
DEV_SHA="$(git rev-parse origin/dev)"
ROOT_DIRTY="$(git status --porcelain)"
ROOT_GITLINK="$(git rev-parse HEAD:likenovel-service-api/likenovel-service-api)"
SUBMODULE_SHA="$(git -C likenovel-service-api/likenovel-service-api rev-parse HEAD)"
SUBMODULE_DIRTY="$(git -C likenovel-service-api/likenovel-service-api status --porcelain)"

test "$PRIMARY_SHA" = "$DEV_SHA"
test -z "$ROOT_DIRTY"
test "$SUBMODULE_SHA" = "$ROOT_GITLINK"
test -z "$SUBMODULE_DIRTY"

printf 'primary=%s origin/dev=%s root=clean submodule=aligned\n' \
  "$PRIMARY_SHA" "$DEV_SHA"
```

추가 검증:

- 이번 배포 핵심 파일은 `git rev-parse HEAD:<path>`와
  `git rev-parse origin/dev:<path>` blob을 비교한다.
- `package.json` 또는 lockfile 변경 시 해당 workspace에서 immutable install 후
  관련 test/build를 실행하고 tracked file 무변경을 확인한다.
- PROD 변경이 DEV에 없으면 명시적 prod-only hotfix가 아닌 한 exact 변경을 DEV에
  동기화한 뒤 primary를 다시 `origin/dev`에 맞춘다.
- primary가 dirty하면 사후 임의 stash/reset/덮어쓰기를 하지 않는다. 배포 전에
  owner와 보존 경로를 확정했어야 하며, 보존 증거 없이 정렬할 수 없으면 중단한다.
- 명시적 prod-only hotfix 또는 primary sync 실패 시에는
  `배포 성공, 로컬 동기화 미완료`라고 보고하고 `배포 완료`라고 말하지 않는다.
- backend-only 배포는 이 root web 절 대신 2.2.1의 primary backend sync hard gate와
  2.1 runtime hard gate를 모두 적용한다.

위 명령의 마지막 한 줄을 실제 readback으로 남기기 전에는 root web 배포를 완료로
판정하지 않고 다음 배포 작업으로 넘어가지 않는다.

## 2.4 Deploy Merge Conflict Stop Rules

dev/prod 반영 중 conflict resolution은 배포를 위한 최소 정합화만 허용한다.

- 코드 conflict: 이미 검증한 feature diff와 target branch diff를 읽고, 새 동작을 만들지 않는다.
- 문서 conflict: 배포 중에 새 blended 문서를 작성하지 않는다. add/add 또는 의미 병합이 필요하면 중단하고 사용자에게 선택지를 보고한다.
- backend-only 배포에서 submodule conflict가 보이면 target root branch의 기존 pointer를 유지한다. backend target tip으로 자동 정렬하지 않는다.
- root 코드가 특정 backend snapshot을 실제로 요구하면 backend-only 배포와 분리된 root deploy unit으로 만들고, root-owned 변경과 함께 API 계약을 검증한다.

이 규칙을 어기면 배포 성공 여부와 무관하게 `부분 조치`로 보고하고, 새로 작성한 conflict resolution 내용을 별도 review 대상으로 분리한다.

## 2.5 Root Gitlink Dependency Boundary

Backend-only 배포는 backend target ref와 runtime hard gate로 끝낸다. 배포된
backend SHA를 따라가는 root gitlink 대응 커밋을 만들지 않으며 target root branch의
기존 pointer를 유지한다.

Root gitlink는 root 코드가 특정 backend snapshot을 실제로 요구하는 동일 deploy
unit에서만 변경한다. 이 경우 root-owned 변경과 API 계약을 함께 검증하고, staged
gitlink의 remote 도달성과 기존 pointer 대비 비후퇴도 확인한다. backend-only 배포를
위해 pointer-only commit이나 `ALLOW_SUBMODULE_POINTER_PUSH=1`을 사용하지 않는다.

완료 보고에서는 backend target ref와 runtime 검증, root code/gitlink 변경 여부,
web runtime 배포 여부를 서로 다른 surface로 분리한다.

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
1. git hook test, service lint, CMS contract test
2. `service/partner/cms` 각각에 `.env.production` 생성
3. Docker build (`ENV_FILE=.env.production`)
4. ECR push
5. 태그 규칙
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
2. 세 compose의 `pull`을 모두 먼저 성공시켜 기존 컨테이너를 보존
3. dev 컨테이너만 `up -d`
4. 실행 컨테이너의 image digest가 이번 build output digest와 일치하는지 확인
5. 내부 `3100/3101/3102`와 공개 URL을 모두 확인

DEV의 세 compose 파일은 서로 다른 디렉터리에 있지만 현재 Docker Compose project명이 모두 `docker`다.
따라서 DEV에서 `--remove-orphans`를 사용하면 뒤 compose가 앞의 정상 컨테이너를 삭제한다. 세 compose를
별도 project명으로 마이그레이션하기 전까지 DEV 배포에는 `--remove-orphans`를 쓰지 않는다.

```bash
# user-dev
docker compose -f /home/ln-admin/likenovel/service-dev/docker/docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/service-dev/docker/docker-compose.yml up -d

# partner-dev
docker compose -f /home/ln-admin/likenovel/partner-dev/docker/docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/partner-dev/docker/docker-compose.yml up -d

# cms-dev
docker compose -f /home/ln-admin/likenovel/cms-dev/docker/docker-compose.yml pull
docker compose -f /home/ln-admin/likenovel/cms-dev/docker/docker-compose.yml up -d
```

검증:
- `service/partner/cms` 실행 컨테이너 image digest = 해당 workflow build output digest
- `http://127.0.0.1:3100/`, `http://127.0.0.1:3101/`, `http://127.0.0.1:3102/`
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
4. CodeDeploy 실행 후 `deployment-successful`까지 대기
5. 배포 ID와 active release 일치, systemd MainPID·pidfile, `10.0.100.110:3011` listener, 내부/공개 `/health` 검증

필수 GitHub Secrets(backend dev):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `CODEDEPLOY_APP_NAME_BACKEND_DEV`
- `CODEDEPLOY_GROUP_NAME_BACKEND_DEV`
- `CODEDEPLOY_S3_BUCKET`
- `CODEDEPLOY_CONFIG_NAME_BACKEND_DEV` (옵션, 없으면 `CodeDeployDefault.AllAtOnce`)
- `SSH_PRIVATE_KEY`

검증:
- `fastapi_be_server/dist/verify_backend_dev_deploy.sh <deployment-id>`가 통과해야 한다.
- `https://api.likenovel.dev/health`와 필요한 변경 route를 확인한다.
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
1. git hook test, service lint, CMS contract test
2. `service/partner/cms` 각각에 `.env.production` 생성
3. Docker build (`ENV_FILE=.env.production`)
4. ECR push
5. 태그 규칙
   - `prod-latest`
   - `prod-${GITHUB_SHA}`

필수 GitHub Secrets:
- `SERVICE_ENV_PROD`
- `PARTNER_ENV_PROD`
- `CMS_ENV_PROD`
- (AWS/ECR 공통 secrets는 dev와 동일)

서버 반영 표준:

```bash
cd /home/ln-admin/likenovel/docker-prod
docker compose pull
docker compose up -d --remove-orphans
```

검증:
- `service/partner/cms` 실행 컨테이너 image digest = 해당 workflow build output digest
- `http://127.0.0.1:3000/`, `http://127.0.0.1:3001/`, `http://127.0.0.1:3002/`
- `https://www.likenovel.net`
- `https://partner.likenovel.net`
- `https://cms.likenovel.net`

## 6.2 Backend API 배포
배포 트리거:
- submodule repo `prod` 브랜치 push
- 워크플로: `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml`

워크플로 동작:
1. build workspace에서만 `poetry version patch` 실행
2. 배포 계약 테스트와 `poetry build`
3. Git write 없이 CodeDeploy 실행
   - Application: `ln-dep`
   - Deployment Group: `ln-dep-grp-back`
   - S3 Bucket: `ln-s3`

검증:
- `https://api.likenovel.net/docs` 접근 확인
- 2.1의 Actions Gate와 Prod hard gate를 반드시 통과한다.
- prod `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`는 `set -euo pipefail`, `.env.production` 검증, `.venv-next` 준비, DB smoke check, systemd stop/start, 이전 orphan gunicorn 정리, AI-reader worker 재시작, batch 파일 동기화를 수행한다.
- prod runtime 확인은 public `/docs`만 보지 말고 `verify_backend_prod_deploy.sh`와 changed file/behavior readback을 같이 본다.
- AI-reader worker의 만료 에이전트 정리는 한 사이클 최대 50건을 `FOR UPDATE SKIP LOCKED`로 선점하고 session/action claim 전에 즉시 commit한다. daemon은 MySQL `1205`/`1213`만 interval 뒤 재시도하며, `--once` 실행과 그 밖의 DB 오류는 실패를 그대로 반환한다.
- 배포 직후 worker PID는 살아 있는데 fresh-log 검사만 실패하면 정상으로 간주하지 않는다. worker log mtime 전진과 새 cycle을 확인한 뒤 `verify_backend_prod_deploy.sh`를 다시 실행해 실제 정상 여부와 단순 타이밍 실패를 구분한다.

주의:
- prod backend workflow의 version patch는 runner workspace에서만 유효하며 `pyproject.toml`을 commit/push하지 않는다.
- backend 배포 완료는 backend `origin/prod`와 runtime hard gate로 판정한다. root submodule pointer 정렬은 완료 조건이 아니다.

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

현재 운영 기준(2026-07-19):
- prod crontab active line은 `STORYCTX_MAX_PARALLEL=1 STORYCTX_BUILD_MODE=delta STORYCTX_MAX_MISSING_EPISODES=20`을 명시한다. 20화 수동 가속 테스트가 성공해 백로그 회복 속도를 높였고, 병렬도는 1로 유지한다.
- 시간은 매시 10분이다.

```cron
10 * * * * STORYCTX_MAX_PARALLEL=1 STORYCTX_BUILD_MODE=delta STORYCTX_MAX_MISSING_EPISODES=20 bash /home/ln-admin/likenovel/batch/build_story_agent_context_batch.sh >> /home/ln-admin/likenovel/batch/build_story_agent_context_batch.log 2>&1
```

Story context 비용 가드:
- 코드 우선순위는 `DNA·AI reader/추천 핵심 데이터 > 30화 이내 채팅 자산 > 30화를 채운 작품의 추가 채팅 자산`이다. 공통 reserve와 in-flight buffer가 기본 3달러일 때 storyctx는 각각 1달러/2달러 headroom을 추가로 남긴다.
- 작품별 주인공챗 자산 목표는 `min(공개 회차 수, 30)`이다. 회차 번호 자체가 아니라 공개 회차 정렬 순번의 앞 30개를 세므로 번호 gap이 있어도 목표가 어긋나지 않는다. 최근 7일 `websochat_asset_request` 중 요청 회차가 아직 준비되지 않은 작품을 먼저 보고, 그다음 목표 미달 작품을 준비 자산 수 오름차순으로 처리한다. 목표를 채운 작품은 후순위다. `ready_episode_count`는 단순 row 수가 아니라 앞선 공개 회차에 웹소챗 요약 누락이 없는 최신 연속 준비 회차 번호다.
- 웹소챗 foundation 대상은 AI 콘텐츠 동의가 켜진 공개·비블라인드 연재작과 완결작 전체다. 캐릭터 scene/RP 확장은 기존 character-chat cohort 조건과 공개 회차 순번 30화 상한을 계속 적용한다.
- viewer의 미준비 버튼 클릭은 로그인 사용자에 한해 `tb_user_ai_signal_event.event_type='websochat_asset_request'`로 저장되며 추천 취향 factor에는 반영하지 않는다. 서버는 AI 동의·미준비 상태를 다시 확인하고 동일 사용자/작품/회차 신호를 7일에 한 번으로 제한한다.
- viewer readiness poll은 조회수·사용량을 올리지 않는 전용 read-only API를 쓰되, 비공개·블라인드 회차 메타데이터는 본 뷰어와 같은 소유자/공개 접근 경계로 차단한다.
- OpenRouter reserve가 storyctx headroom을 충족하지 못하면 preflight와 실행 중 어느 시점이든 Python은 exit code `75`와 `deferred_budget`을 내고, shell은 이를 `deferred`로 집계한다. 이는 provider lookup 오류나 실제 처리 실패와 구분하며 기존 active 자산/status를 실패로 덮지 않는다.
- `build_story_agent_context.py --build-mode delta`는 기본적으로 RP profile/example refresh를 하지 않는다.
- delta 중 RP refresh가 필요한 경우에만 `--refresh-rp`를 명시한다. 일반 cron/증분 수집에서는 사용하지 않는다.
- delta 후보 SQL은 누락 character signal이 있거나, active signal은 있지만 character inventory v1/v3가 없는 작품에 `--reaggregate-character-inventory`를 자동 전달한다. 재집계 자체는 기존 active signal만 읽으며 provider를 호출하지 않고, 실패 시 해당 작품 트랜잭션을 rollback한다.
- 재집계는 누락 signal을 새로 만들지 않는다. signal 누락 작품은 기존 delta 수집이 먼저 신호를 생성하고, 같은 실행의 재집계가 전체 active signal에서 inventory/relation을 다시 계산한다. 순수 inventory drift 작품은 provider 호출 없이 복구할 수 있다.
- 기존 active RP profile/example/internal prompt/opening은 재집계 대상이 아니며, character inventory delta의 protagonist lock과 LKG 보존 규칙을 그대로 적용한다.
- 캐릭터 identity 수동 보정은 `scripts/apply_story_agent_identity_review.py`만 사용한다. `--apply`가 없으면 transaction을 rollback하는 dry-run이며, preview의 target scope/display/role/public eligibility를 확인한 뒤 같은 request에만 `--apply`를 추가한다. review는 캐릭터 자산과 동일한 공개 회차 순번 앞 30화의 active signal `summary_id`와 `source_hash`에 고정한다. 검수 member가 이 범위에 관측을 하나도 갖지 않거나 범위 안 신호가 바뀐 stale request는 적용하지 않는다.
- 검수된 identity 관측이 다시 여러 cluster로 갈라지거나 서로 다른 review가 한 cluster로 합쳐지면 일반 `failed`가 아니라 `review_required`와 exit code `76`으로 격리한다. shell batch는 이를 실패 후보로 반복 우선선택하지 않는다. `merge_active_scopes`의 `blocked_aliases`는 target뿐 아니라 병합 member 전체의 source-backed identity surface에서 검증하되, canonical display는 target scope 근거를 유지한다.
- identity review는 기존 RP를 삭제하거나 덮어쓰지 않는다. reviewed target의 exact-key RP가 비어 있으면 delta repair가 legacy alias 자산을 재사용할 수 있지만, reviewed display가 legacy profile의 display/alias와 일치하고 profile/examples가 같은 legacy key를 정확히 가리키며 예시 대사의 회차 근거가 확인될 때만 bridge한다. 회차가 0인 예시는 원문에서 exact text가 단일 회차에만 존재할 때만 episode evidence를 보강한다. 조건이 부족하거나 provider가 없으면 기존 LKG를 유지하고 no-progress로 남긴다.
- character asset readiness는 `tb_story_agent_context_product.context_status`를 `failed`로 강등하지 않는다. build/DB 오류와 캐릭터 자산 결손을 분리하고, 불완전한 캐릭터는 consumer exact-key/readiness gate에서만 숨기며 audit/monitor에서 관측한다.
- `character_rp_profile`은 exact `character_key`, 비어 있지 않은 `personality_core`, `speech_style.tone`, `speech_style.formality`, `speech_style.sentence_length`가 모두 있어야 ready다. 공개 catalog/preview, 실제 character-chat runtime, story-context audit/repair가 같은 fail-closed 판정을 사용한다.
- 유료 provider를 쓰는 수동 캐릭터 복구는 반복 가능한 `--character-scope-key`로 scene/RP 범위를 교집합 제한할 수 있다. 이 옵션은 `--build-mode delta --apply --repair-character-assets` 조합에서만 유효하며, 함께 지정한 `--product-id` 범위를 넓히지 않는다. 지정한 exact scope가 공개 무료 회차 기준 5장면 하한에 못 미치면 이미 사용 가능한 공개 무료 장면 회차는 제외하고 5개를 채우는 데 필요한 공개 무료 근거 회차만 `--max-delta-episodes` 범위에서 선택한다. 명시 scope 복구는 레거시 작품의 수집 시작일 코호트만 우회하며, AI 동의·공개·비블라인드·활성 scope 조건은 그대로 적용한다. scope를 생략한 정기/일반 복구는 레거시 코호트를 계속 제외한다. 이미 ready인 exact scope의 RP를 원문 근거로 다시 생성할 때만 `--refresh-rp`를 함께 지정한다. 대상 scope가 active inventory에 없거나 RP 생성이 진전되지 않으면 transaction을 rollback하며, 정기 delta batch는 이 강제 refresh 경로를 사용하지 않는다.
- `--max-delta-episodes 0`은 0건 처리가 아니라 무제한이다. 무비용 수동 재집계 검증에서 provider 차단 용도로 사용하지 않는다. 먼저 이미 완비된 단일 `--episode-no`로 apply 없는 delta dry-run이 `plans=0`인지 확인한 뒤, 동일 scope에 `--apply --reaggregate-character-inventory`를 사용하고 생성 카운터 0과 기존 signal/RP fingerprint 불변을 확인한다.
- deep monitor의 foundation mismatch는 현재 collector 대상(AI 동의 + 코호트 또는 기존 ready grandfather + disabled 아님)만 WARN으로 집계하고, 정책 밖 mismatch는 별도 정보성 카운트로 남긴다.
- DeepSeek 모델은 공식 API를 직접 호출하지 않는다. `episode_character_signals`는 OpenRouter의 `STORY_AGENT_CHARACTER_SIGNALS_OPENROUTER_MODEL`을 사용하며 기본값은 `deepseek/deepseek-v4-pro`다. `episode_scene_extraction`도 `STORY_AGENT_SCENE_EXTRACTION_OPENROUTER_MODEL` 기본값 `deepseek/deepseek-v4-pro`로 핵심 장면 2~3개를 추출하고 기본 출력 상한은 5,000토큰이다. AI DNA fallback과 provider health도 `OPENROUTER_API_KEY`/`OPENROUTER_BASE_URL`만 사용한다.
- RP character plan/profile refresh는 `STORY_AGENT_RP_OPENROUTER_MODEL` 기본값 `google/gemma-4-31b-it`와 `STORY_AGENT_RP_OPENROUTER_PROVIDER_ONLY` 기본값 `deepinfra,together`를 사용한다. `deepinfra`를 우선하고 `together`만 제한 fallback으로 허용한다. `:free` 모델 변형은 사용하지 않는다.
- RP plan/profile 결과가 없거나, 캐릭터 표시명이 일반어이거나, exact-match 대사 예시가 `STORY_AGENT_RP_PROFILE_MIN_EXAMPLES` 기본값 2개 미만이면 새 profile/example을 저장하지 않고 기존 active 값을 유지한다.
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

`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/free_episode_campaign_expire_batch.sh`는 active
`tb_product_free_episode_campaign` row를 5분 주기로 만료 처리하고, 작품 무료회차 범위를 row의 restore 범위로 복구한다. 현재 partner UI 기본 restore 범위는 1~25다.

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
   - deep monitor의 storyctx terminal parser는 `ready`와 `failed`를 필드명으로 찾으므로 그 사이에 `review_required`, `deferred`가 있어도 완료로 판정한다. 최신 run에 terminal marker가 없으면 `UNKNOWN`을 유지한다.
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

### 9.1.2 DEV RDS 비용 가드

로컬 또는 스테이징 검증 직전에만 아래 명령으로 `likenovel-dev`를 시작한다.

```bash
cd /home/hongsan/work/likenovel
bash devtools/dev-rds.sh work-start
```

- `work-start`는 DB가 정지 상태면 시작하고, 마지막 실행 시점부터 1시간 임대를 기록한다.
- 1시간을 넘겨 검증할 때는 `work-start`를 다시 실행해 임대를 갱신한다.
- `ln-was`의 `likenovel-dev-rds-reconcile.timer`가 5분마다 `devtools/dev-rds-reconcile.py`를 실행해 만료된 DEV DB를 정지한다. GitHub 예약 실행 지연과 무관한 primary reconcile 경로다.
- `.github/workflows/dev-rds.yml`도 명목상 5분마다 같은 임대를 확인하는 보조 경로로 유지한다. GitHub 예약 실행은 지연될 수 있으므로 이 경로만으로 정지 시각을 판정하지 않는다.
- 예약 workflow는 AWS 자격증명을 설정하기 전에 fake-AWS 계약 테스트를 통과해야 한다. 임대 태그가 없거나 숫자가 아니면 DB는 정지하지 않되 workflow를 실패 처리한다.
- 스테이징 웹 배포는 이미지 빌드가 모두 성공한 뒤 실제 배포 직전에 임대를 시작한다.
- 스테이징 백엔드 배포는 AWS 자격증명 설정 직후, CodeDeploy 전에 같은 1시간 임대를 갱신한다. DB가 이미 `available`이면 재시작하지 않는다.
- `down`은 다른 로컬 검증을 끊을 수 있으므로 자동 실행하지 않고, 즉시 종료가 확실히 필요할 때만 수동으로 사용한다.
- 이 스크립트는 대상이 정확히 `likenovel-dev`가 아니면 실패하며 PROD DB에는 사용하지 않는다.
- SSH 터널과 로컬 Docker는 별도 수명주기다. `work-start`가 터널이나 컨테이너를 대신 생성하지 않는다.
- GitHub Actions principal `github-actions-likenovel`에는 exact DEV DB ARN의 `DescribeDBInstances`, `ListTagsForResource`, `AddTagsToResource`, `StartDBInstance`, `StopDBInstance`만 허용한다. `AddTagsToResource`는 `likenovel-dev-work-until-epoch` 키로 제한하고 PROD ARN은 허용하지 않는다.
- `ln-was` instance role의 `LikeNovelDevRdsReconcileFromWas` inline policy는 exact DEV DB ARN의 `DescribeDBInstances`, `ListTagsForResource`, `StartDBInstance`, `StopDBInstance`만 허용하고, `ec2:SourceInstanceArn`을 exact `ln-was` instance ARN으로 제한한다. 같은 role을 쓰는 `ln-web`과 PROD DB ARN에는 허용하지 않는다.

Timer source와 runtime path:

```text
devtools/dev-rds-reconcile.py
  -> /home/ln-admin/likenovel/dev-rds/dev-rds-reconcile.py
devtools/systemd/likenovel-dev-rds-reconcile.service
  -> /etc/systemd/system/likenovel-dev-rds-reconcile.service
devtools/systemd/likenovel-dev-rds-reconcile.timer
  -> /etc/systemd/system/likenovel-dev-rds-reconcile.timer
```

설치 또는 갱신 후에는 `systemctl daemon-reload`, `systemctl enable --now likenovel-dev-rds-reconcile.timer`를 실행하고 `systemctl list-timers`, service journal, DEV RDS 상태를 함께 읽는다. 제거 rollback은 timer disable, 두 unit과 runtime script 삭제, daemon-reload, `LikeNovelDevRdsReconcileFromWas` inline policy 삭제 순서다.
- 최초 활성화나 GitHub AWS 자격증명 교체 후에는 `Dev RDS lifecycle` workflow를 `status`로 먼저 실행한다. `AccessDenied`가 나오면 웹 이미지를 다시 빌드하지 말고 IAM policy readback과 exact DEV ARN 범위를 먼저 복구한다.

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
1. WSL 저장소에서 DEV RDS 임대를 시작하고 `available` 상태를 확인한다.

```bash
cd /home/hongsan/work/likenovel
bash devtools/dev-rds.sh work-start
```

2. Git Bash에서 SSH 터널 유지 창을 1개 띄운다.

```bash
ssh -i "/c/Users/Hongsan/Downloads/ln_kp.pem" -o IdentitiesOnly=yes \
  -o "ProxyCommand=ssh -i /c/Users/Hongsan/Downloads/ln_kp.pem -o IdentitiesOnly=yes -W %h:%p ln-admin@3.34.11.39" \
  -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -N \
  -L 13306:likenovel-dev.c9wkga0gurzf.ap-northeast-2.rds.amazonaws.com:3306 \
  -L 18080:127.0.0.1:8080 \
  ln-admin@10.0.100.110
```

3. PowerShell에서 터널 포트를 확인한다.

```powershell
Test-NetConnection 127.0.0.1 -Port 13306
Test-NetConnection 127.0.0.1 -Port 18080
```

4. 백엔드 API 컨테이너를 재생성해 런타임 env를 다시 반영한다.

```powershell
cd C:\Users\Hongsan\Downloads\likenovel\likenovel-service-api\likenovel-service-api\fastapi_be_server
docker compose up -d --force-recreate api
```

5. 로컬 백엔드 런타임 값(컨테이너 기준)을 아래로 맞춘다.
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
