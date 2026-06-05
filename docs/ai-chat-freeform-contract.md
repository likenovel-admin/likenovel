# AI Chat Freeform Contract

> Status: CURRENT CONTRACT
> Last reviewed: 2026-06-03
> Code remains the source of truth if this contract conflicts with implementation.

자유질문 채팅(`/v1/command/ai/chat`의 freeform 경로) 작업 시 반드시 따를 계약이다.

## 1. 목표
- freeform 채팅 백엔드는 `preset 추천기`가 아니라 `read-only data agent`로 동작해야 한다.
- LLM은 질문의 뉘앙스를 해석하고, 서버는 읽기 전용 조회 가드와 카드 연결만 담당한다.
- 유저가 무엇을 묻든, 허용된 작품/작품집계 DB 팩트를 최대한 활용해 유연하게 답해야 한다.

## 2. 역할 분리

### 서버가 해야 할 일
- `SELECT/WITH`만 허용하는 read-only 가드
- 허용 테이블/컬럼 allowlist 관리
- 민감정보/타 유저 개별 row 차단
- `LIMIT`, timeout, 단일 문장 제한
- 최종 추천 카드 hydration (`product_id -> product payload`)
- tool 오류를 복구 가능한 tool_result로 변환

### LLM이 해야 할 일
- 질문의 뉘앙스 해석
- 어떤 테이블/컬럼이 필요한지 판단
- read-only SQL 작성
- 후보 비교, 근거 추론, 최종 추천 문장 작성
- 추가 조건 질문이 필요한 경우 1회만 좁혀 묻기

## 3. freeform 경로 금지사항
- 아래 식별자/경로를 freeform 채팅 핵심 경로에 다시 연결하지 않는다.
  - `_infer_preset_from_query`
  - `_infer_preset_score_map`
  - `PRESET_PROMPT_MAP`
  - `search_products`
  - `recommendation_service.ai_chat(...)`
  - `keywords` / `signal_weights` 중심 legacy 검색 경로
  - `_build_product_synced_reply`
  - 서버가 최종 추천 문장을 템플릿으로 다시 조립하는 로직
- freeform 답변을 `preset` 4종(`completed`, `trending`, `good-schedule`, `stacked-chapters`) 중 하나로 먼저 잘라서 처리하지 않는다.

## 4. freeform 경로 허용사항
- 아래 tool 계약만 사용한다.
  - `get_fact_catalog`
  - `run_readonly_query`
  - `get_product_info`
  - `submit_final_recommendation`
- UI 버튼 preset은 별도 경로로 유지할 수 있다.
- 다만 freeform 경로가 버튼 preset 로직을 재사용하면 안 된다.

## 5. 데이터 접근 원칙
- 다른 유저 개별 row는 조회하지 않는다.
- 현재 로그인한 유저 자신의 취향 요약은 조회 가능하다.
- 작품 단위 집계 테이블은 적극적으로 조회한다.
- 허용된 작품/작품집계 테이블의 컬럼은 축약하지 말고 fact catalog에 충분히 노출한다.
- 새로운 질문 유형을 지원할 때는 먼저 `preset`을 늘리지 말고, allowlist 안에서 필요한 팩트를 더 꺼내는 쪽으로 해결한다.

## 6. 응답 원칙
- 최종 추천 문장은 LLM이 작성한다.
- 서버는 그 문장을 덮어쓰지 않는다.
- 서버는 빈 문장/비정상 응답일 때만 짧은 안전 문구로 대체한다.
- 카드 payload는 근거 확장에 필요한 메타를 넓게 담는다.
  - 예: `premise`, `hook`, `synopsisText`, `episodeSummaryText`, 7축 태그, 장르, trend/engagement 요약

## 7. 모호할 때의 규칙
- 아래 중 하나라도 애매하면 코딩을 멈추고 먼저 사용자에게 질문한다.
  - legacy 경로를 남겨둘지 제거할지
  - allowlist에 새 테이블/컬럼을 넣을지
  - 응답 계약을 서버가 보정해도 되는지
  - 집계값으로 충분한지, raw fact가 필요한지
- “기존 코드가 있으니 일단 재사용”은 허용 사유가 아니다.

## 8. 완료 조건
- freeform 경로에서 금지 식별자가 실질적으로 호출되지 않아야 한다.
- freeform 스모크 질문에서:
  - `get_fact_catalog`가 먼저 호출되고
  - `run_readonly_query` 결과를 근거로 답하며
  - 카드가 붙고
  - 최종 답변이 서버 템플릿으로 덮어써지지 않아야 한다.

## 9. 검수 체크
- `rg -n "_infer_preset_from_query|_infer_preset_score_map|PRESET_PROMPT_MAP|search_products|recommendation_service\\.ai_chat|_build_product_synced_reply" app/services/ai/ai_chat_service.py`
- 위 결과가 freeform 핵심 경로에 남아 있으면 실패로 본다.
