# AI Chat Freeform State Machine Design

자유질문 채팅(`/v1/command/ai/chat`의 freeform 경로) 전용 설계 문서다.
이 문서는 [ai-chat-freeform-contract.md](ai-chat-freeform-contract.md)의 금지/허용 계약을 전제로, freeform data agent가 **LLM이 판단하고 서버는 hard guard만 담당**하는 구조를 정의한다.

## 1. 원칙

- freeform은 `preset 추천기`가 아니다.
- freeform은 `read-only data agent`다.
- LLM은 질문 해석, 조회, 비교, 선택, 최종 문장 작성을 맡는다.
- 서버는 읽기 전용 가드와 tool call 한도만 강제한다.
- freeform에서 서버가 별도 추천 점수식/판단 엔진을 만들지 않는다.

## 2. 문제 정의

현재 freeform 경로에서 반복적으로 생기는 문제는 다음 3가지다.

1. tool loop가 길어지고 종료가 불안정하다.
- `run_readonly_query`를 반복하다가 `submit_final_recommendation` 없이 끝나는 케이스가 있다.

2. generic fallback이 원인을 숨긴다.
- `추천할 작품을 찾아봤어요.`
- `추천 결과를 정리했어요. 카드에서 작품을 확인해 주세요.`
- 이런 문구는 왜 추천이 약했는지, 왜 선택을 못 했는지 설명하지 못한다.

3. freeform에 다시 서버 중심 추천 엔진을 넣으려는 관성이 있다.
- 이건 `data agent` 철학과 충돌한다.

## 3. 설계 목표

- freeform을 `질문 -> 조회 -> 선택 -> 종료` 흐름으로 단순화한다.
- 조회는 넓게 허용하되, read-only와 스코프만 엄격하게 지킨다.
- LLM이 `무엇을 볼지`, `언제 멈출지`, `어떻게 답할지`를 결정한다.
- 서버는:
  - `SELECT/WITH only`
  - allowlist
  - `LIMIT`
  - timeout
  - tool call count
  만 책임진다.

## 4. 상태머신

freeform 상태머신은 아래처럼 단순화한다.

```
START -> QUERY (max 2회) -> DETAIL (max 1회) -> FINALIZE
```

### 4-1. START
- 입력:
  - user query
  - current page context
  - current user taste summary
  - exclude product ids
- 출력:
  - normalized request context

### 4-2. QUERY
- LLM이 바로 `run_readonly_query`를 호출한다.
- `PLAN` 단계는 없다.
- `CATALOG`는 필수 상태가 아니다.
  - 필요한 경우에만 `get_fact_catalog`
  - 또는 fact catalog 핵심 내용은 시스템 프롬프트에 내장

서버가 강제하는 것:
- `run_readonly_query` 최대 2회
- `SELECT/WITH only`
- allowlist 테이블/컬럼
- `LIMIT`
- timeout
- adult scope

LLM이 판단하는 것:
- 어떤 테이블/컬럼이 필요한지
- query 1회로 충분한지
- 한 번 더 찾을지
- 바로 상세를 볼지
- 그냥 최종 제출할지
- 아니면 조건을 좁혀 물을지

### 4-3. DETAIL
- 최종 후보를 정했거나, 거의 정했다고 판단하면 `get_product_info`
- 최대 1회
- 목적:
  - 카드 hydration
  - `premise`
  - `hook`
  - `episode_summary_text`
  - 7축 태그
  - 장르
  - trend / engagement 근거 확인

### 4-4. FINALIZE
- 반드시 `submit_final_recommendation`
- freeform의 최종 종료는 이 tool로만 한다.
- 서버는 final reply를 다시 쓰지 않는다.

## 5. 서버 역할

서버는 판단자가 아니라 **가드**다.

### 서버가 하는 일
- read-only SQL 허용/차단
- 허용 테이블/컬럼 allowlist
- 다른 유저 개별 row 차단
- 민감정보 컬럼 차단
- `LIMIT`, timeout, 단일 문장 제한
- tool call 횟수 제한
- `product_id -> product payload` hydration

### 서버가 하지 않는 일
- 후보 간 최종 점수화
- top1 결정
- 더 찾을지/멈출지 판단
- clarify 여부 판단
- 추천 문장 작성

## 6. Tool 계약

### 6-1. get_fact_catalog
- 역할:
  - 허용 테이블/컬럼
  - 자주 틀리는 도메인 값
  - 회차 수 집계법
  - 조인 힌트
- freeform에서 강제 호출은 아니다.
- LLM이 필요할 때 먼저 보게 둔다.

