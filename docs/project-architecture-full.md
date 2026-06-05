# LikeNovel 프로젝트 종합 아키텍처 문서

> Status: HISTORICAL ARCHITECTURE SNAPSHOT - VERIFY BEFORE USE
> 최종 업데이트: 2026-02-18
> 목적: 프로젝트 전체 구조를 한 문서에서 파악할 수 있도록 정리
> Current entrypoints: root `CLAUDE.md`, `AGENTS.md`, and `docs/wiki/README.md`.
> Deploy, DB, cron, and batch runtime paths must be checked in
> `docs/deployment-runbook.md` and `docs/wiki/deployment-and-batch.md`.

---

## 1. 프로젝트 개요

웹소설 플랫폼 LikeNovel. 3개 프론트엔드 + 1개 백엔드(서브모듈)로 구성.

| 앱 | 경로 | 프레임워크 | 역할 |
|----|------|-----------|------|
| **유저웹** | `service/` | Next.js 14 | 소설 열람/결제/작가도구 |
| **파트너** | `partner/` | Next.js 15 | 상품관리/통계/정산 |
| **CMS** | `cms/` | Next.js 15 | 운영관리/배너/이벤트/유저 |
| **백엔드** | `likenovel-service-api/.../fastapi_be_server/` | FastAPI | REST API (CQRS) |

---

## 2. 기술 스택 요약

### 프론트엔드 공통
- React Query v5 (서버 상태), Zustand (클라이언트 상태)
- Tailwind CSS + Radix UI + shadcn/ui
- TypeScript, Yarn

### 앱별 차이
| | 유저웹 | 파트너 | CMS |
|---|--------|--------|-----|
| HTTP | axios (interceptor) | fetch apiClient | fetch apiClient |
| 에디터 | TipTap | - | TipTap 3.1 |
| 차트 | - | Recharts | Recharts |
| 뷰어 | react-reader (EPUB) | - | - |
| 결제 | @portone/browser-sdk | - | - |
| 엑셀 | - | xlsx | xlsx |

### 백엔드
- FastAPI + Gunicorn/Uvicorn
- SQLAlchemy async + aiomysql (MySQL 8.0)
- Keycloak (JWT RS256), Meilisearch, Cloudflare R2, PortOne, Firebase FCM

---

## 3. 인프라 & 배포

### 서버 구성
```
[ln-web] 10.0.0.201
  ├── Docker Compose: service(3000), partner(3001), cms(3002)
  ├── Docker Compose (dev): service(3100), partner(3101), cms(3102)
  └── Nginx: 도메인별 리버스 프록시 + SSL (Cloudflare Origin)

[ln-was] 10.0.100.110 (t2.small, 2 GiB — 2026-04-23 업그레이드)
  ├── gunicorn daemon: api(3010, prod), api-dev(3011, dev)
  ├── Keycloak: 8080
  ├── Meilisearch: 7700
  └── systemd 자동기동 (2026-04-23~):
      likenovel-api / likenovel-api-dev / likenovel-keycloak / likenovel-meilisearch

[AWS RDS] MySQL 8.0 (dev/prod 분리)
```

### 도메인
- 운영: `*.likenovel.net`
- 스테이징: `*.likenovel.dev`

### CI/CD
- **프론트**: `git push dev|prod` → GitHub Actions → Docker build → ECR push
- **백엔드**: submodule push → CodeDeploy → ln-was

### 환경변수 (2026-02-18 당시 메모)

> Current frontend Docker env handling is documented in
> `docs/deployment-runbook.md`. Do not use these names as live deployment
> instructions without source/runtime readback.

| 파일 | 용도 |
|------|------|
| `.env` | 로컬 개발 |
| `.env.production.dev` | 스테이징 |
| `.env.production.prod` | 운영 |

---

## 4. 백엔드 API 구조 (CQRS)

### 라우터 자동 등록
```
*_query.py   → /v1/query/{domain}/*    (GET)
*_command.py → /v1/command/{domain}/*   (POST/PUT/DELETE)
```

