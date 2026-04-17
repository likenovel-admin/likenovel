---
name: hotfix
description: prod 긴급 수정. 특정 파일만 선별 커밋해서 main → dev → prod 전체 플로우로 배포한다. WIP 변경사항은 stash로 보존.
allowed-tools: Read, Grep, Glob, Bash, Edit, AskUserQuestion
argument-hint: "[수정할 파일 경로 또는 이슈 설명]"
user-invocable: true
---

# 핫픽스 스킬

prod에 긴급 수정을 배포한다. 다른 WIP 변경사항이 있어도 **해당 핫픽스 파일만** 선별 커밋 → dev/prod 배포.

## 사전 조건

1. 수정 대상 파일이 식별되어 있어야 함 ($ARGUMENTS).
2. 현재 브랜치는 `main` 이어야 함. 아니면 경고.
3. 수정이 이미 로컬에 반영되었으면 바로 커밋 단계로, 아니면 먼저 코드 수정.

## 절대 규칙

- **main → dev → prod 순서 지킨다** (prod 직접 push 금지)
- **핫픽스 파일만 선별 add**, `git add .` / `git add -A` 금지
- WIP 파일은 건드리지 않음 (stash로 보존)

## 단계

### 1. 수정 확인

```bash
git status --short           # 전체 변경 확인
git diff <수정파일>          # 수정 내용 확인
```

수정 내용이 최소한/정확한지 검증. 의도한 변경만 들어있는지 확인.

### 2. 선별 커밋

```bash
git add <수정파일>
git status --short | head -10   # staged / unstaged 확인
git commit -m "Fix ...: <간단 설명>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### 3. main push

```bash
git push origin main
```

### 4. WIP stash (다른 변경이 있을 때만)

```bash
git status --short | grep -v "^??" | grep -v "^$" > /dev/null && git stash push -u -m "hotfix-wip-$(date +%Y%m%d-%H%M)"
```

### 5. dev 배포

```bash
git checkout dev
git merge main --no-edit
git push origin dev
```
→ GitHub Actions `docker-dev.yml` 자동 트리거

### 6. prod 배포 (dev 머지 완료 후 바로)

```bash
git checkout prod
git merge dev --no-edit
git push origin prod
```
→ GitHub Actions `docker-prod.yml` 자동 트리거

### 7. main 복귀 및 WIP 복원

```bash
git checkout main
git stash pop   # 4에서 stash했을 때만
```

stash pop 시 untracked 파일 충돌 경고가 나올 수 있음. WIP 파일(M)이 복원됐으면 `git stash drop`으로 정리.

### 8. 배포 확인

사용자에게 보고:
- 커밋 해시 및 변경 파일
- dev/prod push 성공
- GitHub Actions URL (선택): https://github.com/likenovel-admin/likenovel/actions

## 백엔드 서브모듈 핫픽스

`likenovel-service-api/` 수정이면 서브모듈도 같은 main→dev→prod 순서로:
```bash
cd likenovel-service-api/likenovel-service-api
git add <파일>; git commit -m "..."; git push origin main
git checkout dev; git merge main --no-edit; git push origin dev
git checkout prod; git merge dev --no-edit; git push origin prod
git checkout main
```

## 주의

- 핫픽스 파일에 불필요한 포맷 변경이 들어가지 않도록 주의
- `git diff --stat` 확인해서 변경 라인 수가 과하지 않은지 체크
- prod 머지 직후 `git log --oneline prod origin/prod -3`로 동기화 확인
- WIP stash가 untracked 파일(파일명에 특수문자 포함 등)로 충돌 시 해당 untracked는 무시하고 tracked 변경만 복원됨
