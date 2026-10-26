# AI 모델 관리와 선충전 계정 라우팅

상태: 구현 계약. 현재 적용값은 CMS·DB·런타임 readback을 기준으로 확인한다.

## 관리자 동작

CMS `/ai-models`의 **AI 모델 관리**에서 기능별 현재 모델과 결제 경로를 확인한다.
OpenRouter 형식의 모델 ID와 OpenRouter/Hive/River 경로를 입력하고 적용하면,
서버가 모델 존재·필수 출력 형식·계정별 모델 접근을 확인한 뒤 revision을 저장한다.
다른 화면에서 먼저 변경한 revision은 409로 거절하며 편집 입력은 보존한다.
모델 metadata 검증은 실제 작품 품질이나 JSON 무실패를 보증하지 않는다.

API는 `/v1/query/admins/ai-models`, `/v1/command/admins/ai-models/validate`,
`PUT /v1/command/admins/ai-models/{feature_key}`이며 모두 서버 관리자 권한을 검사한다.
모델 설정과 변경 이력은 migration 117의 두 테이블에 저장한다. API 키는 저장하지 않는다.

## 적용 경계

- 웹소챗/캐릭터챗: 세션 생성, 선택지 생성, 메시지 한 턴의 시작에 설정을 고정한다.
- AI 사서: 도구 반복과 최종 답변을 포함한 한 대화 요청에 고정한다.
- AI 독자: 판단 예약·호출·기록에 같은 snapshot을 사용한다. 기존 pending 판단은
  `recovery_required`로 중단하며 새 모델로 다시 제출하지 않는다.
- DNA: 작품 분석 시작에 고정하며 같은 작품의 검증 재시도는 같은 설정을 사용한다.
- storyctx: CLI 실행 전체를 한 작업으로 본다. 정기 배치의 작품별 child가 다음 작업 경계다.
- MCP 소개 문구: 생성 작업에 snapshot을 저장하고 스레드·검증 재시도에서 재사용한다.

snapshot에는 모델·route·revision만 포함하고 키는 넣지 않는다. 전역 settings를
실행 중에 덮어쓰지 않는다. 이미 시작한 작업은 설정 변경으로 교체되지 않는다.

## 초기 모델 정책

- 웹소챗·캐릭터챗의 기존 모델과 등급별 과금 정책은 유지한다.
- 기존 V4 Pro의 두 배포 ID는 기본값 경계에서
  `deepseek/deepseek-v4.1-flash-1017`로 전환한다. CMS에 명시 저장한 값이 우선한다.
- AI 사서 일반 답변과 AI 독자 판단은 Flash 1017/Hive를 기본으로 사용한다.
- 사서 도구 판단은 Flash 1017/OpenRouter를 사용한다.
- 초기 운영 배정은 DNA 분석·인물 신호·장면 추출을 Flash 1017/River로 CMS에 저장한다.
  catalog의 예비 기본값보다 저장된 설정이 우선하며, 이후 운영자가 항목별로 변경할 수 있다.
- 회차 요약, 추천 전용 경로, RP 등의 다른 기존 모델은 기본값을 유지하며 CMS에서 변경한다.
- 신호의 기존 Anthropic 우선 설정은 모델과 API 키가 함께 있을 때만 유지한다.
  CMS override가 있으면 그 설정을 따른다.

신호 source hash에는 생성 모델이 포함된다. 모델 변경이 전체 작품을 자동 재선정하지는
않지만, 이후 선택된 repair/full 작업에서는 기존 신호 재추출이 발생할 수 있다.
모델 전환을 이유로 전체 재수집하거나 기존 receipt를 초기화하지 않는다.

## Hive/River 계정과 폴백

운영 서버의 비밀 파일 경로를 `AI_PROVIDER_ACCOUNTS_FILE`로 지정한다.
JSON 구조는 provider별 `{id, api_key}` 배열이며 파일 권한은 `600`이다.
WSL OpenCodex 설정을 운영 서버에서 직접 읽거나 WSL 프록시에 의존하지 않는다.
CMS에는 연결된 계정 수만 제공한다. 키·키 일부·원본 인증 오류는 노출하지 않는다.

검증된 Flash ID 매핑:

| 경로 | 실제 모델 ID |
| --- | --- |
| OpenRouter | `deepseek/deepseek-v4.1-flash-1017` |
| Hive | `deepseek-ai/deepseek-v4.1-flash-1017` |
| River | `deepseek-ai/DeepSeek-V4.1-Flash-1017` |

