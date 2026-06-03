# Legacy And Snapshot Docs

> Status: CURRENT CATALOG
> Last verified: 2026-06-03

These documents are kept for history. Do not move them unless a separate cleanup
task explicitly updates every reference.

## LEGACY - DO NOT EXECUTE

- `likenovel-service-api/likenovel-service-api/CLAUDE.md`
  - Old backend deploy notes.
  - Conflicts with current systemd/gunicorn/CodeDeploy hard gates.
  - Use root `CLAUDE.md`, `AGENTS.md`, `docs/deployment-runbook.md`, and `docs/wiki/deployment-and-batch.md`.

- Frontend legacy PM2/env copy flow
  - Old script references:
    - `service/run_fe_dev.sh`
    - `service/run_fe.sh`
    - `partner/run_partner.sh`
    - `cms/run_cms.sh`
  - Old env file names:
    - `.env.production.dev`
    - `.env.production.prod`
  - Historical notes remain in `DEPLOYMENT.md`.
  - Current frontend deployment SSOT is root `.github/workflows/docker-dev.yml`,
    `.github/workflows/docker-prod.yml`, and `docs/deployment-runbook.md`.
  - Do not use PM2/env copy scripts as the current LikeNovel deployment path
    unless a separate live server readback proves that legacy path is the
    intended target for a specific recovery.

- `DEPLOYMENT.md` manual dev API PM2 staging plan
  - Contains historical `api-dev` PM2 commands for port `3011`.
  - Current backend dev deployment is backend submodule `dev` branch →
    `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`
    → CodeDeploy → `likenovel-api-dev.service`.
  - Use `docs/deployment-runbook.md` and `docs/wiki/deployment-and-batch.md`
    before touching dev API, DB, or cron paths.

## CURRENT BACKGROUND

- `DEPLOYMENT.md`
  - Frontend Docker/staging background.
  - Not the execution SSOT for backend deploy, DB channel, cron, or batch runtime paths.

- `architecture.md`
  - High-level architecture overview.
  - Not the execution SSOT for deploy, DB channel, cron, or batch runtime paths.
  - Use `docs/deployment-runbook.md` and `docs/wiki/deployment-and-batch.md`
    before operating.

- `docs/batch-system-architecture.md`
  - Current batch architecture guide.
  - Use with `docs/wiki/deployment-and-batch.md`.
  - Verify active cron from source files and server readback before operating.

## HISTORICAL

- `CURSOR_CHAT_MEMENTO_RECOVERY.md`
  - Recovered Cursor session context.
  - Useful for old incident history, but may contain PM2-era or pre-CodeDeploy assumptions.

- `docs/backend-blue-green-deployment-plan.md`
  - Blue/green backend deployment design plan.
  - Planning context only; current deploy runbook still wins.

- `docs/project-analysis-2026-02-18.md`
  - Point-in-time repository analysis snapshot.
  - Contains Windows-path and PM2-era wording; verify against current code/runbook.

- `docs/project-architecture-full.md`
  - Point-in-time architecture snapshot.
  - Contains historical env-file notes such as `.env.production.dev` and
    `.env.production.prod`; current frontend Docker env handling is in
    `docs/deployment-runbook.md`.

- `docs/branching-and-deployment.md`
  - Older branch/deploy/infrastructure guide.
  - Current branch and deploy hard gates live in `AGENTS.md` and `docs/deployment-runbook.md`.

- `docs/epub-bulk-upload-plan.md`
  - EPUB bulk upload product/design plan.
  - Do not use as live CMS upload runbook.

- `service/nextjs-company-cicd-setup.md`
  - Legacy external CI/CD template, not LikeNovel deploy procedure.

- `docs/ai-chat-v2-implementation-plan.md`
  - Old AI chat v2 implementation plan.
  - Current freeform core is read-only data-agent/tool-use based.

- `docs/story-agent-prd.md`
  - Original Story Agent PRD.
  - Current public route is `websochat`; story-agent is compatibility surface.

- `docs/ai-recommendation-development-plan-v1.md`
  - Original AI recommendation planning context.

- `docs/ai-recommendation-development-plan-v2.md`
  - Seven-axis recommendation planning context.
  - Current APIs/batches/AI reader integration have expanded beyond it.

## SNAPSHOT

- `docs/prod-rollout-handoff-2026-03-24.md`
  - Point-in-time prod rollout handoff for a specific migration set.

- `docs/db-schema.md`
  - 2026-02-28 schema snapshot.

- `docs/db-schema-ai-recommendation.md`
  - 2026-02-20 AI schema snapshot.

- `docs/batch-drift-matrix.md`
  - Point-in-time local vs extracted batch comparison.

- `docs/batch-drift-matrix-live.md`
  - Point-in-time local vs live batch comparison.

## BOILERPLATE - NOT DEPLOY GUIDES

- `service/README.md`
- `partner/README.md`
- `cms/README.md`
  - Create-next-app style orientation only.
  - Do not use their Vercel/deployment text for LikeNovel operations.

## LOCAL/SENSITIVE REFERENCE

- `MEMORY.md`
  - Legacy local generated memory index.
  - It may be mojibake or stale. Use root `CLAUDE.md`, `AGENTS.md`, and
    `docs/wiki/README.md` for current session entry.

- `docs/runtime-accounts.local.md`
  - Local account/runtime reference.
  - Verify current account state before use and never treat it as public deployment documentation.
