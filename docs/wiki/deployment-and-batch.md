# Deployment And Batch

> Status: CURRENT GUIDE
> Last verified: 2026-07-25
> Code readback: 2026-07-25
> Rule: do not execute deploy, DB, cron, or batch operations from this summary.
> Open the linked runbook/source files and read back the live target first.

## Execution SSOT

- Agent hard rules: `AGENTS.md`
- Main runbook: `docs/deployment-runbook.md`
- Backend deploy skill: `/home/hongsan/.codex/skills/likenovel-backend-deploy/SKILL.md`
- Backend prod verification script: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/verify_backend_prod_deploy.sh`
- Prod monitor: `ops/monitor-prod/README.md`

Code-readback anchors checked on 2026-07-25:

- Dev backend workflow copies source `run_be.dev.sh` to package `run_be.sh`, waits for CodeDeploy success, then runs `verify_backend_dev_deploy.sh` against the exact deployment ID: `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`
- Dev web compose files currently share Compose project name `docker`; never use `--remove-orphans` across their sequential deploys: `.github/workflows/docker-dev.yml`
- Prod backend workflow packages `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`, `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/verify_backend_prod_deploy.sh`, `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/`, and `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/`, then runs on-host verification: `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml`
- Dev deploy script syncs batch files to `/home/ln-admin/likenovel/batch-dev` and leaves `/etc/cron.d/likenovel-dev` manual: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`
- Prod deploy script syncs batch files to `/home/ln-admin/likenovel/batch` and only guards selected user crontab lines: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`
- DB URL is built only from backend env `DB_USER_ID`, `DB_USER_PW`, `DB_IP`, `DB_PORT`: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/const.py`
- Local Docker MySQL host port is `3806:3306`: `likenovel-service-api/likenovel-service-api/fastapi_be_server/docker-compose.yml`

`DEPLOYMENT.md` is frontend Docker/staging background only. `likenovel-service-api/likenovel-service-api/CLAUDE.md`
is legacy and must not be used as an execution runbook.

## Deployment Split

| Area | Dev | Prod | Common mistake |
|---|---|---|---|
| Frontend trigger | root repo `dev` push, `.github/workflows/docker-dev.yml` | root repo `prod` push, `.github/workflows/docker-prod.yml` | Treating frontend push as backend deploy |
| Backend trigger | backend submodule repo `dev` push, `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml` | backend submodule repo `prod` push, `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml` | Pushing only root repo and expecting backend CodeDeploy |
| Backend deploy script | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh` | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh` | Using prod assumptions on dev release layout |
| Runtime service | systemd unit: `likenovel-api-dev.service` | systemd unit: `likenovel-api.service` | Calling deployment complete before systemd/pid readback |
| Runtime API path | absolute server path: `/home/ln-admin/likenovel/api-dev` symlink to `/home/ln-admin/likenovel/releases/api-dev/<release>` | absolute server path: `/home/ln-admin/likenovel/api` | Looking at the package path instead of the active runtime path |
| Runtime batch path | absolute server path: `/home/ln-admin/likenovel/batch-dev` | absolute server path: `/home/ln-admin/likenovel/batch` | Running repo source path `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/` directly on the server |

Backend dev completion requires the workflow's CodeDeploy wait plus:

- active `/home/ln-admin/likenovel/api-dev` release suffix matching the deployment ID
- `likenovel-api-dev.service` active/running
- systemd MainPID and `gunicorn.pid` matching and live
- `10.0.100.110:3011` listener
- internal and public `/health`

Backend prod completion requires readback beyond Actions/CodeDeploy success:

- systemd owner state
- gunicorn PID and start time
- `10.0.100.110:3010` listener
- `/health`
- route/openapi exposure if a route changed
- migration records and `information_schema` if schema changed
- AI reader worker fresh cycle when backend prod deploy is involved
- prod monitor quick check

AI reader lock 복구와 배포 직후 fresh-log 판정의 실행 기준은
`docs/deployment-runbook.md` 6.2를 따른다. daemon은 MySQL `1205`/`1213`만
재시도하며 `--once`와 다른 DB 오류는 실패를 유지한다.

Root and backend `dev`/`prod` branches are independent deployment ledgers. Backend
completion is proved by the backend target ref and runtime hard gate; a
backend-only deploy must not create a root gitlink alignment commit. The prod
workflow keeps `poetry version patch` ephemeral and does not commit or push it.

