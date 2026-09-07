# 주인공챗 전체 데이터·실행 흐름

> 상태: 2026-09-07 로컬 코드 readback 스냅샷. 배포 완료나 실작품 품질 보증 문서가 아니다.
> root HEAD: `794f0efe7449bfa6eef6cf459da8805c8f27f639`
> backend HEAD: `2f2b844a2dd90dfe4254125ca8db2d6445b4f2d7`
> 로컬 미커밋 registry 구조 변경 포함. 아래 과거 실작품 실험 기록과 이번 기능 검증을 구분한다. 관련 회귀 통과는 실작품 의미 품질·실제 MySQL·배포의 증거가 아니다.
> 위 두 HEAD는 각각 실제 checkout 기준이다. root가 기록한 gitlink와 backend checkout을 같다고 가정하지 않는다.
> PROD 런타임·DB·환경변수·현재 cron은 이번 문서화에서 재검증하지 않았다.

## 1. 범위와 사용자 목표

대상은 `session_kind=character_chat`인 고정 인물 주인공챗이다. 일반 웹소챗 Q&A·게임 및 AI 사서 freeform 채팅과 구분한다.

사용자 목표는 공개 회차 30개 안에서 주인공과 주요인물을 정확히 식별하고, 각 인물의 실제 언행·관계·상태를 원문 근거로 수집하여, 채팅에서 회차별 기억과 캐릭터 일관성을 유지하는 것이다. 특정 작품명·인물명에만 맞춘 예외 처리는 목표가 아니다.

이 문서는 현재 구현을 설명한다. 현재 구현의 제한을 목표 달성으로 바꿔 쓰지 않는다. 회차요약의 품질 불량은 확인된 문제가 아니며, 신호 추출 문제와 혼동하거나 요약 재생성의 근거로 삼지 않는다.

## 2. 전체 순서

```text
작품 원문
  → 대상 작품·공개 회차 선정
  → HTML 정규화 → 원문 문서·검색 청크 저장
  → 회차요약 생성 또는 재사용
      ├─ 구간요약·작품요약·기존 character_snapshot 구성
      └─ 첫 공개 3회차 원문 → 작품 단위 인물 registry LLM 식별
          → 이름과 무관한 고정 ID + 식별 근거 저장
          → 회차 원문 + 그 회차까지의 registry 근거 + 기존 회차요약
          → 순차 관측: 발화자 / 묘사 주체 / 상대 / 주장 여부 분리
          → 구조·연속 원문 구간·귀속 계약 검증 / 독립 요청 기록
          → 요청한 회차 prefix 전체 검증 후 신호 활성화
          → 같은 ID로 inventory 구성 (이름 재군집·주인공 재투표 없음)
              ├─ 원문 + 회차 범위 내 ID·식별 근거 → 장면 LLM 추출
              └─ 같은 ID의 회차별 언행 근거 → RP 자산 코드 조립
          → 자산 준비 상태 검사
          → 공개 카탈로그 계산·순위 스냅샷 발행
          → 메인 상위 12개 / 캐릭터 목록
          → 캐릭터·읽은 회차 선택
          → 세션 생성: 권한·인물·자산 재확인
          → 읽은 범위의 진입 맥락 조립
          → 첫 장면 LLM 생성 → 세션·첫 메시지 저장

사용자 메시지
  → 세션·작품·읽기 권한 확인
  → 세션/사용자 잠금 → 권한·상태 재조회
  → 중복 요청·무료 한도·과금 여부 확인
  → 캐릭터 근거·요약·최근 대화 로드
  → 원문 회상 필요 여부 LLM 판정
      ├─ 불필요: 추가 원문 없이 진행
      └─ 필요: 관련 요약 → 회차 후보 → 원문 청크 조회/검색
  → 런타임 시스템 프롬프트 조립
  → 답변 LLM 생성
  → 메시지·세션 메모리·과금·이용 기록 저장
  → 화면 표시 / 잠금 해제 / 다음 턴 반복
```

## 3. 사전 자산 준비: 단계 01–11

### 01. 배치 대상 선정

`build_story_agent_context_batch.sh`가 대상과 작업 우선순위를 정하고 `build_story_agent_context.py`를 실행한다. 기본은 `delta`이며 신규·변경·누락 및 보강할 자산을 대상으로 한다. 전체 재구축·명시 수리 경로도 있으므로 모든 실행이 같은 범위·커밋 경계를 갖는 것은 아니다.

작품 공개, 블라인드, AI 콘텐츠 이용 동의, 문맥 처리 제외 상태 등을 확인한다. 원문 배치의 기본 작품 상태에는 연재 중/완결이 포함되지만 공개 주인공챗 정책은 별도다.

| 경계 | 코드 기준 |
| --- | --- |
| 캐릭터 자산 회차 집합 | 공개·사용 중인 회차를 `(episode_no, episode_id)`로 정렬한 최초 30개 |
| 공개 주인공챗 작품 정책 | 연재 중, 공개 회차 15개 이상, 첫 공개 시점 `2026-03-01 00:00:00` 이상 등 |
| 공개 구좌 장면 준비 | 사용 가능한 장면을 가진 공개 회차 최소 5개 등 |

무료 회차 30개나 `episode_no <= 30`을 뜻하지 않는다. 번호가 빠져 있으면 공개 30번째 행의 회차 번호가 31 이상일 수 있다. 공개 여부와 유료 접근 권한은 별개다.

### 02. 원문 읽기·정규화·청크 저장

