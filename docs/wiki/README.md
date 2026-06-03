# LikeNovel Docs Wiki

> Status: CURRENT INDEX
> Last verified: 2026-06-03
> Source of truth: codebase, root `AGENTS.md`, and linked SSOT documents

This wiki is an index. It does not move or replace existing documents.
All repo file paths in this wiki are repository-root relative unless explicitly
marked as an absolute server path.

## Purpose

- Keep current SSOT documents discoverable.
- Keep old plans and snapshots readable as history.
- Prevent legacy procedures from being mistaken for current runbooks.

## Status Labels

- `CURRENT SSOT`: current source of truth for work.
- `CURRENT GUIDE`: current enough for orientation, but code still wins.
- `HISTORICAL`: old plan/context. Do not execute as-is.
- `LEGACY - DO NOT EXECUTE`: old procedure that can be harmful now.
- `SNAPSHOT`: point-in-time readback, not current truth.

## Pages

- [Current SSOT](current-ssot.md)
- [Legacy And Snapshot Docs](legacy-and-snapshot-docs.md)
- [Deployment And Batch](deployment-and-batch.md)
- [AI And Websochat](ai-and-websochat.md)

## Rules

1. If this wiki conflicts with code, trust code.
2. If this wiki conflicts with `AGENTS.md`, trust `AGENTS.md`.
3. Do not run deploy, DB, batch, billing, account, or CMS mutation commands
   from a wiki summary. Open the linked runbook/source file and verify current
   state first.
4. Do not move historical docs just to make the wiki cleaner. Preserve old paths
   and classify them here.
5. For dev/prod DB, cron, and batch work, read `deployment-and-batch.md` before
   opening older deployment notes.
