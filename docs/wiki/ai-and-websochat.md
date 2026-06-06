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

Code-readback anchors verified on 2026-06-06:

- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/ai/recommendation_service.py`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/ai/ai_chat_service.py`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/routers/ai/ai_command.py`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/models/product.py`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/45-create_ai_signal_and_factor_tables.sql`
- `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/74-adjust-major-genres-for-munpia-style.sql`

When designing AI, recommendation, taste, reader-agent, or activity-tracking
features:

1. Product metadata must use the seven-axis DNA label vocabulary before adding
new enums or freeform categories.
2. User activity must reuse `tb_user_ai_signal_event` and related factor/event
tables before creating a new activity table.
3. Learned taste must reuse `tb_user_taste_factor_score`; do not directly
accumulate a separate `genre_weights`, `tag_weights`, or `preference_vector`
model beside it without explicit justification.
4. Candidate selection should reuse `recommendation_service` unless code
readback proves the existing service cannot support the requirement.
5. AI-reader activity should preserve signal-system consistency. If AI-user
statistics must be separated from normal users, design the separation at the
user/statistics layer rather than forking the whole recommendation pipeline.

Do not infer LikeNovel genre or audience distribution from generic Korean web
novel market assumptions. The current genre baseline is the 16 active
`tb_standard_keyword` major genres set by
`likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/init/74-adjust-major-genres-for-munpia-style.sql`.
If a distribution is needed, query LikeNovel data or ask the user; do not assume
KakaoPage/Naver-style romance-heavy market ratios.

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