`resolve_source_payload`는 `tb_product_episode.episode_content`를 우선한다. 본문이 없고 EPUB fallback을 활성화한 경우에만 EPUB을 읽는다. 없거나 비어 있는 원문은 건너뛰며 정상 자산으로 가장하지 않는다.

`normalize_episode_html`로 HTML과 줄바꿈을 정리한 뒤 문서와 청크를 저장한다. 원문 해시·버전·활성 포인터로 변경과 재사용을 구분한다.

### 03. 회차요약 확보와 별도 파생 요약

`insert_episode_summary`에서 기존 입력에 맞는 요약을 재사용하거나 필요할 때 LLM으로 생성한다. 회차요약은 캐릭터 신호뿐 아니라 작품 맥락·회차 검색·읽은 범위 진입점에도 쓰인다.

`build_compound_summaries` 계열은 회차요약을 바탕으로 구간요약, 작품요약, 기존 `character_snapshot`을 코드로 구성한다. 이 스냅샷은 뒤의 `character_inventory_v3`와 다른 자산이다. 실제 full/delta 경로에 따라 이 파생 요약 갱신 위치는 다를 수 있다.

입력 해시 불일치는 재사용 계약의 불일치이지, 저장된 요약 내용이 나쁘다는 증거가 아니다.

### 04. 회차별 캐릭터 신호 추출

현재 로컬 `build_episode_character_signals_summaries`는 공개·사용 중인 원문을 `(episode_no, episode_id)` 순으로 최대 30개 읽는다. delta에서 뒤 회차 하나가 들어와도 최초 3공개 회차의 registry와 앞 회차 관측을 재사용해 순서대로 처리한다. 요약은 기존 저장물을 재사용하며 이 함수가 생성하지 않는다. 원문/앞 회차 요약이 없으면 호출·발행 전에 차단한다.

`character_identity_registry.py`가 다음 계약을 소유한다.

- 최초 3공개 회차로 개별 인물과 근거를 식별한다. 주인공은 최대 1명이며 미확정 역할을 억지로 주인공으로 채우지 않는다.
- `character:registry:<opaque-id>`는 작품·최초 출현 source·로컬 ref로 만들고 저장해 유지한다. 이름/별칭/직업은 ID가 아니다.
- 회차마다 고정 ID와 구별 가능한 원문 근거를 다시 제공한다. 아직 그 회차에 나타나지 않은 근거나 이름은 전달하지 않는다.
- 관측은 `speaker_ref`, `subject_ref`, `object_ref`, `assertion`을 분리한다. 이름을 나중에 알면 기존 ID의 `name_bindings`에 추가한다. 직업·대명사·집단명은 고유명과 구분하며 병합 키로 쓰지 않는다.
- 새로 식별한 개별 인물만 추가하며, 미해결 지시 표현은 미해결로 기록한다. 잘못된 비주인공 항목은 독립적으로 격리한다.

새 생산 경로는 기존 OpenRouter 모델 설정·비용 원장·독립 요청 영수증을 사용한다. 기존 `request_episode_character_signals_payload`와 이름 신호 파서는 legacy 형식의 호환/검사 코드이며 새 배치의 생산 경로가 아니다. 해당 구형 계약의 공백 정규화 테스트 통과를 새 registry의 의미 품질 증거로 쓰지 않는다.

최초 registry는 기존 summary 테이블의 `work_character_registry` / `product:<id>` scope에 불변으로 저장한다. 이후 회차의 관측 신호에는 그 시점 registry 상태와 같은 `registry_id`가 함께 저장된다. 별도 테이블이나 추가 migration은 만들지 않았다. bootstrap 요청의 receipt stage는 기존 migration 111이 허용하는 `protagonist_resolution`, 회차 관측은 `signals`를 사용한다.

기존 `character_inventory_v3`가 있는데 registry가 없거나 운영자 identity review가 활성화된 작품은 `registry_existing_identity_requires_explicit_rebuild`로 호출 전에 차단한다. 이름을 비교해 기존 세션 ID를 새 ID로 추측 연결하지 않는다. 기존 reset/withdraw의 명시적인 작품 단위 트랜잭션이 전환을 소유하며, 실패 시 이전 자산을 복원해야 한다. 이 절은 운영 재구축·배포 승인이 아니다. 이미 저장된 registry는 bundle reset으로 삭제하거나 재식별하지 않는다.

### 05. 신호 검증·요청 기록·활성화

새 계약은 JSON 구조 → 원문 scope/공개 순서 → 정확한 인용 출현 → 인용을 포함하는 연속 귀속 문맥 → 고정 ID 참조를 검증한다. `occurrence`로 반복 문자열의 위치를 구분하며, 인용에 암묵적인 주어를 삽입하거나 `나/저/내/제`라는 특정 토큰을 필수로 요구하지 않는다.

원문 해시·문자 위치·회차 scope와 발화자/주체/주장 상태를 함께 저장한다. 같은 대사 출현에 서로 다른 발화자가 지정되면 양쪽을 모두 격리한다. 타인의 보고·가정을 대상 인물 자신의 확정 행동으로 승격하지 않는다. 부분 거절은 `coverage.state=partial`과 거절 이유를 남기고, 전부 거절됐으면 성공 자산을 발행하지 않는다. 원문에 존재한다는 검사 자체가 의미적 귀속의 정답을 보증하지는 않는다.

프롬프트 변경은 기존 신호 입력 해시와 요청 키에 영향을 준다. 기존 accepted 요청을 새 계약의 결과라고 간주하거나, terminal_invalid 기록을 초기화해 재호출하지 않는다. 회차요약의 생성 계약은 이번 변경 대상이 아니다.

