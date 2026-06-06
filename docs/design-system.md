# LikeNovel 디자인 시스템 (Figma 기반)

> Figma: `Li8iKpIsY9BaDsEEAARbp9` — 3 pages: userweb (0:1), partner (38:35210), cms (38:18210)

---

## 0. 앱별 기술 스택 차이

| | service (유저웹) | partner | cms |
|---|---|---|---|
| 색상 시스템 | 하드코딩 hex 토큰 | shadcn/ui HSL CSS변수 | shadcn/ui HSL CSS변수 |
| 폰트 | Pretendard Variable | Arial (기본) | Arial (기본) |
| 간격 단위 | `pxr` (px→rem 변환) | Tailwind 기본 | Tailwind 기본 |
| 반응형 | 모바일 우선 (`md:`) | 데스크톱 전용 | 데스크톱 전용 |
| 기본 radius | 없음 (인라인) | `--radius: 0.5rem` (8px) | `--radius: 0.5rem` (8px) |
| 다크모드 | 없음 | `darkMode: ["class"]` | `darkMode: ["class"]` |
| 플러그인 | line-clamp, scrollbar, typography | tailwindcss-animate | tailwindcss-animate, typography |

---

## 1. 유저웹 (service) 디자인 시스템

### 1.1 타이포그래피

| 용도 | Font | Weight | Size | letterSpacing |
|------|------|--------|------|---------------|
| 대형 헤딩 (모바일) | Pretendard Variable | 700 | 33px (100/@3x) | -2% |
| 페이지 타이틀 (모바일) | Pretendard Variable | 700 | 20px (60/@3x) | -2% |
| 섹션 타이틀 (데스크톱) | Pretendard Variable | 700 | 22px | -2% |
| 서브타이틀 | Pretendard Variable | 400 | 14px (42/@3x) | -2% |
| 본문 (데스크톱) | Pretendard Variable | 400 | 16px | -2% |
| 본문 (모바일) | Pretendard Variable | 400 | 12px (36/@3x) | -2% |
| 중간 라벨 | Pretendard Variable | 500 | 12px (36/@3x) | -2% |
| 소형 라벨 | Pretendard Variable | 500 | 12px | -2% |
| 본문 (데스크톱 상세) | Pretendard Variable | 400 | 15px | -2% |

**규칙:**
- 폰트: **Pretendard Variable** 단일 (뷰어 전용 NanumMyeongjo, MaruBuri 제외)
- `letter-spacing: -2%` → Tailwind `tracking-[-2%]` 전역 적용
- font-weight: **400(Regular), 500(Medium), 700(Bold)** 세 단계만
- Tailwind `pxr` 단위: `text-14pxr`, `text-16pxr` 등

### 1.2 컬러 팔레트

#### Tailwind 토큰 (service/tailwind.config.ts)
| 토큰 | 값 | 용도 |
|------|----|------|
| `primary-100` | #176BF2 | 파란 액센트 (배지, 링크) |
| `primary-200` | #0456D9 | GNB 선택 색상 |
| `black-100` | #111317 | 본문 텍스트 (Figma #111317 매핑) |
| `black-200` | #191A1F | 진한 텍스트 |
| `dark-gray-400` | #6B6E76 | 서브텍스트 (Figma #6B6E76 매핑) |
| `dark-gray-500` | #4D5159 | 서브텍스트 (Figma #4D5159 매핑) |
| `dark-gray-700` | #292C33 | 다크 요소 |
| `light-gray-100` | #F5F5F5 | 카드 배경, 구분선 영역 |
| `light-gray-200` | #F0F2F6 | 연한 배경 |
| `light-gray-400` | #E5E8EF | 모달 border |
| `light-gray-500` | #D9DDE4 | 카드 border |
| `light-gray-600` | #C7CCD7 | 버튼 border |
| `red-100` | #FF2703 | 경고, 에러 |
| `deactivate-color` | #9EA4AF | 비활성 |

**Figma 색상 → 토큰 매핑:**
- `#000000` → `text-black-100` (근사치)
- `#111317` → `text-black-100` (정확)
- `#4D5159` → `text-dark-gray-500` (정확)
- `#6B6E76` → `text-dark-gray-400` (정확)
- `#D9D9D9` → `bg-light-gray-500` (근사치)
- `#DEDEDE` → `border-light-gray-500` (근사치)

**규칙:**
- 새 색상 토큰 추가 금지 — 가장 가까운 기존 토큰 사용
- 인라인 `text-[#xxxxxx]` 최소화
- 배경: `bg-white` 또는 `bg-light-gray-100`
- 텍스트: `text-black-100`(기본), `text-dark-gray-500`(서브), `text-deactivate-color`(비활성)