선택한 provider의 계정을 유한하게 순회하며, **확인된 크레딧 부족**일 때만 다음 계정과
동일 모델의 OpenRouter로 폴백한다. 계정 파일 누락, 미검증 모델 매핑, 일반 인증 오류,
429/5xx, 타임아웃, JSON 오류, 부분 스트림은 크레딧 소진으로 간주하지 않는다.
OpenRouter의 reserve 검사는 OpenRouter 요청에만 적용한다.

2026-10-26 Hive Flash 합성 검사에서는 JSON object·strict schema·중첩 schema가
형식과 충돌하는 입력에도 통과했다. 강제 tool choice는 일반 문장을 반환하여 실패했다.
따라서 Hive Flash의 JSON 기능은 허용하고 tools가 필수인 기능은 차단한다.
긴 실제 출력의 품질은 별도 검증 대상이며 기존 파서·스키마·원문 근거 검증을 유지한다.
River Flash도 2026-10-26 합성 실호출 3회에서 JSON object·strict schema·중첩 schema가
통과했다. River의 도구 호출은 공식 문서 근거이며 실제 추론 검증과 구분한다.

## 재시작과 검증 한계

storyctx의 `before_submit` callback은 reserve 후 첫 제출 직전에 receipt를 한 번 claim한다.
migration 118의 nullable generated UNIQUE는 같은 작품·단계·scope의 기존 inflight를
다른 모델/input hash로 우회하는 것을 막는다. accepted/terminal_invalid 기록은 보존한다.

DNA의 포착된 전송 불명 오류는 `provider_submission_unknown:`로 표시한다.
다음 cron, `--force`, CMS 재분석은 이 표시를 자동 해제하지 않으며 기존 성공 분석값을
보존한다. 단, 프로세스가 이 표시를 저장하기 전에 강제 종료되는 구간까지 중복 호출을
완전히 방지한다는 보장은 하지 않는다.

운영 반영 전에는 기존 inflight 중복 scope, migration 117/118의 실제 구조와 UNIQUE,
두 연결의 설정 CAS/claim 경합, 계정 파일 설치, 런타임 모델·route readback을 확인한다.
118의 STORED column DDL은 테이블 재구성과 metadata lock이 발생할 수 있다.
실패 시 receipt를 삭제하지 말고 코드 반영을 중단한다. DDL은 일반 트랜잭션 rollback으로
복구되지 않으므로 additive schema를 유지하고 검증된 이전 코드로 되돌리는 것을 우선한다.

2026-10-26 DEV RDS의 격리된 임시 스키마에서 111/117/118을 각각 두 번 적용했다.
실제 두 AsyncSession의 최초 저장·수정 경합에서 각각 한 요청만 성공하고 나머지는
409로 거절되었으며, 변경 이력은 성공한 2건만 저장되었다. 이전 snapshot 유지와
별도 두 연결의 모델 변경 후 inflight 중복 차단, accepted 기록 보존도 통과했다.
임시 스키마는 검사 후 삭제했다. 이 격리 검사만으로 운영 DB와 CMS 검증을 대체하지 않는다.

2026-10-26 운영 적용에서는 117/118 구조와 UNIQUE, backend 런타임, CMS 로그인·사이드바·
세 항목 River 저장·새로고침 후 유지와 실제 설정 로더를 확인했다. dev 웹 배포는 DB의
`stopped` 대기와 자동 재기동의 경합 때문에, 이미 빌드된 정확한 SHA 이미지로 런북의
Compose 배포·digest·내부/공개 health 검증을 수행한 workaround다. prod Actions는 통과했다.
같은 날 19:15 작품 1275의 장면 추출 2건은 JSON 문법이 아닌 필수 인물 누락으로 거절됐다.
이 작업은 River 설정 저장 전에 OpenRouter/Flash로 시작했다. receipt를 초기화하거나
내용 검증을 완화하지 않았으며, 모델 변경이 긴 실제 작품의 내용 정확성을 보장하지는 않는다.

확인된 실패 모드: 세미콜론으로 SQL을 분할하는 로더는 주석 안 세미콜론도 분리한다.
118의 해당 주석을 수정한 뒤 동일한 실제 MySQL 검사를 재실행해 통과했다.
이 경로의 SQL을 변경할 때에는 주석 구두점도 분할 실행 관점에서 확인한다.

## 회상 발췌

정확 회상 문맥은 매치 주변 발췌당 최대 1,200자, 최대 4개, 본문 합계 최대 4,800자다.
회차 끝부분 매치를 발췌 후 500자로 다시 잘라 잃지 않으며 독자 읽기 범위는 유지한다.