### 6-2. run_readonly_query
- 역할:
  - 후보군 조회
- 제약:
  - `SELECT/WITH only`
  - allowlist 테이블/컬럼
  - 시스템 스키마 금지
  - comments 금지
  - multi statement 금지
  - `LIMIT`

### 6-3. get_product_info
- 역할:
  - 최종 후보 1개의 카드/메타 hydration
- 최대 1회

### 6-4. submit_final_recommendation
- 역할:
  - 최종 자연어 답변 + 최종 선택 제출
- 최소 payload:
```json
{
  "reply": "string",
  "product_id": 123
}
```

확장 payload 허용:
```json
{
  "reply": "string",
  "product_id": 123,
  "mode": "recommend"
}
```

clarify / weak finalize도 별도 상태가 아니라 이 tool의 output mode로 본다.

예:
```json
{
  "reply": "조건이 너무 빡세서 후보가 적어요. 완결은 유지하고 회차 기준만 조금 넓혀볼까요?",
  "product_id": null,
  "mode": "clarify"
}
```

```json
{
  "reply": "지금 조건에 정확히 맞는 작품은 적지만, 이 작품이 가장 가깝습니다.",
  "product_id": 123,
  "mode": "weak_finalize"
}
```

## 7. 종료 규칙

서버는 `hard limit`만 강제한다.

### hard limit
- `run_readonly_query`: 최대 2회
- `get_product_info`: 최대 1회
- 마지막은 반드시 `submit_final_recommendation`

### 서버 제한 초과 시
- 더 이상 쿼리를 실행하지 않는다.
- tool_result로:
  - `query limit exceeded`
  - `detail limit exceeded`
  를 반환한다.
- 그 상태에서 LLM이 현재까지 결과로 `submit_final_recommendation`을 제출하게 유도한다.

즉:
- 서버는 `이제 멈춰라`만 말한다.
- `무엇을 추천할지`는 여전히 LLM이 결정한다.

## 8. 점수화 원칙

freeform에서는 서버가 별도 추천 점수식을 갖지 않는다.

즉 아래는 freeform에서 하지 않는다.
- 서버 top1 랭킹 엔진
- 서버 취향 점수 + signal score 합산
- 서버 fallback 정책 엔진

이런 판단은 LLM이 조회 결과를 보고 한다.

예외:
- 버튼 preset / 구좌 추천 경로는 별도 서버 랭킹 엔진 유지 가능
- 하지만 freeform에 그 로직을 섞지 않는다

## 9. 응답 원칙

- 최종 추천 문장은 LLM이 작성한다.
- 서버는 문장을 덮어쓰지 않는다.
- generic fallback 문구를 freeform 기본값으로 두지 않는다.

금지:
- `추천할 작품을 찾아봤어요.`
- `추천 결과를 정리했어요. 카드에서 작품을 확인해 주세요.`

허용:
- 추천 가능한 경우
  - 질문 조건/취향 요약
  - 왜 이 작품인지
  - 근거 2개 이상
  - `이 작품은 어떠세요?`
  - `원하시면 같은 조건으로 다른 작품도 추천할까요?`
- 추천이 약하거나 불가능한 경우
  - 조건을 유지했는지 설명
  - 왜 후보가 약한지 설명
  - 질문 1개 또는 완화 제안 1개

## 10. 로깅

서버는 freeform 요청마다 아래를 기록한다.

- query count
- detail count
- tool call sequence
- `submit_final_recommendation` 제출 여부
- final tool 미제출로 hard limit 종료됐는지 여부
- generic fallback 사용 여부

이유:
- `왜 루프를 돌았는지`
- `왜 null로 끝났는지`
- `왜 선택을 못 했는지`
를 원인 중심으로 추적해야 하기 때문이다.

## 11. 구현 우선순위

1. freeform에서 `generic fallback` 제거
2. `submit_final_recommendation` 미제출 원인 로깅
3. query/detail hard limit 적용
4. hard limit 초과 시 LLM에 finalize를 강제하는 tool_result 추가
5. 그 다음에야 품질 튜닝

## 12. 완료 조건

- freeform이 `START -> QUERY(max2) -> DETAIL(max1) -> FINALIZE` 흐름으로 정리된다.
- 서버는 read-only guard와 hard limit만 담당한다.
- freeform에서 서버 추천 점수식/판단 엔진이 들어가지 않는다.
- `submit_final_recommendation` 없이 종료되는 케이스를 추적 가능하다.
- generic fallback 문구가 제거된다.