### 1.3 레이아웃

| 요소 | 모바일 | 데스크톱 |
|------|--------|----------|
| 컨텐츠 최대폭 | 100% | `max-w-[1120px] mx-auto` |
| 좌우 패딩 | `px-16pxr` | `px-0` |
| 섹션 간격 | `py-30pxr` | `py-70pxr` |
| 아이템 간격 | `gap-10pxr` | `gap-20pxr` |
| 브레이크포인트 | 기본 (375px) | `md:` (768px) |
| GNB 높이 | ~43px | 100px |

**반응형 기본 패턴:**
```html
<div className="px-16pxr md:px-0 w-full max-w-[1120px] mx-auto">
```

### 1.4 컴포넌트

#### 카드 (ProductListCard)
- border-radius: `rounded-[10px]`
- 모바일: border 없음, 최소높이 155px, 썸네일 86×130
- 데스크톱: `border border-light-gray-500`, 최소높이 208px, 썸네일 110×166

#### 모달
- border-radius: `rounded-[20px]`
- border: `border border-light-gray-400`
- shadow: `shadow-xl`
- margin: `m-[15px]`

#### 버튼
- 기본: `rounded-lg` (8px)
- 작은 버튼: `rounded-[6px]`
- Pill: `rounded-[100px]`
- CTA: `rounded-[14px]`

#### 구분선
- 얇은: `border-light-gray-500`
- 블록: `bg-light-gray-100 h-[20px]`

#### 그림자
- 스티키 헤더: `shadow-[0px_6px_10px_0px_rgba(0,0,0,0.06)]`
- 모달: `shadow-xl`

### 1.5 그리드 패턴

| 패턴 | 모바일 | 데스크톱 |
|------|--------|----------|
| 이벤트 카드 | 2열, gap 7px | 4열 (256px), gap 19px |
| 선물함 | 1열 | 2열 (530px), gap 20px |
| 작품 캐러셀 | 가로스크롤, pl-16pxr | overflow-hidden, pl-0 |

### 1.6 애니메이션
- fadeUp: 0.3s ease-in-out (translateY 10px → 0)
- fadeIn: 0.3s ease-in-out (opacity)
- slideInFromLeft: 0.5s ease-in-out (translateX -30% → 0)

---

## 2. 파트너 (partner) 디자인 시스템

### 2.1 페이지 구조 (Figma 42개 화면)

```
+--------------------------------------------------+
|              1920px 뷰포트                         |
+--------+-----------------------------------------+
| Sidebar|  Top Header Bar (1512×64, y=40)         |
| 224px  |  - 페이지 타이틀 (좌) + 프로필 (우)         |
|        +-----------------------------------------+
|        |  Content Area (x=309, y=158)             |
|        |  테이블 너비: 1510~1586px                  |
|        |                                          |
|        +-----------------------------------------+
|        |  Pagination (x=309, y=1007, h=50)        |
+--------+-----------------------------------------+
```

**기능 카테고리 (Figma 화면 분류):**
- 작품 관리: 작품 리스트, 작품 수정 (작가/CP vs 관리자), 회차업로드
- 매출 및 정산: 작품별 월매출, 회차별 매출, 일별 이용권, 월별 정산, 선계약금 차감
- 통계 분석: 작품별/회차별 통계, 장바구니 분석, 시간별 유입, 인구통계
- 후원 및 기타 수익: 후원 내역, 기타 수익, 후원 정산
- 발굴 통계: 발굴통계, 상세

### 2.2 타이포그래피

| 용도 | Font | Weight | Size |
|------|------|--------|------|
| 페이지 타이틀 | Pretendard | 600 | 30px |
| 폼 페이지 헤딩 | Pretendard | 600 | 22px |
| 섹션 타이틀 | Pretendard | 600 | 16px |
| 다이얼로그 타이틀 | Pretendard | 600 | 18px |
| 사이드바 카테고리 | Pretendard | 500 | 16px |
| 사이드바/테이블 항목 | Pretendard | 500 | 14px |
| 프로필명 | Pretendard | 500 | 13px |
| 브레드크럼 | Pretendard | 400 | 14px |
| 본문/테이블 셀 | Pretendard Variable | 400 | 14px |
| 날짜입력 | Pretendard Variable | 400 | 15px |
| 페이지네이션 | Pretendard Variable | 400 | 14px |
| 다이얼로그 설명 | Pretendard | 400 | 14px |