`build_episode_character_signals_summaries`는 요청한 회차 묶음 전체가 검증되기 전 서비스용 신호를 활성화하지 않는다. 누락·잘못된 캐시·사용 불가 provider가 있으면 묶음이 불완전하게 남을 수 있다. 요청 중 예외는 호출자에게 전달되며, nonblocking wrapper도 모든 종류의 오류를 무시하는 함수가 아니다.

`tb_story_agent_character_asset_attempt`는 서비스 자산 트랜잭션과 분리된 요청 기록이다.

- `accepted`: 동일 요청 결과를 검증해 재사용한다. 서비스 트랜잭션 rollback 뒤에도 남는다.
- `terminal_invalid`: 같은 입력의 자동 재호출을 막는다.
- `inflight`: 전송 결과가 불명확한 경우도 포함한다. 시간 경과만으로 초기화하지 않는다.
- 요청 기록을 지우거나 입력 해시를 임의로 바꿔 재시도 한도를 우회하지 않는다.

### 06. 회차 간 인물 후보 집계

새 형식은 원문 귀속이 검증된 관측을 고정 ID로 모은다. 이름 군집 resolver와 이름 기반 scope reconciliation을 거치지 않는다. 서로 다른 registry 세대나 구형 신호가 섞인 집합은 차단한다. 구형 저장 신호를 해석하는 기존 이름·별칭 집계는 별도 호환 경로에 남아 있다.

LLM 신호 한 항목이 곧바로 최종 공개 캐릭터가 되는 것은 아니다.

### 07. 작품 전체 주인공 판정

새 registry에서는 최초 **공개 순서 1–3**의 원문 식별에서 역할을 판단한다. `build_work_protagonist_resolution_for_inventory_v3`는 registry 신호를 다시 이름 후보로 만들어 재투표하지 않는다. bootstrap 원문이 바뀌면 기존 ID를 자동 재발급하지 않고 검토 필요 상태로 중단한다.

현재는 최초 3공개 회차에 없던 인물을 supporting/unknown으로 추가할 수 있으나, 이후 주인공/주요인물로 자동 승격시키지 않는다. 최초 역할 판단이 미확정인 작품까지 해결한 것으로 해석하지 않는다. RP 생성 대상 상한 2명은 변경하지 않았다.

구형 신호만 있는 재집계에는 기존 초반/누적 판정이 남아 있다. 이 구형 분기와 새 registry 생성의 적용 여부를 혼동하지 않는다.

### 08. 통합 인물·관계·공개 적격성 구성

주인공 판정을 반영해 `character_inventory_v3`, 기존 호환 인물 목록, 관계 목록을 구성한다. 주인공/주요인물 역할, 회차별 근거, 이름 연속성과 모호성, 목소리 근거, 채팅·구좌 노출 가능 상태를 계산한다.

새 경로는 인물 키, 회차별 `grounding_v1`, 회차별 `identity_labels_v1`를 `character_contract`의 generation hash로 묶는다. 이것은 동일 자산 묶음인지 확인하는 계약이며 의미적 인물 판정의 정답 증명은 아니다.

관계 관측의 상대 ID·주장 여부·원문은 새 grounding에 보존한다. 다만 구형 `relation_edges` 태그 기반 별도 관계 인덱스는 새 관측에서 생성하지 않는다. 이를 관계 태그 자동 분류까지 완료한 것으로 해석하지 않는다.

### 09. 원문과 통합 인물 목록으로 장면 추출

`build_episode_scene_extraction_summaries`는 회차 원문과 canonical 인물 목록을 LLM에 전달한다. 장면 요지·등장인물·행동 주체·상황과 opening 재료를 수집한다.

registry 인물은 단순 표시 이름뿐 아니라 해당 회차까지의 식별 인용을 전달한다. 미래에 공개된 이름은 제거하고, 새 ID 세대 장면에 구형 이름 기반 participant를 보존 대상으로 강제하지 않는다.

신호가 인물 집계 재료라면 장면은 해당 인물이 어느 상황에서 무엇을 했는지 보여주는 재료다. 인물 키와 필수 보존 인물 등을 검증하고 `episode_scene_extraction`으로 저장한다. 이전 인물 키가 대체된 캐시는 그대로 재활성화하지 않도록 교체 검증이 있다.

### 10. RP 자산 구성: 새 경로와 기존 경로

| 항목 | 새 `character_contract` 경로 | 완전히 unmarked인 기존 자산 경로 |
| --- | --- | --- |
| profile | 인물 키·표시 이름·회차별 이름·계약을 코드로 조립 | 대사·요약·인물·관계 입력으로 LLM 프로필 생성 |
| examples | 검증된 회차별 grounding과 동일 계약 저장 | 원문 대사 수집 후 예시 선택·저장 |
| 대사 보강 | profile/dialogue 추가 LLM 호출 없이 조립 | 규칙 기반 대사가 부족하면 LLM 보완 가능 |
| 일관성 검사 | inventory/profile/examples의 계약 일치 필요 | 기존 자산 적격성·이름 연결·재사용 조건 적용 |

`upsert_grounded_rp_pair`가 새 경로의 두 자산을 만든다. 여기서 profile은 긴 성격 설명서가 아니다. examples라는 저장 이름에도 대사뿐 아니라 행동·상태 등의 근거가 들어간다.

`build_rp_summaries`와 delta에는 기존 자산 재사용·대사 보강·프로필 생성 경로가 남아 있다. inventory가 제공되지 않은 별도 호출에는 인물 계획 LLM fallback도 있지만, 확인한 주 배치 경로는 inventory를 전달한다.

