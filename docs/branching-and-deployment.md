# 브랜칭 & 배포 & 인프라 가이드

Last updated: 2026-03-17

---

## 1. 브랜치 모델

```
main (개발 기준)
 └─► dev   push → 스테이징(*.likenovel.dev) 자동 배포
      └─► prod  push → 운영(*.likenovel.net) 자동 배포
```

| 브랜치 | 역할 | 자동 트리거 |
|--------|------|-------------|
| `main` | 개발 통합 브랜치. 모든 작업의 기준점. | 없음 (코드 저장소) |
| `dev` | 스테이징 배포 트리거. main을 머지하면 CI/CD 실행. | `docker-dev.yml`, `deploy_be_actions_dev.yml` |
| `prod` | 운영 배포 트리거. **dev를 머지하면** CI/CD 실행. | `docker-prod.yml`, `deploy_be_actions.yml` |

> **흐름: `main` → `dev` (스테이징 검증) → `prod` (운영 배포)**
> prod에는 dev에서 검증된 코드만 올린다. main → prod 직접 머지 금지.

---

## 2. 레포지토리 구조

| 구분 | GitHub 레포 | 로컬 경로 |
|------|-------------|-----------|
| 프론트엔드 (root) | `likenovel-admin/likenovel` | `service/`, `partner/`, `cms/` |
| 백엔드 API (submodule) | `likenovel-admin/likenovel-service-api` | `likenovel-service-api/likenovel-service-api/` |

- 프론트/백엔드 **별도 레포** → 각각 커밋/푸시
- root repo push만으로는 백엔드 CI 실행 안 됨

---

## 3. AWS 인프라

### IAM

| 리소스 | 값 |
|--------|-----|
| AWS 계정 ID | `992382709044` |
| IAM 유저 (CI/CD + CLI) | `ln-infra` |
| CodeDeploy Role | `arn:aws:iam::992382709044:role/ln-codedeploy-role` |

### 서버

| 서버 | 사설 IP | 공인 | 역할 |
|------|---------|------|------|
| ln-web (Bastion) | 10.0.0.201 | ec2-3-34-11-39.ap-northeast-2.compute.amazonaws.com | 프론트 Docker + Nginx |
| ln-was | 10.0.100.110 | 없음 (사설만) | 백엔드 API (PM2) + Keycloak + Meilisearch |

### SSH 접속

```bash
# ln-web (Bastion) 직접 접속
ssh -i ~/pem/ln_kp.pem ln-admin@ec2-3-34-11-39.ap-northeast-2.compute.amazonaws.com

# ln-was 접속 (ln-web 경유)
ssh -i /home/ln-admin/.ssh/ln_kp.pem ln-admin@10.0.100.110

# 로컬에서 dev RDS + Keycloak 터널
ssh -i <pem> -o ProxyCommand="ssh -i <pem> -W %h:%p ln-admin@3.34.11.39" \
  -N -L 13306:likenovel-dev.c9wkga0gurzf.ap-northeast-2.rds.amazonaws.com:3306 \
  -L 18080:127.0.0.1:8080 ln-admin@10.0.100.110
```

### CodeDeploy

| 리소스 | 값 |
|--------|-----|
| 애플리케이션 | `ln-dep` |
| S3 버킷 | `ln-s3` |

| 배포 그룹 | 용도 | EC2 태그 |
|-----------|------|----------|
| `ln-dep-grp-back` | 백엔드 **운영** (prod) | `Name: ln-was` |
| `ln-dep-dev` | 백엔드 **스테이징** (dev) | `Name: ln-was` |
| `ln-dep-grp-front` | 프론트 운영 (legacy, 미사용) | - |
| `ln-dep-grp-partner` | 파트너 운영 (legacy, 미사용) | - |
| `ln-dep-grp-cms` | CMS 운영 (legacy, 미사용) | - |

- dev/prod 모두 같은 서버(ln-was), 다른 경로/포트로 배포
- prod: `/home/ln-admin/likenovel/api` (포트 3010)
- dev: `/home/ln-admin/likenovel/api-dev` (포트 3011)

### ECR 레포지토리

| Secret 키 | 용도 |
|-----------|------|
| `ECR_REPO_SERVICE` | service(유저웹) 이미지 |
| `ECR_REPO_PARTNER` | partner 이미지 |
| `ECR_REPO_CMS` | cms 이미지 |

---

## 4. GitHub Secrets

### Root 레포 (`likenovel-admin/likenovel`)