**규칙:**
- 기본 폰트: Pretendard (현재 코드는 Arial → 향후 교체 대상)
- Weight: 400(본문), 500(라벨/네비), 600(타이틀) — 700 미사용
- 통계 숫자에 Noto Sans KR 사용 사례 있으나, 코드에서는 Pretendard 통일 권장

### 2.3 컬러 팔레트

| 용도 | Figma Hex | shadcn 매핑 |
|------|-----------|-------------|
| 페이지 배경 | #FFFFFF | `bg-background` |
| 기본 텍스트 | #1F2124 | `text-foreground` |
| 서브 텍스트 | #4D5159 | `text-muted-foreground` 근사 |
| 사이드바 텍스트 | #656F88 | 인라인 `text-[#656F88]` |
| 사이드바 아이콘 | #8B96B0 | 인라인 |
| 사이드바 구분선 아이콘 | #7B88A6 | 인라인 |
| 사이드바 트리라인 | #D6DAE1 | `border` 근사 |
| 프로필명 | #3E3F4A | 인라인 |
| 비활성 텍스트 | #4A4F58 | 인라인 |
| 페이지네이션 비활성 | #4A4F58 | 인라인 |
| 테이블 헤더 배경 | #EEEEF9 | 인라인 `bg-[#EEEEF9]` |
| 테이블 구분선 | #CCCCCC | 인라인 |
| 입력 테두리 | #DCDCE9 | `border-input` 근사 |
| 포커스 테두리 | #337EFB | `ring` 대체 |
| 탭 액센트 | #337EFB | 인라인 |
| 버튼 테두리 | #D9D9D9 | `border` |
| 페이지네이션 테두리 | #E0E0EC | 인라인 |
| 모달 구분선 | #EFF0F4 | 인라인 |
| 사이드바 영역 구분선 | #E7E9EE | 인라인 |

### 2.4 레이아웃 수치

| 요소 | 값 |
|------|----|
| 뷰포트 | 1920px (데스크톱 전용) |
| 사이드바 너비 | 224px |
| 사이드바 배경 | white, 우측 1px `#E7E9EE` border |
| 로고 위치 | x=27, y=42, 171×33 |
| 사이드바 구분선 | y=144, 전체폭 1px |
| 네비 시작 | x=27, y=166 |
| 네비 카테고리 간격 | ~76px (카테고리 블록 간) |
| 네비 아이템 간격 | 24px (아이템 간 y 간격) |
| 탑바 | x=316, y=40, 1512×64 |
| 프로필 드롭다운 | 183×58, rounded-[100px], shadow `0px 5px 10px rgba(12,33,88,0.1)` |
| 컨텐츠 시작점 | x=309, y=158 |
| 사이드바↔컨텐츠 갭 | 85px (309-224) |
| 탑바↔컨텐츠 갭 | 54px (158-104) |
| 테이블 너비 | 1510~1586px |
| 테이블 헤더 높이 | 111~112px |
| 테이블 행 높이 | 91px |
| 테이블 행 구분선 | 1px |
| 페이지네이션 영역 높이 | 50px |
| 페이지네이션 위치 | x=309, y=1007 |

### 2.5 컴포넌트

#### 사이드바
- 너비 224px, 전체 높이, 흰색 배경
- 로고: 상단 (27, 42)
- 네비: 카테고리(500/16px) → 하위항목(500/14px), 색상 #656F88
- 트리라인: 14px 너비 수직선, #D6DAE1
- 카테고리 접기 화살표: 9.29×5.39, #7B88A6
- 하단 영역 구분선: x=27, y=976, 168px 너비

#### 탑바
- 좌측: 브레드크럼 (400/14px) + 페이지 타이틀 (600/30px)
- 우측: 프로필 (pill 형태, 183×58)
  - 아바타 40×40 원형
  - 이름 500/13px, #3E3F4A
  - shadow: `0px 5px 10px rgba(12,33,88,0.1)`

#### 테이블
- 헤더: bg #EEEEF9, 높이 111-112px
- 행: 91px 높이, 1px #CCCCCC 구분선
- 셀 텍스트: 400/14px
- 전체 shadow 없음 (플랫)

#### 페이지네이션
- 컨테이너: rounded `6px 6px 20px 20px`, shadow `0px 2px 4px rgba(12,33,88,0.1)`
- 페이지 버튼: 31.51×30, rounded-[6px]
- 활성 페이지: fill #1F2124, text white
- 비활성 페이지: border #E0E0EC, text #4A4F58
- 좌우 화살표: 31.51×30