주인공챗 새 경로는 예전 `character_chat_internal_prompt`와 정적 배치 `character_chat_opening_v1`을 필수 생성/소비 자산으로 쓰지 않는다. 다른 일반 RP 호환 경로와 혼동하지 않는다.

### 11. 자산 준비 상태 검사

인물 식별과 공개 판정, 정확한 인물 키, profile/examples 계약 일치, 공개 원문에 연결된 장면 회차 수 등을 확인한다. 잘못된 신호 위에서 만들어진 자산이 스키마만 맞는다는 이유로 실제 품질까지 검증된 것은 아니다.

회차요약 준비, 캐릭터 자산 준비, 공개 구좌 노출은 서로 다른 상태다. 기존 자산 보존·보강 보류·트랜잭션 rollback 여부도 실행 경로별로 구분해야 한다.

## 4. 공개 노출과 첫 대화: 단계 12–16

### 12. 카탈로그 계산과 스냅샷 발행

`refresh_public_character_catalog_snapshot.py`가 성인 구분별 후보를 계산한다. 이미지, 전체 준비 상태, 품질 분류, 주인공 역할, coverage, 등장·근거량 등을 정렬에 반영한다.

작품당 최대 2명이며, 주인공 1명과 주요인물 1명을 각각 반드시 배정하는 규칙은 아니다. AUTO 메인은 저장된 순위 상위 12개를 읽고 목록 페이지도 같은 카탈로그 스냅샷을 읽는다. 수동 구좌는 별도 경로다.

발행 실패 시 이전 generation을 유지한다. 배치 성공 뒤 자동 갱신과 정기 갱신은 설정/배포 조건에 따른다. 현재 실행 중인 cron이나 enable 값은 이 문서가 증명하지 않는다. 메인 요청이 전체 캐릭터 자산과 순위를 재계산하지는 않는다.

### 13. 카드·미리보기·읽은 회차 선택

메인, 캐릭터 목록, 작품 상세 등의 진입점에서 캐릭터와 회차를 선택한다. 미리보기 API는 `/v1/query/products/{product_id}/character-chat-preview`, 목록은 `/v1/query/products/character-chat-catalog`이다.

읽은 기록과 준비된 범위가 선택 UI에 반영된다. 미리보기와 세션 생성은 다른 API이므로 미리보기 성공은 세션 생성 성공의 증명이 아니다.

### 14. 세션 생성과 권한 재확인

프론트가 `product_id`, `locked_character_scope_key`, `session_kind=character_chat`, 읽은 회차, 진입 출처를 전달한다. 실제 화면은 `/websochat`이다.

`create_session`은 사용자/게스트, 성인 접근, 작품 상태, 서버가 허용하는 읽기 범위, 동기화 범위, 인물 키와 적격성을 확인한다. 주인공챗은 인물이 고정되고 허용 모드가 RP로 제한된다.

읽기 상한은 사용자 입력만 믿지 않는다. 무료·소유·유효 대여 등 서버 권한과 동기화 범위로 제한하며, 비연속 구매를 단순히 최댓값까지 허용하는 것으로 설명해서는 안 된다.

### 15. 읽은 범위의 진입 맥락 조립

`load_websochat_character_entry_context_v2`는 읽은 범위 안의 최근 요약 최대 2개와 선택 캐릭터 장면을 고른다. 선택한 읽기 상한 회차의 요약이 있어야 한다.

캐릭터 장면이 없으면 읽은 범위의 작품 장면을 사용하는 fallback이 있다. `read_scope_fallback`으로 표시하여 선택 인물이 원작의 그 장면에 있었다고 만들지 않도록 구분한다.

이 맥락과 RP 자산을 조립하지 못하면 `409 CHARACTER_CHAT_ENTRY_NOT_READY`로 세션 생성을 막는다.

### 16. 세션용 첫 장면 생성·저장

`generate_character_chat_adjacent_opening_with_gemini`가 읽은 범위·선택 인물·진입 맥락으로 첫 장면을 생성한다. 배치 opening의 단순 재사용이 아니다. 현재 호출자는 기본 모델 키를 전달한다.

원작 장면의 반복 재연 대신 해당 시점에서 파생된 곁가지 상황, 선택 캐릭터의 반응, 사용자의 참여 여지를 지시한다. 사용자 행동/정체와 원작 미래를 임의 확정하지 않도록 요구한다.

생성 후 `tb_story_agent_session`과 첫 `tb_story_agent_message`를 저장한다. 프론트는 세션과 메시지를 읽어 표시하며, 생성 응답이 불명확한 경우 기존 세션 확인을 거치는 복구 경로가 있다.

## 5. 매 턴 응답: 단계 17–22

### 17. 접근·잠금·중복·사용량 검사

`post_message`는 세션 소유권, 작품 상태, 고정 인물, 읽기 범위를 확인한다. 세션 및 사용자/게스트 잠금 획득 후 DB snapshot을 새로 열고 세션·작품·권한을 다시 읽는다.

동일 `client_message_id`가 이미 처리되었으면 저장된 응답을 재사용한다. 무료 한도와 유료 사용 필요 여부를 확인한다. 범위 설정만 하는 요청이나 이용 불가 안내는 일반 RP 생성과 다른 system/guard 경로다.

### 18. 캐릭터 맥락·최근 대화 로드

`_load_websochat_rp_context`는 인물 키를 해석하고 inventory/profile/examples를 읽으며 읽은 범위와 계약 일치를 확인한다.