## DB Channels

| Channel | Use | Path/source | Do not confuse with |
|---|---|---|---|
| Local Docker MySQL | isolated local backend container DB | `likenovel-service-api/likenovel-service-api/fastapi_be_server/docker-compose.yml`, host port `localhost:3806`, in-container host `mysql:3306` | default LikeNovel local verification channel |
| Local-to-dev RDS tunnel | normal local backend/batch verification unless user says otherwise | `host.docker.internal:13306` via SSH tunnel to dev RDS, documented in `docs/deployment-runbook.md` | local Docker MySQL `3806` |
| Dev API DB | staging backend runtime | `DB_IP=<dev-rds-endpoint>`, `DB_PORT=3306` from runtime env | prod RDS or file-only `.env.dev` assumptions |
| Prod API DB | production backend runtime | `DB_IP=<prod-rds-endpoint>`, `DB_PORT=3306` from runtime env | dev RDS or public docs guesses |

Backend DB URL construction is in `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/const.py`.
The engine is in `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/rdb.py`.
Frontend apps do not connect to DB directly.

For local backend/batch checks, root `AGENTS.md` treats `host.docker.internal:13306`
as the default dev RDS tunnel channel. Switching to Docker MySQL `3806` needs an
explicit user decision.

## Batch And Cron Paths

