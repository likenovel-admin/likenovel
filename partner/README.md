# LikeNovel Partner App

> Status: CURRENT GUIDE
> Current entry: root `AGENTS.md`, `CLAUDE.md`, `docs/wiki/README.md`

Partner dashboard for authors and CP workflows.

## Runtime

- Framework: Next.js 15
- Package manager: Yarn via Corepack
- Local Docker service: `likenovel-partner-local`
- Local URL: `http://localhost:3001`
- Production domain: `https://partner.likenovel.net`
- Dev domain: `https://partner.likenovel.dev`

## Local Run

```bash
cd /home/hongsan/work/likenovel
docker compose up -d --build partner
```

## Checks

```bash
corepack yarn --cwd partner build
corepack yarn --cwd partner lint
```

Do not use this README as a deployment runbook. Use `docs/deployment-runbook.md`.