주인공챗에서는 전체 범위의 `internal_prompt`, `personality_core`, `baseline_attitude`, inventory와 relation 목록을 그대로 프롬프트에 넣지 않는다. 새 계약에서는 읽은 범위의 이름과 근거를 사용하며 전역 speech style도 비운다. 기존 자산의 허용된 일부 말투 필드와 일반 웹소챗 RP의 호환 경로는 별개다.

| 자료 | 현재 제한/선택 |
| --- | --- |
| 새 grounding | 읽은 범위 내 최신순 최대 12개; 질문별 의미 검색으로 고르는 방식은 아님 |
| 진입 맥락 | 최근 요약 최대 2개 + 선택 장면 |
| 인물 궤적 | 기준 요약 1개(최대 600자) + 추가 요약 최대 2개(각 최대 400자) |
| 최근 대화 | 최근 최대 40개 메시지를 조회, 각 최대 2,000자; 제외 대상 메시지는 추가 필터 |
| RP 세션 메모 | 발언 앞부분 80자 단위, 최대 6항목 저장; 프롬프트의 최근 흐름 블록은 그중 최대 4항목 사용 |

따라서 공개 30개 회차의 모든 언행을 매 턴 모델에 넣는 구조가 아니다. 저장 자산의 양, 선택된 맥락의 양, 모델이 실제로 기억/활용하는 품질을 구분해야 한다.

### 19. 정확한 회상 필요 판정과 원문 검색

일반 RP 생성 경로는 `_resolve_websochat_rp_recall_need`를 LLM으로 호출한다. 정확한 대사/행동을 찾아야 하는지와 검색어를 결정한다.

필요하면 기준·과거 요약과 추가 검색 요약에서 회차 후보를 만들고 원문 청크를 읽는다. 후보에서 얻지 못하면 원문 검색 경로로 간다. 최대 4개 조각을 각 최대 500자로 넣는다. 누적 문자 제한 상수는 1,800이지만 추가 직전 검사이므로 마지막 조각 포함 후 최대 2,000자까지 될 수 있다.

불필요 판정이면 추가 원문은 넣지 않는다. 정확한 회상이 필요하다는 판정 자체가 검색 성공이나 정답을 보장하지 않는다.

### 20. 채팅용 시스템 프롬프트 조립

`build_websochat_rp_system_prompt`가 역할, 읽은 범위 진입점, 사용자 주도권, 원작/곁가지 사건 구분, 출력 형식, 장면 진행 규칙, 최근 흐름·반복 억제, 기준/과거 요약, 원문 검색 결과, 캐릭터 근거를 조립한다.

새 계약의 근거가 있으면 기존 예시 블록에 대사를 중복 삽입하지 않는다. 회차별 근거 JSON에 원문 인용과 종류를 넣되, 문자열 포함 검증이 화자 의미 확정은 아니라는 지시도 포함한다.

registry 자산은 `attribution_v1`의 실제 발화자·묘사 대상·주장 여부·연속 문맥도 함께 전달한다. opaque registry ID는 정확한 scope로만 조회하며 이름/별칭으로 다른 인물에 우회하지 않는다. 이름을 포함할 수 있는 legacy scope 문자열은 프롬프트에 추가하지 않는다.

실제로 실행되는 내부 프롬프트는 서버의 이 조립 결과다. 배치가 작성한 전역 `character_chat_internal_prompt`를 주인공챗이 매 턴 읽는 구조가 아니다.

### 21. 답변 LLM 호출

`generate_websochat_rp_reply_with_gemini`가 조립된 시스템 프롬프트 + 최근 대화 + 현재 사용자 메시지를 전달한다. 현재 로컬 speed/balance/deep 카탈로그는 Gemini와 동일 환경 모델 설정을 사용하고 thinking level 등이 다르다. 실제 운영 모델 ID는 환경 readback이 필요하다.

일반 RP 턴의 논리 호출은 회상 판정 1회 + 답변 생성 1회다. system 안내, 실패, 내부 재시도 등이 있으므로 전체 메시지 건수나 실제 HTTP 호출 건수와 같다고 계산하지 않는다. RP 맥락이 없으면 이용 불가 경로이며, 정상 Q&A로 몰래 전환해 성공으로 처리하는 경로가 아니다.

### 22. 저장·메모리 갱신·과금·출력

답변 정리 후 사용자/assistant 메시지, 이용 로그, 필요한 캐시 차감, 세션 상태를 저장한다. 읽기 권한을 다시 확인하여 범위와 응답 회차 참조를 제한한다.

`_update_websochat_session_memory_after_reply`의 RP 메모는 사용자와 캐릭터 발언 앞부분을 잘라 최근 6항목을 보관한다. 별도 LLM 장기기억 요약이나 회차별 완전 기억 저장기가 아니다.

유료 응답에는 스트리밍을 보류했다가 DB commit 후 내보내는 경로가 있다. 모든 응답이 commit 전까지 화면에 나오지 않는다고 일반화하지 않는다. 처리 종료 시 잠금을 해제하고 다음 턴이 같은 경로를 반복한다.

## 6. 저장소와 LLM 호출 위치 요약

| 저장소 | 역할 |
| --- | --- |
| `tb_product_episode` | 원본 회차와 공개 상태 |
| `tb_story_agent_context_doc` / `tb_story_agent_context_chunk` | 정규화 문서·원문 검색 조각 |
| `tb_story_agent_context_summary` | summary_type으로 회차/구간/작품 요약, signals, inventory, relation, scenes, RP 자산 구분 |
| `tb_story_agent_character_asset_attempt` | 서비스 자산 rollback과 분리된 LLM 요청 결과·중복 호출 방지 |
| `tb_public_character_catalog_generation` / `tb_public_character_catalog_snapshot` | 공개 카탈로그 generation·순위 payload |
| `tb_story_agent_session` / `tb_story_agent_message` | 세션 상태·메시지 |
| `tb_story_agent_usage_log` | 사용자 이용·모델 경로·캐시 과금 기록 |
| `tb_ai_provider_usage_call` | 별도의 provider 호출 수준 비용/사용량 기록; 사용자 캐시 과금과 다른 지표 |