| Secret | 용도 | 상태 |
|--------|------|------|
| `AWS_ACCESS_KEY_ID` | AWS 인증 | 등록됨 |
| `AWS_SECRET_ACCESS_KEY` | AWS 인증 | 등록됨 |
| `AWS_REGION` | ap-northeast-2 | 등록됨 |
| `ECR_REPO_SERVICE` | ECR 레포명 | 등록됨 |
| `ECR_REPO_PARTNER` | ECR 레포명 | 등록됨 |
| `ECR_REPO_CMS` | ECR 레포명 | 등록됨 |
| `SERVICE_ENV_DEV` | service dev .env 내용 | 등록됨 |
| `PARTNER_ENV_DEV` | partner dev .env 내용 | 등록됨 |
| `CMS_ENV_DEV` | cms dev .env 내용 | 등록됨 |
| `SSH_PRIVATE_KEY` | ln-web SSH 접속 PEM 키 | 등록됨 |
| `SERVICE_ENV_PROD` | service prod .env 내용 | **미등록** |
| `PARTNER_ENV_PROD` | partner prod .env 내용 | **미등록** |
| `CMS_ENV_PROD` | cms prod .env 내용 | **미등록** |

### Backend 레포 (`likenovel-admin/likenovel-service-api`)

| Secret | 용도 | 상태 |
|--------|------|------|
| `AWS_ACCESS_KEY_ID` | AWS 인증 | 등록됨 |
| `AWS_SECRET_ACCESS_KEY` | AWS 인증 | 등록됨 |
| `AWS_REGION` | ap-northeast-2 | 등록됨 |
| `BACKEND_ENV_DEV` | 백엔드 dev .env 내용 | 등록됨 |
| `CODEDEPLOY_APP_NAME_BACKEND_DEV` | `ln-dep` | 등록됨 |
| `CODEDEPLOY_GROUP_NAME_BACKEND_DEV` | `ln-dep-dev` | 등록됨 |
| `CODEDEPLOY_S3_BUCKET` | `ln-s3` | 등록됨 |
| `CODEDEPLOY_CONFIG_NAME_BACKEND_DEV` | 미등록 (기본값 AllAtOnce) | 선택사항 |

---

## 5. 포트 배정

| 앱 | 운영 (.net) | 스테이징 (.dev) | 로컬 |
|----|-------------|-----------------|------|
| service | 3000 | 3100 | 3000 |
| partner | 3001 | 3101 | 3001 |
| cms | 3002 | 3102 | 3002 |
| API | 3010 | 3011 | 8000 |

---

## 6. 환경변수 (env) 차이

### 프론트엔드 — 환경별 파일

| 환경 | env 파일 | API 주소 | WWW 주소 |
|------|----------|----------|----------|
| 로컬 | `.env` | `host.docker.internal:8000` | `localhost:3000` |
| 스테이징 | `.env.production.dev` | `api.likenovel.dev` | `www.likenovel.dev` |
| 운영 | `.env.production.prod` | `api.likenovel.net` | `www.likenovel.net` |

CI에서는 GitHub Secrets → `.env.production`으로 덮어쓰기.

### env 키 — service vs partner/cms

| 역할 | service 키 | partner/cms 키 |
|------|-----------|---------------|
| API (클라이언트) | `NEXT_PUBLIC_API_SERVER_URI` | `NEXT_PUBLIC_API_URL` |
| API (서버 rewrite) | `API_SERVER_URI` | `NEXT_PUBLIC_API_URL` (동일 키) |
| 서버 전용 | `IRON_SESSION_PASSWORD`, `NICE_*`, `PORTONE_*` | 없음 |

### 백엔드 — 환경별 차이

| 키 | 로컬 | 스테이징 (dev) | 운영 (prod) |
|----|------|---------------|-------------|
| DB_IP | `host.docker.internal` (터널) | dev RDS endpoint | prod RDS |
| DB 계정 | `ln_root` | `ln_root` | `ln-admin` |
| KC_DOMAIN | `host.docker.internal:18080` | `keycloak:8080` | `keycloak:8080` |
| PORTONE | 테스트 키 | 테스트 키 | **운영 키** |

### OAuth 콜백 주소

모든 환경에서 OAuth 콜백(네이버/카카오/구글/애플)은 `api.likenovel.net`으로 고정.
NICE 본인인증 콜백만 환경별 분리: 로컬 `localhost:3010`, dev `www.likenovel.dev`, prod `likenovel.net`.