### 도메인 (10개)
`admin` / `auth` / `common` / `content` / `event` / `gift` / `order` / `partner` / `product` / `user`

### 엔드포인트 규모: ~386개 (51 라우터 모듈)

### 서비스 계층: 60개 파일 (비즈니스 로직)

### DB 모델: 9개 SQLAlchemy 모듈, 37+ 마이그레이션 SQL

---

## 5. 유저웹 (service/) 구조

### 핵심 페이지
| 경로 | 기능 |
|------|------|
| `/` | 메인 (배너, 무료Top, 유료Top, CP프로모, 추천) |
| `/product/[id]` | 상품 상세 |
| `/product/free/*`, `/paid` | 무료/유료 목록 |
| `/product/top50/*` | 랭킹 |
| `/viewer/[id]` | EPUB 소설 리더 |
| `/product/author/*` | 작가 도구 (작품/회차/오퍼/프로모션) |
| `/product/mypage/*` | 마이페이지 |
| `/login`, `/sign-up` | 인증 |

### 인증 플로우
1. AuthInitializer → 스토리지에서 토큰 복원
2. GET /v1/query/user → 서버 동기화
3. 401 → 토큰 갱신 (POST /v1/command/auth/token/reissue) → 재시도
4. OAuth: Naver, Kakao, Google, Apple

### 핵심 컴포넌트
- **ProductListCard** (37KB): 랭킹/뱃지/관심 복합 카드
- **EpubViewer** (26KB): react-reader EPUB 렌더링
- **CommentArea** (24KB): 중첩 댓글 시스템
- **GlobalNav**: 검색, 성인토글, 알림, 선물함

### 비즈니스 기능
- EPUB 소설 열람 (테마, 폰트, 스크롤 설정)
- 티켓 시스템 (무료/유료/대여/기다무/6-9패스)
- 결제 (PortOne), 선물함, 캐시
- 북마크, 평점 (9단계), 댓글
- 작가: 작품등록, 회차관리, CP오퍼, 프로모션

---

## 6. 파트너 (partner/) 구조

### 핵심 페이지
| 경로 | 기능 |
|------|------|
| `/products` | 상품 목록 (검색/필터/페이징/엑셀) |
| `/products/upload` | 상품 등록/수정/조회 (mode 파라미터) |
| `/products/upload/episodes` | 회차 일괄 업로드 (최대 200건) |
| `/statistics/*` | 회차별/시간별 통계, 장바구니 분석 |
| `/sales/*` | 월매출, 회차매출, 일일패스 |
| `/adjustments/*` | 월간정산, 선급금, 기타수입 |

### 회차 워크플로우
`업로드 → 심사요청 → 심사중 → 승인/거부 → 판매시작/예약`

### 인증
- POST /v1/command/partners/login
- CMS와 postMessage 토큰 동기화

---

## 7. CMS (cms/) 구조

### 핵심 페이지
| 경로 | 기능 |
|------|------|
| `/statistics/*` | 사이트/결제/사용자 통계 |
| `/products/distribution/*` | 유통 상품 관리 (핵심) |
| `/banners/*` | 배너 CRUD |
| `/events/*` | 이벤트 CRUD (수신자 다운로드) |
| `/exposure-accounts/*` | 추천/프로모션 관리 |
| `/promotions/*` | 셀프/선물함/신청 프로모션 |
| `/quests/*` | 퀘스트 관리 |
| `/users/*` | 유저/뱃지/자격 관리 |
| `/faqs/*`, `/notices/*`, `/popups/*` | 콘텐츠 관리 |
| `/messages/*` | 메시지/푸시 관리 |

### CMS 전용 기능 (파트너에 없음)
- 회차 심사 승인/거부
- 배너/이벤트/퀘스트/팝업/공지 CRUD
- 추천/노출 관리
- 유저 관리 (밴, 역할 변경)
- 사이트 전체 통계

---

## 8. React Query 캐싱 현황

### 현재 기본값 (3개 앱 공통)
```typescript
staleTime: 5000  // 5초
// gcTime: 기본값 (5분)
```