| 논리 단계 | LLM 여부 |
| --- | --- |
| 원문 정규화·청크 구성 | 코드 |
| 회차요약 | 필요 시 LLM, 기존 재사용 별도 |
| 구간/작품 요약·기존 snapshot 구성 | 코드 |
| 회차별 신호 | LLM, 기존 캐시/accepted 요청 재사용 별도 |
| 인물 집계·주인공 판정 | 코드 중심, 특정 초반 충돌 조건에서 추가 LLM |
| 장면 추출 | LLM, 캐시·요청 재사용 별도 |
| 새 계약 RP pair | 코드 조립, 추가 profile/dialogue LLM 없음 |
| 기존 RP | 대사 LLM 보완 가능 + 필요 시 profile LLM |
| 공개 카탈로그 | 코드/DB |
| 세션 첫 장면 | LLM |
| 일반 RP 턴 | 회상 판정 LLM + 답변 LLM; 검색은 DB/코드 |
| 최근 RP 메모 갱신 | 문자열 절단·목록 유지, LLM 아님 |

## 7. 확인된 실패와 검증 경계

2026-09-07 shadow 기록에서 작품 1103의 신호 1화는 accepted, 2화는 `terminal_invalid`였다. 2화의 JSON은 파싱되지만 `mentioned_characters[0].evidence[0].quote`에서 원문 포함 검증에 실패했다. 다른 인용에는 떨어진 대사를 하나로 합친 변형도 있었다.

같은 응답에서 주인공의 직접 대사를 `narrated_action`으로 분류하고 `voice_mode=narration_only`로 반환한 의미적 오류가 확인됐다. 공백 불일치와 대사 합성은 구분해야 하며, 문자열 검증을 통과시키는 것만으로 이 의미 오류가 해결되지 않는다.

이 실행은 이후 주인공 판정·장면·RP·실제 채팅까지 도달하지 않았다. 이전 Oracle의 로컬 코드 계약 승인은 실작품 인물 정확도·채팅 기억·반응 일관성 또는 PROD 배포 승인이 아니었다.

검증 상태:

- 코드 readback: 이 문서의 함수·조건·선택 제한 확인.
- 실제 실패 응답: shadow에서 신호 추출/검증 실패 확인.
- 슬라이스 0–1 오프라인 재생: 같은 6,196자 원문과 기존 응답에서 공백 차이 인용은 복원되지만 합성 인용 `mentioned_characters[2].evidence[1].quote`는 계속 거부한다. 원시 응답은 불변이며 직접 대사의 의미적 오분류도 그대로 남는다. 새 추출 성공이 아니다.
- 슬라이스 0–1 검수 실패 모드: 첫 구현의 `finditer`는 겹치는 공백 변형 후보를 놓쳤다. 시작 위치를 한 글자씩 전진하는 검색으로 수정하고, 서로 다른 겹침 후보 거부·동일 후보 허용·서비스 쓰기 차단·terminal 요청 재호출 차단을 로컬 fake-provider 회귀로 검사한다. 실제 MySQL 검증이나 모델 품질 증거와는 구분한다.
- 슬라이스 0–1 실제 신호 1회 재추출: 같은 1103 작품 2화 원문·기존 요약, `deepseek/deepseek-v4-pro-0813`, max output 2600, reasoning none으로 실행했다. OpenRouter가 선택한 provider는 Together(이전 실패는 Alibaba)여서 provider까지 통제한 A/B는 아니다. 입력 6,582 / 출력 1,295 / reasoning 0 tokens, 비용 `$0.01381644`, 누적 원장 `$0.07095601198`, 미정산 0건이다.
- 새 응답은 1인칭 주인공 `나`, `동료 레이븐`, `노인`을 별개로 추출하고 주인공의 직접 대사를 `dialogue`로 반환했다. 11개 인용이 JSON·grounding 검증을 통과했다. 다만 동료 한 명의 `narration_names`에 집단 표현 `동행자들`이 섞였고 정규화 후에도 남는다. 이전에 오분류한 거절·이야기 수락 대사 두 개는 새 응답에 선택되지 않아 동일 대사의 의미 오류가 수정됐다고 주장할 수 없다. 한 회차의 부분 개선이며 전체 신호 품질 통과가 아니다.
- 쉐도우 DB 영속성 확인: 기존 accepted/terminal_invalid 요청 2개는 불변, 새 계약 요청 1개만 accepted 추가. 서비스용 summary는 전후 0건으로 유지했고 검증 후 잔류 쉐도우 연결 0건을 확인했다. 새 신호를 서비스 자산으로 활성화하거나 장면·RP·채팅을 실행하지 않았다. provider 사용량은 기존 로컬 비용 원장에 정산했으며 이번 단일 진단은 DB provider-usage 원장에 쓰지 않았다.
- 실작품 end-to-end 품질: 미검증.
- PROD 현행 상태와 환경: 이번 문서화에서 미검증.
- 플로우 역할 분리 제안: Astra Pro 자문을 받았으며, 집계 이후 변경과 실작품 품질 실증은 아직 적용·완료하지 않았다.

### 7.1 공개 30개 회차 실제 연결 검증 — 2026-09-07 후속