---

## 7. CI/CD 파이프라인

### 프론트엔드 (Docker → ECR)

```
dev push → GitHub Actions (docker-dev.yml) — 완전 자동
  1. Checkout
  2. AWS credentials (Secrets)
  3. ECR Login
  4. Secrets → .env.production 생성
  5. Docker build (ENV_FILE=.env.production)
  6. ECR push (dev-latest, dev-{SHA})
  7. SSH로 ln-web 접속 (SSH_PRIVATE_KEY_B64)
  8. ECR login → docker compose down/pull/up (service-dev, partner-dev, cms-dev)

prod push → GitHub Actions (docker-prod.yml) — ECR push만
  1~6. 동일 (prod-latest, prod-{SHA})
  서버 반영은 수동 (prod 시크릿 미등록 상태)
```

워크플로우 파일:
- `.github/workflows/docker-dev.yml` (dev) — SSH 자동 배포 포함
- `.github/workflows/docker-prod.yml` (prod)

paths 필터: `service/**`, `partner/**`, `cms/**` 변경 시에만 실행.

### 백엔드 (CodeDeploy)

```
submodule dev/prod push → GitHub Actions
  1. Checkout
  2. Poetry install + build (wheel 생성)
  3. [dev만] Secrets → .env.production 생성
  4. [dev만] appspec.dev.yml, run_be.dev.sh, gconf.dev.py → 기본 파일로 복사
  5. zip (*.whl + appspec.yml + run_be.sh + gconf.py + init/) → S3 업로드
  6. CodeDeploy create-deployment
```

워크플로우 파일:
- `likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml` (dev)
- `likenovel-service-api/.github/workflows/deploy_be_actions.yml` (prod)

prod만 자동 `poetry version patch` + commit + push.

---

## 8. 배포 절차

### 프론트 → 스테이징 (완전 자동)

```bash
# 1. main 커밋/푸시
git checkout main
git add <files>
git commit -m "feat: ..."
git push origin main

# 2. dev 머지/푸시 → CI 자동 트리거 → 서버 자동 반영
git checkout dev
git merge main
git push origin dev
# → docker-dev.yml: build → ECR push → SSH → compose down/pull/up (자동)

git checkout main  # 작업 브랜치 복귀
```

### 프론트 → 운영

```bash
git checkout prod
git merge dev --no-edit   # dev에서 검증된 코드만 운영으로
git push origin prod
git checkout main
# → docker-prod.yml: build → ECR push → ln-web SSH → compose pull/up
```

### 백엔드 → 스테이징

```bash
cd likenovel-service-api/likenovel-service-api

git checkout main
git add <files>
git commit -m "feat: ..."
git push origin main

git checkout dev
git merge main
git push origin dev  # → CodeDeploy 자동 배포
git checkout main

# root repo submodule 포인터 업데이트
cd ../..
git add likenovel-service-api/likenovel-service-api
git commit -m "chore: bump backend submodule"
git push origin main
```

### 백엔드 → 운영

```bash
cd likenovel-service-api/likenovel-service-api
git checkout prod
git merge dev --no-edit   # dev에서 검증된 코드만 운영으로
git push origin prod      # → CodeDeploy 자동 배포 (버전 bump 포함)
git checkout main
cd ../..
```

### 히스토리/서브모듈 복구 절차

main/dev/prod 히스토리나 backend submodule pointer가 꼬였을 때는 아래 절차를 따른다.
이 절차의 목적은 중복 cherry-pick, stale submodule pointer, force-push로 repo를 더 망가뜨리는 일을 막는 것이다.

#### 절대 금지

- `git cherry-pick`으로 `main`/`dev`/`prod`를 맞추지 않는다.
- `git worktree`로 우회 작업하지 않는다.
- public branch에 force-push하지 않는다.
- `git add .` / `git add -A`를 쓰지 않는다.
- submodule pointer를 브랜치명 감으로 stage하지 않는다. 항상 fetch 후 명시 SHA를 확인한다.

#### 정상화 순서

1. backend repo `main -> dev`를 `--no-ff` merge commit으로 연결한다.
2. backend repo `dev -> prod`를 `--no-ff` merge commit으로 연결한다.
3. root repo `main -> dev`를 `--no-ff` merge commit으로 연결한다.
4. root repo `dev -> prod`를 `--no-ff` merge commit으로 연결한다.
5. 각 단계는 하나씩 끊고, push 전후로 Actions와 모니터링을 확인한다.

