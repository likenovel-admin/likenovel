# LikeNovel Service App

> Status: CURRENT GUIDE
> Current entry: root `AGENTS.md`, `CLAUDE.md`, `docs/wiki/README.md`

User-facing web app.

## Runtime

- Framework: Next.js 14
- Package manager: Yarn via Corepack
- Local Docker service: `likenovel-service-local`
- Local URL: `http://localhost:3000`
- Production domain: `https://www.likenovel.net`
- Dev domain: `https://www.likenovel.dev`

## Local Run

Use the root Docker compose path for ordinary local verification:

```bash
cd /home/hongsan/work/likenovel
docker compose up -d --build service
```

If the user asks to check `3000`, verify this Docker service, not a temporary dev-server port.

## Checks

```bash
corepack yarn --cwd service build
corepack yarn --cwd service test:utils
```

Do not use this README as a deployment runbook. Use `docs/deployment-runbook.md`.