- 대상은 기존 shadow 원문/공개 ordinal 1–30의 작품 1103 한 작품이다. 무료 25개와 유료 공개 5개를 포함한다. 기존 실제 요약 30개를 동일 원문 hash로 확인해 재사용했고 요약 LLM은 다시 호출하지 않았다. PROD/DEV/ENV/서비스 코드는 변경하지 않았다.
- 실행 기록은 `/tmp/ln-character-shadow-20260907/continue-1103-events.jsonl`이다. 기존 `$3` 비용 원장과 실제 `ln_character_shadow_20260907` schema를 재사용했다. 기존 accepted/terminal_invalid 영수증 3개는 완전히 보존했다. 2화 accepted 응답은 재호출 없이 재사용했다.
- 30개 신호를 모두 처리해 24개를 실제 저장했고 6개는 실패로 격리했다. 10/13/14/18/22화는 `mentioned_characters[0].voice_mode`, 17화는 `mentioned_characters[2].evidence[1].quote` 검증 실패다. 특히 비주인공의 인용 실패가 회차 전체 신호와 주인공 근거까지 차단하는 결합을 확인했다. 실패 payload를 보정하거나 영수증을 reset하지 않았다.
- 실제 resolver는 첫 3화 역할 연속성을 근거로 `character:나(주인공)`을 high-confidence 주인공으로 확정했다. 그러나 화자의 관측은 `protagonist:generic` 13회차, `named:나` 2회차, `protagonist:named:레이븐` 9회차로 분리됐다. `character:레이븐`에는 추가로 20화 직업 일반 설명도 섞여 grounding 회차는 10개다. 이는 주인공 자산 일관성 성공이 아니다.
- 직업명 `레이븐`은 다른 동료·공격자도 공유하므로 같은 문자열을 일괄 병합하는 것은 금지한다. 현재 정규화가 실명이 없을 때 안전한 표시명을 `identity_name` 대용으로 쓰는 지점과, 회차 간 화자 관측이 별개 키로 남는 결과를 구분해 보아야 한다. 별도 레이븐 자산의 “나는 기수를 돌렸다”, 의족 정비·복귀를 설명하는 인용은 화자 근거지만 모든 레이븐 관측이 화자라는 뜻은 아니다.
- 실제 inventory 43개 중 RP profile/examples는 각각 2개가 저장됐다. 그 두 대상은 `character:나(주인공)`과 `character:레이븐`이며, 같은 화자의 분리된 자산이 생성 대상 두 자리를 차지했다. 장면 자산은 1–3화 3개를 저장했다.
- 실제 AsyncSession으로 shadow DB를 읽는 `load_websochat_character_entry_context_v2` → `_load_websochat_rp_context` 연결에서 3화 경계의 trajectory 요약 검색이 MySQL 1054 `Unknown column '0' in 'order clause'`로 실패했다. `_get_websochat_summary_candidates`의 검색어 없는 경로가 `score_sql="0"`을 `ORDER BY (0) DESC`에 넣는다. 프롬프트 조립·15/30화 경계·실제 채팅 응답은 이 오류 때문에 미검증이다. mock 결과로 우회하지 않았다.
- 런타임 실패를 확인하고 추가 생성 프로세스를 중단했다. 4화 장면 요청이 진행 중이었으므로 해당 영수증은 `inflight`, 비용 원장은 stop 및 미정산 예약액 `$0.07050405`를 유지한다. 확인된 누적 지출은 `$0.385858052636`이며 미정산을 0으로 처리하지 않았다. 자동 재개/재호출 금지다. 종료 후 해당 실행 프로세스와 잔류 shadow DB 연결 0개를 확인했다.
- 검증 도구 사전점검 실패 모드: 장면 프롬프트의 존재하지 않는 상수 참조를 발견해 실제 canonical 요청 생성 함수의 system message 참조로 수정한 뒤 유료 실행했다. 서비스 코드를 바꾸거나 검증 기준을 완화하지 않았다. 테스트 DB의 회차별 격리 commit은 진단용이며 PROD 배치 전체 transaction 성공 증거가 아니다.

### 7.2 인물 registry 구조 변경 — 현재 로컬 구현·검증

