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

Prod backend workflow can create an automatic version bump commit. Root submodule
pointer alignment must use that latest backend prod SHA, not an older dev bridge
SHA.

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

- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/ai_dna_extract_daily_batch.sh`
  is enabled in container `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh`
  but commented out in dev server
  `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.dev.sh`.
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/episode_state_transition_minute_batch.sh`
  needs `EPISODE_STATE_TRANSITION_BATCH_ENABLE=1` in cron.
- Story context prod cron has live-state history and source fallback differences.
  Do not infer current max parallel from one file; verify active `crontab -l` and
  then compare with `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`.
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
