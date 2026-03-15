---
name: deploy
description: dev 또는 prod 환경에 프론트+백엔드를 배포한다. 커밋되지 않은 변경이 있으면 먼저 커밋한다.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, AskUserQuestion
argument-hint: "[dev|prod]"
user-invocable: true
---

# 배포 스킬

대상 환경: $ARGUMENTS (필수. dev 또는 prod)

## 사전 조건 확인

1. `$ARGUMENTS`가 `dev` 또는 `prod`인지 확인. 미지정이면 사용자에게 물어본다.
2. 현재 브랜치가 `main`인지 확인. 아니면 경고.

## 1단계: 미커밋 변경 확인

```bash
git status -u  # root repo
git -C likenovel-service-api/likenovel-service-api status -u  # backend submodule
```

- 변경사항이 있으면 사용자에게 커밋 여부를 물어본다.
- 커밋 메시지는 변경 내용을 요약하여 작성한다.

## 2단계: 백엔드 서브모듈 배포

백엔드 서브모듈에 변경이 있는 경우에만 실행:

```bash
cd likenovel-service-api/likenovel-service-api

# main push
git push origin main

# 대상 브랜치로 머지 & push
git checkout $ARGUMENTS
git merge main --no-edit
git push origin $ARGUMENTS

# main으로 복귀
git checkout main
```

- `dev` push → CodeDeploy(`ln-dep-dev`) 자동 트리거
- `prod` push → CodeDeploy(`ln-dep-grp-back`) 자동 트리거 + poetry version patch 자동

## 3단계: 프론트엔드 (root repo) 배포

```bash
cd /home/hongsan/work/likenovel

# main push
git push origin main

# 대상 브랜치로 머지 & push
git checkout $ARGUMENTS
git merge main --no-edit
git push origin $ARGUMENTS

# main으로 복귀
git checkout main
```

- `dev` push → GitHub Actions `docker-dev.yml` → ECR → ln-web Docker 배포
- `prod` push → GitHub Actions `docker-prod.yml` → ECR → ln-web Docker 배포

## 4단계: 배포 확인

배포 결과를 사용자에게 보고:

| 대상 | push 완료 | 자동 배포 |
|------|-----------|-----------|
| 백엔드 | `$ARGUMENTS` branch pushed | CodeDeploy 트리거됨 |
| 프론트 | `$ARGUMENTS` branch pushed | GitHub Actions 트리거됨 |

### dev 환경 URL
- 유저웹: https://likenovel.dev
- 파트너: https://partner.likenovel.dev
- CMS: https://cms.likenovel.dev
- API: https://api.likenovel.dev

### prod 환경 URL
- 유저웹: https://likenovel.net
- 파트너: https://partner.likenovel.net
- CMS: https://cms.likenovel.net
- API: https://api.likenovel.net

## 주의사항

- **prod 배포 시 반드시 사용자 확인을 받는다.** "prod에 배포합니다. 진행할까요?" 확인 후 실행.
- 운영 컨테이너명 절대 변경 금지: `likenovel-user-production`, `likenovel-partner`, `likenovel-admin`
- dev 환경은 `*.likenovel.dev` (`.net` 아님)
- 백엔드 서브모듈과 root repo는 별도 repo → 각각 push 필요