- 새 생산 경로: 첫 3공개 회차 registry → 최대 30공개 회차의 순차 관측 → 고정 ID inventory → grounded RP → 실제 채팅 grounding 프롬프트. 이름 기반 군집·scope reconciliation·주인공 재투표를 새 경로에서 사용하지 않는다.
- 기능 검증은 외부 모델 HTTP 응답을 합성 fixture로, 서비스 SQL을 SQLite 메모리 어댑터로, 독립 receipt DB를 외부 경계 fake로 대체했다. 추출·검증·SQL 저장/재조회·inventory/RP 조립·실제 runtime loader/renderer는 실행한다. MySQL dialect·제품 lock·실제 모델 의미 품질에 대해서는 **proxy check**다.
- 전체/증분 배치에서 bootstrap 거절 시 실패 원인이 저장되고 후단 신호·RP가 발행되지 않는 것을 검사했다. 두 번째 회차 거절 시 첫 회차만 발행되지 않음, DB 발행 실패 후 receipt 재사용, 기존 serving 자산 전환 차단·rollback 복원, 동일 번호 회차의 exact source 분리도 포함한다.
- 다른 사람의 발언·reported/hypothetical 주장을 본인의 확정 행동으로 바꾸지 않으며, 동일 대사 occurrence의 발화자 충돌은 양쪽 모두 격리한다. 이름 토큰이 없는 문장·`제`·3인칭 및 뒤 회차 이름 공개 경계를 검사했다. 합성 fixture의 정답 귀속을 실제 모델이 찾아냈다는 뜻은 아니다.
- 공개 31번째 요청은 호출 전 차단한다. 비공개·사용 중지 회차는 제외하고, 결번으로 플랫폼 130화가 공개 순서 30번째인 경우까지 실제 SQL 경계 테스트를 수행했다.
- 실패 모드: 기존 runtime은 0 이하 회차번호의 grounding/이름 근거를 거부한다. 새 producer가 이를 생성해 소비 단계에서 거절당하는 경우를 RED로 재현하고 `registry_nonpositive_episode_requires_contract_support` 사전 차단 후 GREEN을 확인했다. **0화 포함 작품 지원은 미완료**이며 공개 순서에 임의로 다른 회차를 끼워 넣지 않는다.
- 18개 관련 회귀 파일 최종 실행: **730 passed, 347 subtests passed**. 새 registry 전용 24개를 포함한다. `PYTHONDONTWRITEBYTECODE=1`로 기존 Poetry Python의 `pytest -q -p no:cacheprovider`를 실행했다. 원문/registry·비용·receipt·scene·readiness·identity review·scheduled scope·runtime grounded RP·entry·choices·권한·actor lock 경로를 포함한다. 전체 backend 테스트·실제 MySQL·실작품·브라우저 채팅·배포를 모두 수행했다는 뜻이 아니다. root/backend `git diff --check`도 통과했다.
- 이 환경에는 이전 `/tmp/ln-character-shadow-20260907` 원문/원장이 없고 Docker 명령은 WSL integration 불가를 반환한다. 새 쉐도우 서버를 만들거나 PROD를 테스트에 쓰지 않았다. 이번 구조 구현의 유료 모델 호출은 0회다.
- Oracle 기존 owner `20260907T002805Z-0d32ae43-0deb49`의 exact-session resume은 `ORACLE_RECOVERY_NOT_TERMINAL` / `attention_required`였다. 새 세션 생성·원래 run 폐기·새 prompt 제출은 하지 않았으며 현재 diff의 독립 검수 승인은 미완료다.
- 미커밋 로컬 변경이며 DEV/PROD·ENV·서비스 DB·기존 실패 영수증·다운로드 폴더는 이번 구조 구현에서 변경하지 않았다.

## 8. 코드 위치

아래 `B/`는 저장소 안의 `likenovel-service-api/likenovel-service-api/fastapi_be_server/`를 뜻한다. 행 번호 대신 함수명을 기준으로 재확인한다.

| 경로 | 주요 진입점 |
| --- | --- |
| `B/dist/batch/build_story_agent_context_batch.sh` | 대상 선정, 작업 모드, 예산·동시 실행·결과 처리, 설정상 카탈로그 갱신 |
| `B/scripts/build_story_agent_context.py` | `build_target_query`, `resolve_source_payload`, `insert_episode_summary`, `build_episode_character_signals_summaries`, `build_work_protagonist_resolution_for_inventory_v3`, `build_episode_scene_extraction_summaries`, `upsert_grounded_rp_pair`, `build_rp_summaries`, `build_rp_summaries_delta`, `build_character_chat_asset_readiness_verification`, `build_context_rows`, `build_context_rows_delta` |
| `B/scripts/character_asset_attempt.py` | `CharacterAssetAttemptStore` |
| `B/scripts/refresh_public_character_catalog_snapshot.py` | `refresh_public_character_catalog_snapshot` |
| `B/app/services/product/main_character_slot_service.py` | `get_public_main_character_slots`, `get_public_character_catalog`, `get_public_character_chat_preview`, `finalize_public_character_catalog_items` |
| `B/app/services/product/public_character_catalog_snapshot_service.py` | snapshot 읽기·발행 |
| `B/app/services/websochat/character_chat_product_policy.py` | 정책 상수, `select_character_chat_grounding_v1` |
| `B/app/services/websochat/websochat_service.py` | `create_session`, `post_message`, `_load_websochat_rp_context`, `_build_websochat_rp_trajectory_context`, `_build_websochat_rp_exact_recall_context`, `_generate_websochat_reply` |
| `B/app/services/websochat/websochat_context_loader.py` | `load_websochat_character_entry_context_v2` |
| `B/app/services/websochat/websochat_rp_renderer.py` | `generate_character_chat_adjacent_opening_with_gemini`, `build_websochat_rp_system_prompt`, `generate_websochat_rp_reply_with_gemini` |
| `B/app/services/websochat/websochat_game_memory.py` | `_update_websochat_session_memory_after_reply` |
| `B/app/services/websochat/websochat_model_catalog.py` | speed/balance/deep 모델·한도·추론 수준 |
| `B/app/routers/common/main_query.py`, `B/app/routers/websochat/` | 공개 목록/미리보기와 세션/메시지 API |
| `service/components/main/CharacterSlot.tsx`, `CharacterChatPreviewModal.tsx` | 메인 카드·미리보기 |
| `service/app/product/character-chat/page.tsx`, `service/components/productDetail/ProductDetailCharacterChatSection.tsx` | 목록·작품 상세 진입 |
| `service/utils/characterChatLaunch.ts`, `service/app/websochat/page.tsx`, `service/app/api/query/websochat/` | 고정 캐릭터 전달·세션 복구·메시지 표시 |

관련 인덱스: [AI And Websochat](wiki/ai-and-websochat.md). 이전 날짜의 PROD readback과 목표 설계는 역사 기록이며 현재 런타임으로 읽지 않는다.