#### 날짜 선택기
- 입력: 188×42, rounded-[6px], border #DCDCE9
- 텍스트: 400/15px, #4A4F58
- "~" 구분자 사이에 두 입력 필드
- 확인 버튼: 51×20, rounded-[3px]

#### 다이얼로그 모달
- 크기: 358×187
- radius: rounded-[20px]
- shadow: `0px 2px 4px rgba(12,33,88,0.1)`
- 타이틀: 600/18px, #111317
- 설명: 400/14px, #4D5159
- 구분선: 1px #EFF0F4
- 버튼: 텍스트 전용 (취소하기 500/16px, 확인 400/16px)

#### 버튼 타입
| 타입 | 크기 | Radius | BG | Border | 텍스트 |
|------|------|--------|----|--------|--------|
| 소형 액션 | 51×20 | 3px | white/#D9D9D9 | #D9D9D9 | 500/9px |
| 기본 CTA | 98×42 | 10px | #1F2124 | 없음 | 400/14px white |
| 보조 CTA | ~80×42 | 10px | white | #1F2124 | 400/14px #1F2124 |

#### 통계 카드
- 3열 그리드: 488px 카드 너비
- 카드 간 갭: 22px
- 높이: 401px (기본), 377px (보조)

#### 폼 (작품 수정 등)
- 카드: rounded-[20px], shadow `0px 2px 4px rgba(12,33,88,0.1)`, white 배경
- 헤딩: 600/22px
- 섹션 라벨: 600/16px, #424751
- 입력 테두리: #D2D2DB, rounded-[6px]
- 체크박스: 23×24, rounded-[6px], border #DEE1E8

---

## 3. CMS 디자인 시스템

### 3.1 페이지 구조 (Figma 47개 화면)

CMS Figma는 **로우파이 와이어프레임** (@2x 해상도 2880×1620). 흑백 톤.

**기능 카테고리:**
- 공지/FAQ (4화면): 목록 + 등록/수정
- 배너/팝업 관리 (3화면): 배너/팝업 목록, 추가/수정
- 이벤트 관리 (2화면): 목록, 등록/수정
- 퀘스트 관리 (2화면): 목록, 상세
- 메시지/푸시 (4화면): 내역, 템플릿, 직접발송, 상세
- 선물함 (1화면)
- 프로모션 (4화면): 직접/신청, 추가
- 추천 구좌 (7화면): 알고리즘 추천, 직접 추천, 등록/수정
- 출판사 프로모션 (3화면): 목록, 추가, 수정
- 테마 키워드 (2화면): 목록, 생성/수정 팝업
- 리뷰/댓글/공지 (4화면): 목록, 상세 3종
- 비율 조정 (1화면)
- 승급/자격 신청 (3화면)
- 뱃지 관리 (1화면)
- 회원 (3화면): 미탈퇴, 탈퇴, 관리
- 통계/결제 (2화면): 회원별 소비, Payment

### 3.2 CMS 레이아웃 (와이어프레임 기반)

CMS는 와이어프레임이므로 **파트너와 동일한 레이아웃 패턴**을 따른다:
- 좌측 사이드바 + 탑바 + 컨텐츠 영역
- shadcn/ui 기반 (partner와 globals.css 동일)

### 3.3 CMS 컬러 (와이어프레임)
와이어프레임 색상은 프로덕션과 다름. 실제 구현 시 **파트너와 동일한 shadcn/ui 토큰** 사용:
- `bg-background` (white)
- `text-foreground` (near-black)
- `text-muted-foreground` (gray)
- `border` (light gray)

### 3.4 CMS 전용 유틸리티 클래스
- `.require::after` — 필수 필드 빨간 별표
- `.badge-bronze/silver/gold/master` — 뱃지 스타일
- `.documents-popup-*` — 문서 확인 팝업
- `.daterangepicker` — 날짜 범위 선택기 전체 CSS

---

## 4. 앱 공통 패턴

### 4.1 페이지 유형별 UI 구조

#### 리스트 페이지 (partner/cms)
```
+-- 탑바 (브레드크럼 + 타이틀) --+
|                                 |
| [탭 필터] [검색/날짜 필터]       |
|                                 |
| +-- 테이블 --+                  |
| | 헤더 행     |                  |
| | 데이터 행×N |                  |
| +------------+                  |
|                                 |
| [페이지네이션]                   |
+---------------------------------+
```

