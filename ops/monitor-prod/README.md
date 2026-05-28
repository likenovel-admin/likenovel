# prod monitor

This directory is the tracked SSOT for LikeNovel production monitoring scripts.

Run:

```bash
bash ops/monitor-prod/monitor.sh quick
bash ops/monitor-prod/monitor.sh full
bash ops/monitor-prod/monitor.sh deep
```

The Codex skill wrapper at
`/home/hongsan/.codex/skills/likenovel-prod-monitoring/scripts/run_monitor.sh`
should delegate to this tracked entrypoint.

Rule for GitHub Actions checks:

- Alert only when the latest completed run for a branch/workflow is failed.
- Do not alert on older failed runs if a newer completed run for the same
  branch/workflow has succeeded.