#### 각 단계 시작 전 lock

```bash
git fetch origin --quiet
git branch --show-current
git status --short --branch
git rev-parse --short origin/main origin/dev origin/prod
for f in CHERRY_PICK_HEAD REBASE_HEAD MERGE_HEAD; do test -e .git/$f && echo $f; done
git merge-base --is-ancestor origin/main origin/dev; echo main_to_dev=$?
git merge-base --is-ancestor origin/dev origin/prod; echo dev_to_prod=$?
```

원격 SHA가 작업 중 바뀌면 push하지 말고 다시 lock부터 시작한다.

#### submodule conflict resolve

root merge에서 backend submodule conflict가 나면 Git의 자동 제안을 그대로 믿지 않는다.
특히 submodule local `prod` branch가 stale일 수 있으므로 브랜치명으로 resolve하지 않는다.

```bash
git -C likenovel-service-api/likenovel-service-api fetch origin --quiet
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <old-root-pointer> <target-backend-sha>
git -C likenovel-service-api/likenovel-service-api merge-base --is-ancestor <incoming-root-pointer> <target-backend-sha>
git -C likenovel-service-api/likenovel-service-api checkout --detach <target-backend-sha>
git add likenovel-service-api/likenovel-service-api
```

의도된 pointer commit은 아래처럼 의도를 명시한다.

```bash
ALLOW_SUBMODULE_POINTER_COMMIT=1 git commit --no-edit
```

#### push 전 gate

```bash
git diff --cached --name-status
git diff --cached --submodule=log -- likenovel-service-api/likenovel-service-api
git diff --cached --check
git diff --name-only --diff-filter=U
git show -s --format='%H%nparents: %P%nsubject: %s' HEAD
```

- 허용 파일 외 diff가 있으면 push하지 않는다.
- stale backend SHA나 downgrade SHA가 보이면 push하지 않는다.
- service 변경이 포함되면 `corepack yarn --cwd service build`를 통과해야 한다.
- push 전 레드팀이 critical/high blocker 없음을 확인한다.

#### 이미 꼬였을 때 조치

- merge 중이고 commit 전이면 `git merge --abort` 후 lock부터 다시 시작한다.
- local commit만 있고 push 전이면 push하지 않는다. diff/parents를 보고 사용자 승인 후 되돌리거나 새 merge commit을 만든다.
- 이미 잘못 push했다면 force-push로 지우지 않는다. 현재 원격 SHA를 새 lock으로 잡고, 올바른 SHA로 forward-fix merge/align commit을 추가한다.
- backend prod 배포가 CodeDeploy version update commit을 추가했으면 root prod pointer는 그 최신 backend prod SHA로 align한다. dev bridge SHA로 내리면 downgrade다.
- 완료 판정은 root/backend 모두에서 `main -> dev`, `dev -> prod` ancestry가 `0`일 때만 한다.

---

## 9. 서버 컨테이너/프로세스 구성

### ln-web — Docker 컨테이너

| 환경 | 컨테이너명 | 포트 |
|------|-----------|------|
| 운영 service | `likenovel-user-production` | 3000 |
| 운영 partner | `likenovel-partner` | 3001 |
| 운영 cms | `likenovel-admin` | 3002 |
| dev service | `likenovel-user-dev` | 3100 |
| dev partner | `likenovel-partner-dev` | 3101 |
| dev cms | `likenovel-admin-dev` | 3102 |

운영 컨테이너명/포트 **절대 변경 금지**.

### ln-was — PM2 프로세스

| 환경 | PM2 이름 | 경로 | 포트 |
|------|---------|------|------|
| 운영 | `api` | `/home/ln-admin/likenovel/api` | 3010 |
| dev | `api-dev` | `/home/ln-admin/likenovel/api-dev` | 3011 |

---

## 10. 미완료 / 알려진 이슈

- [ ] Root 레포 prod 시크릿 미등록 (`SERVICE_ENV_PROD`, `PARTNER_ENV_PROD`, `CMS_ENV_PROD`)
- [x] ~~프론트 ECR push 후 ln-web 컨테이너 갱신~~ → `docker-dev.yml`에 SSH 배포 단계 추가 완료
- [ ] OAuth 콜백 주소가 dev 환경에서도 `api.likenovel.net`으로 고정 → dev에서 소셜 로그인 불가
- [ ] `service/.env.production` 파일에 `.dev`와 `.net` URL 혼재