| Context | Source/template | Runtime path | Cron owner/activation |
|---|---|---|---|
| Repo source | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/` | not a server runtime path | source files only |
| Docker/container cron | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh` | absolute container path: `/app/dist/batch/*.sh`, logs `/app/logs/*.log` | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/start-cron.sh` installs `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh` into container crontab |
| Dev server cron | `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.dev.sh` | absolute server path: `/home/ln-admin/likenovel/batch-dev/*.sh`, logs beside scripts | `/etc/cron.d/likenovel-dev`, user `ln-admin`, not auto-installed by `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh` |
| Prod server cron | prod `crontab -l` plus `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh` guard lines | absolute server path: `/home/ln-admin/likenovel/batch/*.sh`, logs beside scripts | user crontab, must be read back with `crontab -l` |

`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`
copies deployed batch files from the active dev release to
`/home/ln-admin/likenovel/batch-dev` and intentionally leaves dev cron disabled
unless manually installed.

`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`
copies deployed batch files from `/home/ln-admin/likenovel/api/batch` to
`/home/ln-admin/likenovel/batch`, then ensures selected prod cron lines only when
needed. It does not prove the whole crontab is correct. Always read back
`crontab -l` before and after cron-affecting deploys.

`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_env.sh`
selects env by runtime directory:

- `batch-dev` loads absolute server path: `/home/ln-admin/likenovel/api-dev/.env`
- `batch` loads absolute server path: `/home/ln-admin/likenovel/api/.env`
- Docker fallback reads `/proc/1/environ`

## Batch Safety Notes

- 웹소챗과 storyctx의 실제 모델 요청 비용은 append-only
  `tb_ai_provider_usage_call`(`109-create-ai-provider-usage-call.sql`)에 물리 호출별로
  기록한다. 기존 `tb_story_agent_usage_log` 등 기능 로그는 사용자 요청/차감 단위이므로
  이 원장의 호출 건수나 비용과 합산하지 않는다.
- 원장은 `feature_key`, `stage_key`, provider, 요청/응답 모델, operation 내
  `attempt_no`, terminal status, 토큰, 비용 출처를 저장한다. 프롬프트·응답 원문,
  user/guest 식별자는 저장하지 않는다. OpenRouter 반환 비용은
  `provider_reported`, 검증된 직접 Provider 요율은 `rate_card`, 나머지는 NULL
  `unavailable`로 구분하며 명시적인 0원은 알려진 0원으로 유지한다.
- 웹소챗은 본 요청과 별도 async transaction을, storyctx는 작품 transaction과
  분리된 배치 수명 PyMySQL connection을 사용한다. 계측 저장 실패는 모델 호출이나
  작품 transaction을 실패시키지 않으며 `ai_provider_usage persist_failed` 또는
  `connection_failed` 구조화 로그로 감시한다.
- CMS `/statistics/ai-api-usage`의 `Provider 물리 호출 원장`은 한국 시간 날짜 범위로
  조회한다. 기존 기능 로그 합계와 별도 surface이며, retry/fallback은 같은
  `operation_id`의 증가하는 `attempt_no`로 표시한다.

- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/ai_dna_extract_daily_batch.sh`
  is enabled in container `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh`
  but commented out in dev server
  `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.dev.sh`.
- AI DNA uses `/home/ln-admin/likenovel/api/.venv/bin/python` in prod and
  `/home/ln-admin/likenovel/api-dev/.venv/bin/python` in dev so deployed `app`
  modules are importable. The system Python fallback is only for the container
  layout where that API virtualenv path does not exist.
- AI DNA 배치와 관리자 재분석은 `open_yn='Y' AND use_yn='Y'`인 공개 회차를
  `episode_no`, `episode_id` 순으로 판단한다. 공개 회차가 3개 이상이고 첫 공개
  회차 본문이 500자 이상일 때만 수집하며, 공개 회차가 없으면 수집하지 않는다.
  갱신 기준도 회차 번호 10이 아니라 같은 정렬의 열 번째 공개 회차다. 관리자
  재분석 결과의 AI 사서 intro·points·chips는 DNA와 함께 저장한다. 자동 배치는
  `--force`/`--product-id`를 포함해 AI 콘텐츠 동의가 켜진 작품만 고르며, 관리자가
  지정한 exact 작품 재분석은 이 자동 후보 조건과 분리한다.
- 배치와 관리자 재분석은 7축 라벨·confidence·라벨별 score의 완전성과 1:1 일치,
  허용 라벨, 유한한 0~1 confidence를 저장 전에 검사한다. 핵심 DNA 계약 위반은
  success로 저장하지 않는다. AI 사서 카피만 품질 검사를 통과하지 못하면 분석
  전체를 재호출하지 않고 intro·points·chips 세 필드를 함께 `NULL` fallback한다.
  특수 문자 표기는 모델에 실제 전달된 제목·장르·태그·줄거리 앞 1,000자·회차
  본문에 같은 토큰이 있을 때만 허용한다.
- 추천 계산은 `overall_confidence`가 없거나 유효한 0~1 숫자가 아니면 해당 DNA를
  제외한다. `axis_label_scores`가 존재하는 row는 축별 명시 점수 0.55 이상인 라벨만
  사용하고 누락·비정상·낮은 점수를 overall confidence로 보충하지 않는다. 점수
  구조가 없거나 빈 legacy row만 기존 confidence fallback을 사용한다.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/episode_state_transition_minute_batch.sh`
  needs `EPISODE_STATE_TRANSITION_BATCH_ENABLE=1` in cron.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/free_episode_campaign_expire_batch.sh`
  expires active `tb_product_free_episode_campaign` rows every 5 minutes and restores
  product free episode ranges to the row's restore range, currently 1~25.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/ai_taste_hourly_batch.sh`
  runs a bounded missing-factor backfill before aggregating
  `tb_user_ai_signal_event_factor` into `tb_user_taste_factor_score`; inspect the
  backfill and aggregation log lines together when AI taste slots look stale.
- The same minute batch rechecks only products released in its current run. If
  a free, public, non-blind product reaches at least 5 public episodes and
  20,000 public characters, it promotes the product to normal serialization
  and inserts one author notification in the release transaction.
- Story context prod cron has live-state history and source fallback differences.
  Do not infer current max parallel from one file; verify active `crontab -l` and
  then compare with `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`.
- Story context delta cron automatically reaggregates character/relation inventory
  from existing active character signals when signal coverage advances or inventory
  v1/v3 is missing. Reaggregation itself has no provider call, preserves LKG/RP
  assets, and rolls back per product on failure; it does not replace missing signal
  generation.
- Apply operator-authored identity corrections only through
  `scripts/apply_story_agent_identity_review.py`: run without `--apply` first, verify
  the preview, then apply the same active-signal-pinned request. A reviewed target may
  bridge legacy RP without a provider call only when the reviewed display matches the
  legacy profile identity, both RP assets belong to the same legacy key, and example
  episode evidence is present or recovered by a unique exact-text match. Otherwise
  keep the existing LKG and report no progress.
- A reviewed identity whose observations split across clusters, or whose separate
  reviews converge into one cluster, exits as `review_required` (code `76`) instead
  of `failed`; the batch must quarantine it from identity-dependent work rather than
  repeatedly prioritizing it as a failed candidate. For `merge_active_scopes`,
  `blocked_aliases` may be source-backed by any reviewed member scope while the
  canonical display remains source-backed by the target scope.
- Character-asset readiness is observability/consumer-gate state, not a reason to
  rewrite product `context_status` to `failed`. Incomplete characters stay hidden by
  the exact-key readiness gate while the story context remains available.
- `character_rp_profile` readiness requires a non-empty exact `character_key`,
  `personality_core`, and all three speech fields: `tone`, `formality`, and
  `sentence_length`. Public catalog, preview, chat runtime, and story-context repair
  use this same fail-closed contract.
- A paid manual character repair can be bounded with repeated
  `--character-scope-key` values. This option is valid only with
  `--build-mode delta --apply --repair-character-assets`; it intersects both scene
  and RP repair scopes and does not broaden the selected `--product-id` set. Add
  `--refresh-rp` only when an already-ready exact scope must be regenerated from
  source evidence; the run rolls back if the scope is absent or makes no RP progress.
  For an exact requested scope below the public five-scene floor, scene repair counts
  only public free episodes, excludes already usable public-free scene episodes, and
  selects only enough eligible evidence episodes to reach five, still bounded by
  `--max-delta-episodes`. An explicit scope may bypass only the legacy collection-date
  cohort; consent, public/non-blind product state, and active-scope checks still apply.
  Unscoped scheduled/regular repair continues to exclude legacy-cohort works, and
  scheduled delta batches do not enable the forced RP refresh path.
- `--max-delta-episodes 0` means unlimited, not zero work. For a manual no-provider
  reaggregation check, follow the dry-run `plans=0` gate and fingerprint verification
  in `docs/deployment-runbook.md`; do not treat this option as a cost guard.
- Deep monitoring warns only for foundation mismatches inside the active collector
  policy. Mismatches outside the cohort/grandfather/AI-consent policy remain visible
  as an informational count.
- Story context credit priority is enforced per OpenRouter request. DNA and AI
  reader/core recommendation work use the base reserve; chat assets below the
  `min(public episodes, 50)` target leave an additional `$1` headroom, while
  assets beyond that target leave `$2`.
- Candidate order is recent seven-day `websochat_asset_request` whose requested
  episode is still unprepared, then titles below the 50-episode target with
  fewer prepared assets first, then titles that already met the target. The
  target uses the first 50 public episodes by ordered rank, not
  `episode_no <= 50`. A request event is demand metadata only, must pass
  server-side pending/consent checks, is deduplicated per user/product/episode
  for seven days, and must not become an AI taste factor.
- `tb_story_agent_context_product.ready_episode_count` is maintained as the
  latest contiguous prepared public episode number, not a raw summary-row count.
- Websochat foundation selection includes every open, ongoing, AI-consented
  title. Character scene/RP expansion remains guarded by the existing
  character-chat cohort policy.
- Story context exit code `75` means `deferred_budget`. Preflight and mid-run
  reserve exhaustion both propagate to that result. The batch wrapper reports it
  as `deferred`, not `failed`; non-reserve provider and processing errors keep
  their existing failure/no-progress semantics. Existing active chat assets stay
  readable.
- Batch docs must be refreshed whenever cron timing, lock behavior, max parallel,
  cost gates, runtime paths, or output tables change.

## Batch Log Triage

Batch status is not proven by a single `grep ERROR` count or an old accumulated
log. Check freshness and relative order:

1. Confirm the target runtime path first:
   - Docker: `/app/logs/*.log`
   - Dev server: `/home/ln-admin/likenovel/batch-dev/*.log`
   - Prod server: `/home/ln-admin/likenovel/batch/*.log`
2. For each relevant log, compare the last error line and the last success line.
3. Search for lock and database contention markers:
   - `ERROR`
   - `Traceback`
   - `1205`
   - `timeout`
   - `deadlock`
   - `lock wait`
4. Treat a later success marker as recovery evidence only when it belongs to the
same batch/run window. Do not use stale historical success to override a fresh
error.
5. If processlist shows a batch query active for 60 seconds or more, report it
as active/risky, not normal.

Current batch sources use `completed`, `DONE`, `RELEASE_LOCK`, `completed_yn`,
`[ERROR]`, advisory locks, and MySQL `GET_LOCK`/`RELEASE_LOCK` patterns. Read
the specific script/SQL before interpreting a log.
The deep story-context monitor extracts `ready` and `failed` by field label, so
terminal lines may include `review_required` or `deferred` between them. A latest
run without a matching terminal line remains `UNKNOWN`.
