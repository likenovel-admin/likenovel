# LikeNovel Claude Entry

> Status: CURRENT CLAUDE ENTRY
> Last verified: 2026-06-03

This file is the Claude Code entrypoint for `/home/hongsan/work/likenovel`.
Do not use nested legacy `CLAUDE.md` files as the main project runbook.

## Required First Reads

1. Read `AGENTS.md` if it exists. If it is missing, say so and continue from
   this file plus `docs/wiki/README.md`; do not assume the project has no agent
   rules.
2. Read `docs/wiki/README.md`.
3. For deploy, DB, cron, or batch work, read both:
   - `docs/wiki/deployment-and-batch.md`
   - `docs/deployment-runbook.md`
4. For freeform AI chat work, read both:
   - `docs/ai-chat-freeform-contract.md`
   - `docs/ai-chat-freeform-state-machine.md`
5. For design/UI work, read `docs/design-system.md`.
   If it is missing, fallback to `/home/hongsan/.claude/projects/-home-hongsan-work-likenovel/memory/design-system.md` and report that the repo copy is missing.

## Rules

- Codebase is the source of truth. If docs conflict with code/runtime readback,
  trust code/runtime and update the relevant document in the same task.
- Before any LikeNovel dev-environment work, check `likenovel-dev` RDS with
  `bash devtools/dev-rds.sh status`; if it is stopped, run
  `bash devtools/dev-rds.sh up` before starting. This applies to dev deploys,
  `api.likenovel.dev`, `*.likenovel.dev` browser checks, local-to-dev RDS tunnel
  work through `host.docker.internal:13306`, and dev DB/batch work. If a dev DB
  connection error appears or `likenovel-dev` is stopped/stopping, run
  `bash devtools/dev-rds.sh up` before root-cause analysis. Do not turn it off
  repeatedly during a work loop; the default stop policy is idle-stop after one
  hour with zero DB connections. Never confuse this with prod `ln-rds`.
- If the user says a tunnel is open in Git Bash, treat it as user-owned Windows
  state. Do not open, kill, replace, or "fix" WSL/tmux/ssh tunnels unless the
  user explicitly asks. WSL or Docker not seeing `localhost` or
  `host.docker.internal` is only a Windows-vs-WSL boundary signal, not proof the
  Git Bash tunnel is absent.
- Do not run backend local Docker compose (`fastapi_be_server/docker-compose.yml`)
  for ordinary local frontend/browser confirmation. Its `api` service starts via
  `/app/dist/batch/start-cron.sh` and installs container cron. Read back the
  deployment/batch runbooks and get explicit user confirmation before running
  backend compose or any cron/batch-affecting local backend command.
- Do not use CMS/admin credentials, signin API calls, password reset routes, or
  admin login probes as connectivity checks unless the user explicitly requests
  that exact account operation. These probes can leave login audit state.
- `AGENTS.md` is the shared operational rulebook for Codex and Claude in this
  workspace when present. It may be local-only/ignored, so check file existence
  separately from git tracking.
- `docs/wiki/` is an index. It preserves old document paths and classifies
  current, historical, snapshot, and legacy docs.
- `likenovel-service-api/likenovel-service-api/CLAUDE.md` is legacy historical
  backend deploy context only. Do not execute commands from it.
- Ignored/local-only docs may still be readable in this workspace. Report file
  existence and git tracking separately.