#### 상세/수정 페이지 (partner/cms)
```
+-- 탑바 (브레드크럼 + 타이틀) --+
|                                 |
| +-- 카드 (rounded-20, shadow) -+|
| | 섹션 라벨                     ||
| | 입력 필드들                   ||
| +-----------------------------+|
|                                 |
| [취소] [저장]                    |
+---------------------------------+
```

#### 유저웹 리스트 페이지
```
+-- GNB (100px 데스크톱) --+
|                           |
| [섹션 타이틀]              |
| [가로 캐러셀 / 그리드]     |
|                           |
| [섹션 타이틀]              |
| [가로 캐러셀 / 그리드]     |
|                           |
+---------------------------+
```

### 4.2 컴포넌트 위계 (공통)

1. **페이지 셸**: 사이드바(partner/cms) 또는 GNB(service) → 컨텐츠 영역
2. **영역 구분**: 탭 → 필터 → 테이블/카드/캐러셀
3. **인터랙션**: 모달(생성/수정/확인) → 토스트(알림)
4. **네비게이션**: 페이지네이션(리스트) / 무한스크롤(유저웹 일부)

### 4.3 border-radius 통일 규칙

| 용도 | 유저웹 | partner/cms |
|------|--------|-------------|
| 소형 버튼/입력 | 6px | 6px |
| 기본 버튼 | 8px (`rounded-lg`) | 8px (`rounded-lg`) |
| 카드/CTA 버튼 | 10px | 10px |
| 모달/폼 카드 | 20px | 20px |
| Pill | 100px | 100px |
| 페이지네이션 컨테이너 | — | `6px 6px 20px 20px` |

### 4.4 그림자 통일 규칙

| 용도 | 값 |
|------|----|
| 스티키 헤더 (유저웹) | `0px 6px 10px 0px rgba(0,0,0,0.06)` |
| 카드/페이지네이션 (partner) | `0px 2px 4px 0px rgba(12,33,88,0.1)` |
| 프로필 드롭다운 (partner) | `0px 5px 10px 0px rgba(12,33,88,0.1)` |
| 모달 (유저웹) | `shadow-xl` (Tailwind 내장) |
| 모달 (partner) | `0px 2px 4px 0px rgba(12,33,88,0.1)` |

---

## 5. Figma 참조 방법

### 5.1 스케일 환산
- 유저웹 모바일: 1125px = @3x → **÷3** = 375px CSS
- 유저웹 데스크톱: 1920px = 1:1
- 파트너: 1920px = 1:1
- CMS: 2880px = @2x → **÷2** = 1440px CSS

### 5.2 호출 방법
```
mcp__figma__get_figma_data(fileKey="Li8iKpIsY9BaDsEEAARbp9", nodeId="섹션ID", depth=3)
```

### 5.3 주요 Figma 노드 ID
| 페이지 | ID | 화면수 |
|--------|----|--------|
| userweb | 0:1 | ~200+ 프레임 (24 섹션) |
| partner | 38:35210 | 42 프레임 |
| cms | 38:18210 | 47 프레임 |

---

## 6. 절대 하지 말 것

### 유저웹 (service)
1. `max-w-[1120px]` 대신 다른 값 사용 금지
2. Pretendard 외 폰트 사용 금지 (뷰어 제외)
3. `letter-spacing` 값 `-2%` 외 사용 금지
4. 새 색상 토큰 추가 금지 — 기존 팔레트에서 가장 가까운 값 사용
5. 데스크톱에서 `px-16pxr` 남겨두기 금지 — `md:px-0`
6. border-radius 임의값 금지 — 6/8/10/20/100px 중 선택
7. 모바일에서 카드 border 넣기 금지 — `md:border` 조건부만

### partner/cms 공통
1. shadcn/ui 토큰 무시하고 하드코딩 금지 — `bg-background`, `text-foreground` 등 사용
2. 사이드바 너비 224px 변경 금지
3. 테이블 행 높이 91px 기준 변경 금지
4. 페이지네이션 패턴 변경 금지 (6px-6px-20px-20px radius)
5. 모달은 반드시 rounded-[20px] + 적절한 shadow
6. partner Figma에 없는 색상 임의 추가 금지 — Figma 팔레트 내에서 선택
7. 기존 shadcn/ui 컴포넌트가 있으면 직접 구현 금지 — 기존 것 사용

### 전체
1. 앱 간 디자인 시스템 혼용 금지 (service 색상 토큰을 partner에서 쓰거나 그 반대)
2. Figma 미확인 상태로 신규 페이지 디자인 금지 — 반드시 해당 섹션 노드 조회
3. Figma 와이어프레임(CMS)의 색상을 그대로 프로덕션에 쓰기 금지
