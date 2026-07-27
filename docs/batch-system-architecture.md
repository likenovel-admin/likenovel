# 배치 시스템 아키텍처

> Status: CURRENT GUIDE - VERIFY CRON RUNTIME FROM SOURCE AND SERVER READBACK
> Runtime path matrix lives in `docs/wiki/deployment-and-batch.md`.

기준일: 2026-06-03
코드 readback: 2026-06-03
코드 SSOT:
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/`

---

## 1) 목적

이 문서는 배치 구조를 "코드 기준"으로 고정해, 다음 사고를 방지하기 위한 운영 문서다.

1. 잘 동작 중인 기존 배치를 의도 없이 수정하는 사고
2. daily 체인 중복 실행을 버그로 오인해 구조를 임의 변경하는 사고
3. 어떤 배치가 어떤 데이터를 수집/집계하는지 해석이 엇갈리는 사고

---

## 2) 절대 규칙

1. 기존 배치(`.sh`, `.sql`)는 원칙적으로 수정 금지
2. 신규 요구는 신규 파일 추가로 대응(`새 .sh + 새 .sql + cron 1줄`)
3. 배치 구조 "정리"를 목적으로 한 리팩터링 금지
4. SSOT 우선순위는 문서가 아니라 실제 코드

### 2.1 AI 배치 격리 정책 (Do/Don't)

`Do`
1. AI 배치는 기존 배치와 별도 파일/별도 크론 주기로 운영
2. 기존 daily 체인과 시간대를 분리해 충돌 가능성을 낮춤
3. 장애 시 AI 배치만 독립 롤백 가능하도록 유지

`Don't`
1. `summary_daily_batch.sh` / `service_reset_daily_batch.sh` / `partner_report_daily_batch.sh`에 AI SQL 호출 추가 금지
2. 기존 배치 SQL 내부에 AI 집계 로직 삽입 금지
3. "통합이 더 깔끔해 보인다"는 이유만으로 체인 결합 금지

---

## 3) 런타임 실행 구조

### 3.1 환경별 cron 구성

| 환경 | cron 소스 | 배치 경로 | cron 파일 |
|------|-----------|-----------|-----------|
| 로컬 (Docker) | 컨테이너 내부 crontab | `/app/dist/batch/` | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh` |
| dev 서버 (ln-was) | `/etc/cron.d/likenovel-dev` | `/home/ln-admin/likenovel/batch-dev/` | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.dev.sh` |
| prod 서버 (ln-was) | 유저 crontab (`crontab -l`) | `/home/ln-admin/likenovel/batch/` | 수동 관리 |

- dev와 prod는 같은 서버(ln-was)이지만 cron 소스가 분리되어 서로 영향 없음
- `/etc/cron.d/` 파일은 각 줄에 유저명(`ln-admin`) 필요
- dev 배치 배포: CodeDeploy → `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`에서 active release `/home/ln-admin/likenovel/api-dev/batch` → `/home/ln-admin/likenovel/batch-dev/` 자동 동기화. `/etc/cron.d/likenovel-dev`는 자동 설치하지 않고 필요 시 수동 설치한다.

### 3.2 로컬 부팅 진입점

1. `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/start-cron.sh`가 cron daemon 시작
2. `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh`를 컨테이너 crontab에 등록
3. 각 시각에 `.sh`가 실행되고, `.sh`가 대응 `.sql` 실행

### 3.3 환경변수 주입

- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_env.sh`는 server runtime에서는 배치 디렉터리명으로 env 파일을 고른다.
  - `/home/ln-admin/likenovel/batch-dev` → `/home/ln-admin/likenovel/api-dev/.env`
  - `/home/ln-admin/likenovel/batch` → `/home/ln-admin/likenovel/api/.env`
- Docker/container에서 env 파일을 못 읽으면 `/proc/1/environ` fallback을 사용한다.
- alias fallback 지원:
  - `DB_HOST <- DB_IP`
  - `DB_USER <- DB_USER_ID`
  - `DB_PW <- DB_USER_PW`

---

## 4) 크론 스케줄 (코드 기준)

아래 표는 `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh`에 등록된 자동 실행 기준이다. 배치 파일이 존재해도
이 표에 없으면 현재 로컬 cron 기준 자동 실행으로 간주하지 않는다.

| 시각 | 스크립트 | 비고 |
|---|---|---|
| 매시 20분 | `ai_taste_hourly_batch.sh` | AI 취향 증분 집계 |
| 매시 30분 | `service_reset_hourly_batch.sh` | 예약공개/유료전환(안전망)/랭킹 |
| 매시 50분 | `summary_hourly_batch.sh` | 시간별 유입 + 기다무 재지급 |
| 매일 00:00 | `service_reset_daily_batch.sh` | 일일 리셋 + 내부에서 partner daily 호출 |
| 매일 00:20 | `summary_daily_batch.sh` | 일일 요약 + 내부에서 service_reset/partner daily 호출 |
| 매일 00:00 | `statistics_aggregation_daily_batch.sh` | 사이트/결제 통계 |
| 매일 01:30 | `ai_signal_daily_batch.sh` | AI 신호 일/주 롤업 + retention purge |
| 매일 01:35 | `ai_product_detail_funnel_daily_batch.sh` | 작품상세 퍼널 집계 |
| 매일 01:40 | `ai_engagement_metrics_daily_batch.sh` | AI engagement 지표 집계 |
| 매일 01:50 | `ai_product_episode_dropoff_daily_batch.sh` | 회차 이탈 지표 집계 |
| 매일 01:55 | `author_product_entry_daily_batch.sh` | 작가 작품 진입 일별 집계 |
| 매일 03:00 | `ai_dna_extract_daily_batch.sh` | AI DNA 추출 |
| 매일 01:45, 07:45, 13:45, 19:45 | `main_rule_slot_snapshot_batch.sh` | 메인 규칙 구좌 스냅샷 |
| 매분 | `episode_state_transition_minute_batch.sh` | 회차 상태 전환 |
| 매시 10분 | `build_story_agent_context_batch.sh` | websochat/story-agent 컨텍스트 수집 |
| 매주 월 00:00 | `service_reset_weekly_batch.sh` | 주간 리셋 |
| 매월 1일 00:00 | `partner_report_monthly_batch.sh` | 월 정산 |

---

## 5) 핵심 체인 (중요)

### 5.1 Daily 중복 체인 (의도된 운영 구조)

- `summary_daily_batch.sh` 실행 순서:
  1. `summary_daily_batch.sql`
  2. `service_reset_daily_batch.sql`
  3. `partner_report_daily_batch.sql`
- cron에서 `service_reset_daily_batch.sh`는 00:00에 먼저 실행:
  1. `service_reset_daily_batch.sql`
  2. `partner_report_daily_batch.sql`

즉, 하루 기준으로 보통 아래처럼 실행된다.

1. `summary_daily_batch.sql` 1회
2. `service_reset_daily_batch.sql` 2회
3. `partner_report_daily_batch.sql` 2회

현재 cron은 `service_reset_daily_batch.sh`를 00:00에 먼저 실행하고,
`summary_daily_batch.sh`를 00:20에 실행한다. 이 구조는
`DELETE/TRUNCATE + 재생성` 중심의 멱등 패턴과 함께 설계되어
재실행/복구 안전성을 우선한다.

### 5.2 월정산 의존 체인

1. `partner_report_daily_batch.sql`이 `tb_ptn_*_temp_summary`를 누적
2. `partner_report_monthly_batch.sql`이 해당 temp를 월간 집계 입력으로 사용

---

## 6) 배치 인벤토리 (파일별 상세)

| 배치 | 주기 | 입력(핵심) | 출력/변경(핵심) | 수집/집계 변수(핵심) | 멱등성 |
|---|---|---|---|---|---|
| `ai_taste_hourly_batch.sql` | hourly | `tb_user_ai_signal_event` | `tb_user_taste_factor_score` upsert, `tb_cms_batch_job_process.last_processed_date` | `factor_type`, `factor_key`, `signal_score`, `score(sum)`, `signal_count` | O (워터마크 증분 + job row lock) |
| `service_reset_hourly_batch.sql` | hourly | `tb_product`, `tb_product_episode`, `tb_cms_product_evaluation` | `tb_product_episode`, `tb_product` update, `tb_product_rank` 재생성 | 예약공개 시점, 유료전환 시점, 랭킹 점수 | O (랭킹 재계산) |
| `summary_hourly_batch.sql` | hourly | `tb_user_product_usage`, `tb_product_order*`, `tb_user`, `tb_applied_promotion` | `tb_hourly_inflow` insert, `tb_user_productbook` insert | 1시간 view/pay 성별/연령대 분해, waiting-for-free 24h 재지급 조건 | 부분 (시간단위 누적 insert) |
| `summary_daily_batch.sql` | daily | `tb_product_order*`, `tb_product_payment`, `tb_product_refund`, `tb_user_product_usage`, `tb_product*`, `tb_user` | `tb_batch_daily_sales_summary`, `tb_batch_daily_refund_summary`, `tb_batch_daily_product*_summary`, `tb_batch_daily_product*_info_summary`, `tb_product_trend_index.primary_reader_group`, 프로모션/대여권 상태 변경 | 매출/환불 item_type, current/previous 지표, reading_rate, writing_count_per_week, primary_reader_group(상위2 인구통계 JSON), interest sustain/loss | O (재작성 중심) |
| `service_reset_daily_batch.sql` | daily | `tb_quest_user`, `tb_quest`, `tb_batch_daily_product*_summary`, `tb_user_giftbook` | `tb_quest_user`, `tb_product_count_variance`, `tb_product_episode_count_variance`, `tb_user_giftbook` | 일일 퀘스트 초기화, 지표 차분(indicator), 선물함 만료 | O |
| `partner_report_daily_batch.sql` | daily | `tb_batch_daily_*_summary`, `tb_user`, `tb_product_trend_index`, `tb_cms_product_evaluation` | `tb_ptn_product_episode_sales`, `tb_ptn_ticket_usage`, `tb_ptn_sponsorship_recodes`, `tb_ptn_income_recodes`, `tb_ptn_product_statistics`, `tb_ptn_product_episode_statistics`, `tb_ptn_product_discovery_statistics`, `tb_ptn_*_temp_summary` | 회차매출/환불, 이용권 사용, 후원/기타수익, 발굴지표, 월정산용 temp 합산 | O/부분 (delete 후 재생성) |
| `statistics_aggregation_daily_batch.sql` | daily | `tb_site_statistics_log`, `tb_payment_statistics_log` | `tb_site_statistics`, `tb_payment_statistics`, `tb_payment_statistics_by_user` | 방문자, PV, login, DAU, MAU, 결제/코인사용/후원/광고 매출 | O (전일 delete 후 upsert) |
| `ai_signal_daily_batch.sql` | daily | `tb_user_ai_signal_event`, `tb_ai_signal_retention_policy` | `tb_user_ai_signal_event_daily`, `tb_user_ai_signal_event_weekly`, 오래된 원천이벤트 purge | `event_count`, `sum_active_seconds`, `avg_scroll_depth`, `avg_progress_ratio`, `latest_episode_reached_count`, `revisit_24h_count`, `retention_days` | O (upsert + 정책 purge) |
| `ai_product_detail_funnel_daily_batch.sql` | daily | 회원 AI 신호 + 게스트 page/viewer 원천 | `tb_product_detail_funnel_daily` | 작품상세 진입/전환 퍼널, guest 부분합, `metric_version` | O (대상일 staging 후 재작성) |
| `ai_engagement_metrics_daily_batch.sql` | daily | user/product engagement logs | `tb_product_engagement_metrics` | 빈지율/이탈/재방문/읽기속도 | O |
| `ai_product_episode_dropoff_daily_batch.sql` | daily | 회원 AI 신호 + 게스트 viewer 원천 | `tb_product_episode_dropoff_daily` | 회차별 이탈/다음화 흐름, guest 부분합, `metric_version` | O (대상일 staging 후 재작성) |
| `author_product_entry_daily_batch.sql` | daily | 작품상세 page view 원천 | `tb_author_product_entry_daily`, 오래된 `tb_site_reader_funnel_event` purge | 작가 작품 진입 통계, guest 부분합, `metric_version`, reader raw 120일 보관 | O |
| `main_rule_slot_snapshot_batch.sql` | 4/day | 메인 규칙 구좌 후보 | `tb_main_rule_slot_snapshot` | 구좌별 후보 스냅샷 | O |
| `ai_dna_extract_daily_batch.sh` | daily | 작품/회차/AI 메타 대상 | `tb_product_ai_metadata` 등 | AI DNA 추출/갱신 | 부분 |
| `episode_state_transition_minute_batch.sql` | minute | 회차 예약/상태 조건 | `tb_product_episode`, `tb_product` | 회차 상태 전환 | O |
| `build_story_agent_context_batch.sh` | hourly | 공개 회차/EPUB 원문 | `tb_story_agent_context_*` | websochat/story-agent 컨텍스트 | O (delta 기본) |
| `service_reset_weekly_batch.sql` | weekly | `tb_quest_user`, `tb_quest`, `tb_direct_promotion` | 동일 테이블 update | 주간 퀘스트(투표하기), `reader-of-prev` 상태 reset | O |
| `partner_report_monthly_batch.sql` | monthly | `tb_ptn_product_sales_temp_summary`, `tb_ptn_income_settlement_temp_summary`, `tb_common_code`, `tb_product_contract_offer` | `tb_ptn_product_sales`, `tb_ptn_product_settlement`, `tb_ptn_product_contract_offer_deduction`, `tb_ptn_income_settlement` | 월 매출/환불/수수료/정산율, 선계약금 차감, 최종정산 | O (월간 재집계) |
| `scheduled_open_batch.sql` | 매분 | `tb_product_episode`, `tb_product` | 회차 open_yn, 작품 open_yn, last_episode_date update | `publish_reserve_date` 기반 예약공개 | O (조건부 update) |
| `paid_episode_convert_batch.sql` | 매분 | `tb_product`, `tb_product_episode` | 두 테이블 update | `paid_open_date`, `paid_episode_no` 기반 유료전환 | O (조건부 update) |

---

## 7) 배치 상태/안전장치

### 7.1 공통 상태 추적

- `tb_cms_batch_job_process`
  - 시작 시: `completed_yn='N'`
  - 종료 시: `completed_yn='Y'`

### 7.2 AI 배치 전용

- `ai_taste_hourly_batch`:
  - `last_processed_date` 워터마크 사용
  - 동시실행 방어: `/tmp/ai-taste-hourly-batch.lock` + `tb_cms_batch_job_process` row lock

- `ai_signal_daily_batch`:
  - 동시실행 방어: `/tmp/ai-signal-daily-batch.lock`
  - `tb_cms_batch_job_process` 상태 갱신은 최신 row 1건(id)만 갱신
  - retention 정책 테이블 `tb_ai_signal_retention_policy`
  - purge는 쉘에서 5000건 청크 삭제
  - purge 성공 후에만 정책/상태 업데이트

### 7.3 작가 유입·이탈 audience v2

- 게스트 회차 이벤트는 추천 원장과 분리된 `tb_site_reader_funnel_event`에 저장한다.
- `audience_type_at_start`는 viewer의 `episode_start`를 기준으로 고정한다. 로그인 전환 뒤 도착한 exit/complete도 같은 start 세션에 귀속한다.
- v2 시작일은 클라이언트 `occurred_at`이 아니라 첫 게스트 start의 서버 수신일 다음 날이다. 이전 v1 구간은 guest/member 분할 불가인 `legacy_mixed`로 취급한다.
- v2 mart의 기존 count는 회원+게스트 전체, `guest_*`는 검산 가능한 부분합이다. 회원 부분합은 API에서 `전체 - guest`로만 파생한다.
- 세 mart는 target date staging 후 `DELETE → INSERT`하며, schema 105·106 전체 적용 확인 전에는 producer와 v2 batch를 열지 않는다.

### 7.4 수동 오케스트레이터

- `safe_batch_run.sh`는 local/운영 검증용 래퍼
- mode: `hourly|daily|weekly|monthly|all`
- 기본값은 AI soft-fail, 엄격 모드는 `--ai-strict`

### 7.5 AI 취향 점수 미처리 수동 재처리

- 자동 시간배치(`ai_taste_hourly_batch.sh`)와 별도로, 관리자가 미처리 이벤트 ID 범위만 수동 재반영할 수 있다.
- 스크립트: `ai_taste_manual_replay_batch.sh`
- SQL: `ai_taste_manual_replay_batch.sql`
- 특징:
  1. 크론 미등록(자동 실행 안 함)
  2. `--from-id`, `--to-id` 범위 지정 필수
  3. `--dry-run`으로 대상 건수 사전 확인 가능
  4. 동일/겹치는 범위가 이미 `SUCCESS`이면 기본 차단(`--allow-duplicate`로만 강제 가능)
  5. 실행 이력은 `tb_ai_taste_manual_replay_log`에 기록
  6. 자동 배치와 동일 DB 락(`lk_ai_taste_hourly_batch`) 사용으로 동시 반영 충돌 방지
  7. `tb_cms_batch_job_process.last_processed_date`는 변경하지 않음(수동 보정 전용)

---

## 8) 왜 "재작성"을 하는가

1. 재실행 안전성 확보: 장애 복구 시 같은 일자를 다시 돌려도 중복 누적 위험 최소화
2. 후행 정정 반영: 취소/환불/상태변경이 늦게 반영되는 케이스 대응
3. 운영 편의: 단일 스크립트 수동 실행으로 후속 집계까지 연계되도록 체인 구성

---

## 9) 변경 가이드 (사고 방지 프로토콜)

### 9.1 허용되는 변경

1. 신규 배치 파일 추가
2. 신규 cron 라인 추가
3. 신규 테이블/컬럼 추가 시 `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/NN-*.sql` + `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/models/` ORM 동기화

### 9.2 금지되는 변경

1. 기존 daily 체인 분리/정리 목적 수정
2. 기존 배치 파일 삭제/이름 변경
3. 기존 cron 라인 삭제/대체

### 9.3 신규 배치 추가 체크리스트

1. `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/`에 `new_batch.sh` + `new_batch.sql` 추가
2. `.sh`에 `set -euo pipefail`, `DB_USER/DB_PW` 검증
3. `.sql`에 `tb_cms_batch_job_process` 시작/완료 마킹
4. `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh`에 신규 라인만 추가(기존 라인 불변)
5. 기존 시간대와 충돌 여부 확인
6. 멱등성 확보(`upsert` 또는 `delete/truncate + insert`)

---

## 10) 운영 점검 포인트

1. Docker cron 등록 확인: container 내부 `crontab -l`
2. Dev cron 등록 확인: server `/etc/cron.d/likenovel-dev` 존재와 내용. 기본값은 자동 설치 안 함이다.
3. Prod cron 등록 확인: server `crontab -l`
4. Docker 로그 확인: `/app/logs/*_batch.log`
5. Dev/prod 로그 확인: `/home/ln-admin/likenovel/batch-dev/*_batch.log` 또는 `/home/ln-admin/likenovel/batch/*_batch.log`
6. 상태 확인: `tb_cms_batch_job_process.completed_yn`, `updated_date`
7. AI 배치 확인:
   - `tb_cms_batch_job_process.last_processed_date`
   - `tb_ai_signal_retention_policy.last_rollup_date/last_purge_before_date`
8. AI 미처리 수동 재처리:
   - `bash /app/dist/batch/ai_taste_manual_replay_batch.sh --from-id <id> --to-id <id> --dry-run`
   - `bash /app/dist/batch/ai_taste_manual_replay_batch.sh --from-id <id> --to-id <id>`
   - 동일/겹치는 범위 재실행이 필요하면: `bash /app/dist/batch/ai_taste_manual_replay_batch.sh --from-id <id> --to-id <id> --allow-duplicate`

---

## 11) 참고 파일

- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/start-cron.sh` — Docker 컨테이너 entrypoint (로컬)
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_env.sh` — 환경변수 로더
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh` — Docker(로컬) 전용 crontab
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.dev.sh` — dev 서버 전용 (`/etc/cron.d/likenovel-dev` 포맷)
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/*_batch.sh` / `*_batch.sql`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh` — dev CodeDeploy 후 active release `/home/ln-admin/likenovel/api-dev/batch`를 `/home/ln-admin/likenovel/batch-dev/`로 동기화. `/etc/cron.d/likenovel-dev`는 자동 설치하지 않음.

---

## 12) 예정 배치 메모 (미적용)

아래는 코드 반영 전 합의안 메모이며, 현재 크론/런타임에는 적용되지 않았다.

1. 배치명(가칭): `author_reader_taste_daily_batch.sh`
2. 목적: 작품별 독자 취향 7축 집계를 `tb_author_product_taste_snapshot`에 일 1회 스냅샷 저장
3. 집계 기준:
- 기간: 최근 30일
- 대상 독자: 작품별 3화 이상 열람 유저(1화 이탈 제외)
4. 출력: 작품별 `qualified_reader_count` + 축별 top tag/ratio JSON
5. 운영 원칙:
- 기존 배치 수정 금지(신규 파일 + 신규 크론 1줄 방식)
- 최소 모수 미달 작품은 `데이터 부족` 상태로 스냅샷 저장
