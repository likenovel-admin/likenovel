# prod monitor

This directory is the tracked SSOT for LikeNovel production monitoring scripts.

Run:

```bash
bash ops/monitor-prod/monitor.sh quick
bash ops/monitor-prod/monitor.sh full
bash ops/monitor-prod/monitor.sh deep
```

`deep` includes the read-only `ai_pipeline_batches` check. It covers:

- `build_story_agent_context_batch.sh`: websochat story context, character
  signals/inventory/relations, character-chat RP/profile/examples/opening assets
- `ai_dna_extract_daily_batch.sh`
- `ai_signal_daily_batch.sh`
- `ai_taste_hourly_batch.sh` plus the manual-replay scheduling guard

For each scheduled AI batch it reads the live crontab, matching processes and
locks, the latest timestamped run block, and DB/result rows. It never starts a
batch or changes cron/DB state.

The Codex skill wrapper at
`/home/hongsan/.codex/skills/likenovel-prod-monitoring/scripts/run_monitor.sh`
should delegate to this tracked entrypoint.

Rule for GitHub Actions checks:

- Alert only when the latest completed run for a branch/workflow is failed.
- Do not alert on older failed runs if a newer completed run for the same
  branch/workflow has succeeded.

Character-chat asset continuity is checked only at `deep` level because it
performs a bounded read-only prod DB audit. The check runs the audit CLI from
the active backend runtime and reports `ALERT` when exact-key RP assets,
identity continuity, or usable scene assets require repair. A missing deployed
audit CLI is `UNKNOWN`, never normal.
Missing main protagonists are reported separately as `character_chat:protagonist` `WARN` and do not change the asset verdict.
