# AI And Websochat

> Status: CURRENT GUIDE
> Last verified: 2026-06-03

## AI Chat Freeform

Current freeform chat is a read-only data-agent path on
`POST /v1/command/ai/chat`.

Current backend source:

- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/routers/ai/ai_command.py`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/ai/ai_chat_service.py`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/schemas/ai_recommendation.py`

Current tool contract:

- `get_fact_catalog`
- `run_readonly_query`
- `get_product_info`
- `submit_final_recommendation`

Do not reconnect legacy preset/search paths into the freeform core unless the
contract document is updated in the same task.

## AI Recommendation

Seven-axis AI recommendation uses the label codebook and backend runtime copies:

- `docs/ai-codebook/allowed-labels-by-axis.json`
- `docs/ai-codebook/label-definitions-by-axis.json`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/ai/allowed-labels-by-axis.json`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/ai/label-definitions-by-axis.json`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/allowed-labels-by-axis.json`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/batch/label-definitions-by-axis.json`

Historical plans are useful for intent, but current API and batch behavior comes
from routers, services, migrations, and batch scripts.

## Websochat / Story Agent

Current public frontend route:

- `service/app/websochat/page.tsx`

Compatibility route:

- `service/next.config.mjs` redirects `/story-agent` to `/websochat`
- `/story-agent-api/*` rewrites to `/websochat-api/*`

Current backend canonical route:

- `/v1/query/websochat/*`
- `/v1/command/websochat/*`

Compatibility backend route:

- `/v1/query/story-agent/*`
- `/v1/command/story-agent/*`

The story-agent routers currently call websochat schemas/services. Treat
`docs/story-agent-prd.md` as historical product planning, not current
implementation SSOT.