### 훅 수
- service: useQuery 90+, useInfiniteQuery 다수
- partner: useQuery 39
- cms: useQuery 74

### 캐싱 개선 계획 (docs/caching-kickoff-plan-2026-02-18.md)
- A. 정적 데이터 (배너, 장르): staleTime 5m~30m
- B. 목록 데이터 (상품, 검색): staleTime 30s~3m
- C. 사용자 상태 (알림, 잔액): staleTime 0~10s
- D. 결제 민감 데이터: staleTime 0, 강제 refetch

---

## 9. 외부 서비스 연동 맵

| 서비스 | 용도 | 프론트 | 백엔드 |
|--------|------|--------|--------|
| Keycloak | OAuth/JWT | - | auth.py (JWKS) |
| PortOne | 결제 | @portone/browser-sdk | portone-server-sdk |
| Cloudflare R2 | 파일 스토리지 | - | boto3 (S3 호환) |
| Meilisearch | 전문 검색 | - | meilisearch SDK |
| Firebase FCM | 푸시 알림 | - | firebase-admin |
| NICE | 본인인증 | 콜백 처리 | HTTP API |
| Naver/Kakao/Google/Apple | 소셜 로그인 | OAuth redirect | 콜백 처리 |
| Mailtrap | 이메일 | - | mailtrap SDK |

---

## 10. 핵심 파일 인덱스

### 설정
| 파일 | 용도 |
|------|------|
| `service/next.config.mjs` | 유저웹 Next.js (API rewrite, 이미지 도메인) |
| `partner/next.config.ts` | 파트너 Next.js |
| `cms/next.config.mjs` | CMS Next.js |
| `fastapi_be_server/app/main.py` | FastAPI 앱 팩토리 |
| `fastapi_be_server/app/const.py` | 설정, 상수, 에러 메시지 |
| `fastapi_be_server/app/rdb.py` | DB 세션/엔진 |

### 인증
| 파일 | 용도 |
|------|------|
| `service/app/api/axios/index.ts` | axios interceptor (토큰 자동 갱신) |
| `service/store/authStore.ts` | Zustand 인증 상태 |
| `partner/lib/apiClient.ts` | fetch 기반 API 클라이언트 |
| `cms/lib/apiClient.ts` | fetch 기반 API 클라이언트 |
| `fastapi_be_server/app/utils/auth.py` | Keycloak JWT 검증 |

### API 훅
| 파일 | 용도 |
|------|------|
| `service/app/api/query/product/index.ts` | 상품 쿼리 훅 (메인) |
| `service/app/api/query/top50/index.ts` | 랭킹 훅 |
| `service/app/api/auth/index.ts` | 인증 mutation 훅 |
| `partner/api/product/index.ts` | 파트너 상품 훅 |
| `cms/api/distributionProduct/index.ts` | CMS 유통상품 훅 |

### 스타일/UI
| 파일 | 용도 |
|------|------|
| `service/app/globals.css` | 유저웹 글로벌 스타일 |
| `service/components/common/ProductListCard.tsx` | 37KB 복합 카드 |
| `service/components/viewer/EpubViewer.tsx` | EPUB 뷰어 |

---

## 11. 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| DEPLOYMENT.md | 루트 | CI/CD & 배포 가이드 |
| CURSOR_CHAT_MEMENTO_RECOVERY.md | 루트 | 운영 SSOT (서버, 이슈, 절차) |
| deployment-runbook.md | docs/ | 로컬/dev/prod 배포 절차 |
| partner-api-endpoint-standard.md | docs/ | 파트너 API 44+ 엔드포인트 카탈로그 |
| caching-kickoff-plan-2026-02-18.md | docs/ | React Query 캐싱 개선 계획 |
| epub-bulk-upload-plan.md | docs/ | EPUB 일괄 업로드 기획 |
| hold-issues-triage.md | docs/ | 이슈 트리아지 |
| hold-issues-from-tc.md | docs/ | TC 피드백 이슈 |
| CLAUDE.md | 백엔드 submodule | 백엔드 배포 가이드 |
