# LikeNovel CMS App

> Status: CURRENT GUIDE
> Current entry: root `AGENTS.md`, `CLAUDE.md`, `docs/wiki/README.md`

Admin/CMS dashboard.

## Runtime

- Framework: Next.js 15
- Local Docker service: `likenovel-cms-local`
- Local URL: `http://localhost:3002`
- Production domain: `https://cms.likenovel.net`
- Dev domain: `https://cms.likenovel.dev`

## Local Run

```bash
cd /home/hongsan/work/likenovel
docker compose up -d --build cms
```

## Checks

```bash
corepack yarn --cwd cms build
corepack yarn --cwd cms lint
corepack yarn --cwd cms test:contracts
```

Do not use this README as a deployment runbook. Use `docs/deployment-runbook.md`.
