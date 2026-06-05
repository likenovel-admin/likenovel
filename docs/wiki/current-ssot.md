# Current SSOT

> Status: CURRENT SSOT INDEX
> Last verified: 2026-06-06
> Code readback: 2026-06-03 for deploy, DB, cron, and batch anchors;
> 2026-06-06 for CMS notice anchors

## Work Rules

- Root agent rules: `AGENTS.md`
- Claude entrypoint: `CLAUDE.md`
- Documentation update trigger: `AGENTS.md`
- Git-trackable entry docs: `AGENTS.md`, `CLAUDE.md`, `docs/wiki/README.md`, `docs/deployment-runbook.md`, `docs/batch-system-architecture.md`
- Git/protected branch rules: `AGENTS.md`
- Browser verification rules: `AGENTS.md`

## Deployment

- Primary runbook: `docs/deployment-runbook.md`
- Frontend Docker background: `DEPLOYMENT.md`
- Production monitoring: `ops/monitor-prod/README.md`
- Backend deploy scripts:
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.sh`
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/verify_backend_prod_deploy.sh`
- Backend workflow files:
  - `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`
  - `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions.yml`
- Frontend workflow files:
  - `.github/workflows/docker-dev.yml`
  - `.github/workflows/docker-prod.yml`

## Backend

- Code SSOT:
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/routers/`
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/`
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/schemas/`
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/`
- Orientation: use the code paths above. Local-only `backend-api.md` may exist in
  this workspace, but it is not a git-tracked current SSOT.

## Apps

- User web: `service/`, `service/README.md`
- Partner: `partner/`, `partner/README.md`
- CMS: `cms/`, `cms/README.md`
- CMS site notice SOP: `docs/cms-notice-runbook.md`
- Design system: `docs/design-system.md`
- Architecture overview: `architecture.md` (orientation only; execution runbook still wins)

## AI And Websochat

- Freeform contract: `docs/ai-chat-freeform-contract.md`
- Freeform state machine: `docs/ai-chat-freeform-state-machine.md`
- AI reader manual: `docs/ai-reader-operation-manual.md`
- Websochat current code:
  - `service/app/websochat/page.tsx`
  - `service/app/api/query/websochat/`
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/routers/websochat/`
  - `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/websochat/`

## DB And Batch

- Backend DB URL source: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/const.py`
- Backend DB engine source: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/rdb.py`
- Migration source: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/`
- Batch source: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/`
- Docker/container cron source: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.sh`
- Dev server cron template: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_job.dev.sh`
- Batch env selector: `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/cron_env.sh`
- Batch guide: `docs/batch-system-architecture.md`
- Deployment/batch runtime guide: `docs/wiki/deployment-and-batch.md`
