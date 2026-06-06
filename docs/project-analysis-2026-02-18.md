# LikeNovel 프로젝트 분석 노트 (2026-02-18)

> Status: HISTORICAL SNAPSHOT - VERIFY BEFORE USE
> Current entrypoints: root `CLAUDE.md`, `AGENTS.md`, and `docs/wiki/README.md`.
> Deploy, DB, cron, and batch work must use `docs/deployment-runbook.md` and
> `docs/wiki/deployment-and-batch.md`. Notes below may contain PM2-era or
> pre-CodeDeploy-hard-gate assumptions.

## 1) 범위와 기준 경로
- 루트: `C:\Users\Hongsan\Downloads\likenovel`
- 백엔드 기준 경로: `C:\Users\Hongsan\Downloads\likenovel\likenovel-service-api\likenovel-service-api`

## 2) 레포 구성 요약
- `service/`: 유저 웹 (Next.js 14, React Query, axios)
- `partner/`: 파트너 웹 (Next.js 15, React Query, fetch 기반 apiClient)
- `cms/`: CMS 웹 (Next.js 15, React Query, fetch 기반 apiClient)
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/`: FastAPI 백엔드
- `docs/`: 운영/배포/이슈/기획 문서

파일 규모(대략):
- `service`: 47064 files
- `partner`: 33909 files
- `cms`: 37565 files
- `fastapi_be_server`: 484 files

## 3) 읽은 MD 문서 정리
### 루트/운영 문서
- `DEPLOYMENT.md`
- `docs/deployment-runbook.md`
- `CURSOR_CHAT_MEMENTO_RECOVERY.md`
- `docs/partner-api-endpoint-standard.md`
- `docs/hold-issues-triage.md`
- `docs/hold-issues-from-tc.md`
- `docs/epub-bulk-upload-plan.md`

### 백엔드 경로 문서
- `likenovel-service-api/likenovel-service-api/CLAUDE.md`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/README.md`

### 당시 문서 핵심 결론
- 프론트 운영은 `ln-web`의 Docker Compose + Nginx reverse proxy가 기준.
- 스테이징은 `*.likenovel.dev` / 운영은 `*.likenovel.net`로 분리.
- 백엔드는 당시 읽은 문서/로그에 PM2 + gunicorn(uvicorn worker) 운용 흐름이 강하게 남아 있었음.
- 루트의 프론트 CI는 ECR 이미지 빌드/푸시 중심(`docker-dev.yml`, `docker-prod.yml`).
- 백엔드 CI는 submodule 기준 CodeDeploy(`deploy_be_actions_dev.yml`, `deploy_be_actions.yml`).

## 4) 런타임 아키텍처 요약
### 프론트
- `service/next.config.mjs`, `partner/next.config.ts`, `cms/next.config.mjs` 모두 `/api/:path*` rewrite 사용.
- 즉 브라우저 -> 각 Next 앱 `/api/*` -> 백엔드 API 구조.

### 백엔드
- `app/main.py`에서 `*_query.py`, `*_command.py` 라우터를 자동 등록.
- `app/routers` 하위 도메인:
  - `admin, auth, common, content, event, gift, order, partner, product, user`
- 라우트 데코레이터 검색 기준 endpoint decorator 약 386개.

## 5) API/프론트 구조 포인트
- `service/app/api/query/*`: 사용자 도메인 쿼리 훅 다수.
- `partner/api/*`, `cms/api/*`: 대부분 React Query 래퍼 훅 패턴.
- 파트너/CMS는 `lib/apiClient.ts` 기반 fetch 호출, `service`는 axios instance 중심.

## 6) 캐싱 관점의 현재 상태 (베이스라인)
- 세 앱 모두 React Query 기본 `staleTime: 5000` 공통 사용.
  - `service/hooks/useReactQuery.tsx`
  - `partner/hooks/useReactQuery.tsx`
  - `cms/hooks/useReactQuery.tsx`
- hook 사용량(대략):
  - `service/app/api`: `useQuery` 90, `useInfiniteQuery` 다수
  - `partner/api`: `useQuery` 39
  - `cms/api`: `useQuery` 74
- 특이 케이스:
  - `service/app/api/query/product/index.ts` 내 일부 mock query에 `staleTime: Infinity`, `gcTime: Infinity`
- 백엔드는 전역 Redis/공용 캐시 계층이 보이지 않음.
  - `app/const.py`에 `lru_cache` 제외 메모 존재.
  - `episode_service.py`에는 함수 내부 배치성 캐시(파일별 text count 집계용 dict)는 존재.

## 7) 현재 워크트리 상태 주의
- 이미 다수 파일이 수정/추가된 상태(`git status --short` 기준).
- 기존 변경은 유지한 채 신규 문서/신규 기능 단위로 작업하는 전략이 안전.

## 8) 개발 시작 체크리스트
1. 캐싱 정책 기준표를 먼저 고정한다.
2. 읽기 트래픽이 큰 조회 훅부터 우선 적용한다(메인/탑50/검색/목록).
3. mutation 성공 시 invalidate 규칙을 도메인별로 명확히 넣는다.
4. 캐시 변경 전후 API 호출량/렌더 횟수 비교 지표를 남긴다.
