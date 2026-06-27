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

### Character Chat Pipeline

> Last verified: 2026-06-28
> Source of truth: backend code, deployed prod readback, and DB rows. If this
> section conflicts with code, trust code.

This section records how Websochat character chat data is collected, assembled,
and used at chat time. It separates the current prod path from the improved
character path being prepared for prod.

#### Current Prod Path

Current prod character chat works, but it is not yet the improved character
chat path.

Verified prod readback on 2026-06-28:

- Deployed runtime reads `character_inventory`, `character_rp_profile`, and
  `character_rp_examples` for RP chat.
- Deployed runtime does not yet read `character_inventory_v3`.
- Deployed runtime does not yet attach `relation_inventory` to the RP prompt,
  even though prod DB already contains active `relation_inventory` rows.
- Product-detail RP CTAs open RP character-selection mode. They do not pass a
  stable character `scope_key` to Websochat.

Prod active summary row counts at readback time:

| summary_type | active rows | products |
| --- | ---: | ---: |
| `episode_summary` | 3,640 | 93 |
| `episode_character_signals` | 3,440 | 90 |
| `character_inventory` | 3,971 | 89 |
| `relation_inventory` | 9,145 | 89 |
| `character_rp_profile` | 218 | 60 |
| `character_rp_examples` | 218 | 60 |

Prod public/free coverage at readback time:

- Public free products: 66.
- Context-ready public free products: 50.
- Ready public free products with RP profile/examples: 26.
- Ready public free products without RP profile/examples: 24.
- Failed public free products: 11.
- Products without context row: 5.

The 11 failed public free products had `story-agent foundation mismatch` where
`episode_summary` existed for all open episodes but some
`episode_character_signals` rows were missing.

#### Improved Target Path

The improved path treats `episode_character_signals` as the raw character signal
layer, `character_inventory_v3` as the character identity/public-chat gate, and
`relation_inventory` as relation context for the RP prompt.

End-to-end target flow:

```text
episode content
-> episode_summary
-> episode_character_signals
-> character_inventory_v3
-> relation_inventory
-> character_rp_profile / character_rp_examples
-> selected character scope_key
-> RP context assembly
-> RP system prompt
-> Gemini RP reply
```

#### Data Construction Steps

1. Build `episode_summary` from each open episode.
2. Build `episode_character_signals` from the episode text and summary.
3. Aggregate per-episode signals into `character_inventory_v3`.
4. Aggregate per-episode relation signals into `relation_inventory`.
5. Build `character_rp_profile` and `character_rp_examples` for eligible
   character scopes.
6. Use `--refresh-rp` for delta runs when RP profile/examples must be refreshed.

The character inventory v3 layer is responsible for:

- alias and alternate-name merge;
- protagonist marking;
- role-name, relation-name, and generic-name suppression;
- public chat eligibility;
- slot eligibility;
- stable `scope_key` output for frontend/admin selection.

#### Chat-Time Assembly

At chat time the improved path should assemble:

```text
active character scope_key
-> character_inventory_v3 payload
-> character_rp_profile
-> character_rp_examples
-> relation_inventory lines
-> user read scope
-> optional exact source recall
-> final RP prompt
```

The RP prompt must include:

- fixed character role;
- speech style;
- personality core;
- baseline attitude;
- character presence/context from inventory;
- relation context from `relation_inventory`;
- user read-scope boundary;
- trajectory/recent context;
- source recall only when needed;
- selected examples for voice and rhythm.

#### Frontend/Admin Contract

Character entry points must pass a stable character identifier. Opening generic
RP mode is not enough for character slots.

Required slot/admin contract:

```text
product_id
character_scope_key
display_name
is_protagonist
image_file_id
slot schedule/order metadata
```

Expected user flow:

```text
user clicks character card
-> frontend passes character_scope_key
-> backend resolves that exact character
-> Websochat starts RP chat for that character
```

#### Prod Readiness Gates

Do not call the improved path prod-ready until all gates below are satisfied.

1. Runtime wiring
   - `character_inventory_v3` is read by active-character resolution.
   - unsafe v3 character rows cannot be exposed through legacy fallback.
   - `relation_inventory` is attached to the RP context and prompt.

2. Batch coverage
   - delta candidate selection retries missing `episode_character_signals`, not
     only missing `episode_summary`.
   - `--refresh-rp` or an equivalent controlled refresh path updates
     `character_rp_profile` and `character_rp_examples` for affected scopes.
   - ready public/free works without RP profile/examples are backfilled or kept
     out of character-chat exposure.

3. Frontend/admin selection
   - admin character roster is based on stable `character_inventory_v3`
     `scope_key`.
   - character slots persist the selected `scope_key`.
   - product/detail or slot click passes the selected `scope_key` into
     Websochat.

4. Regression protection
   - existing Websochat QA and worldcup paths still pass tests.
   - existing RP sessions are not invalidated just because a character is absent
     from a new slot.
   - no automatic deactivation of user-facing characters happens without an
     explicit admin or data-quality rule.

5. Shadow evidence
   - run public/free target products in shadow mode.
   - include failed-context products after `episode_character_signals` retry is
     fixed.
   - compare old prod RP prompt inputs with improved prompt inputs for at least
     protagonist and one secondary character where available.

#### Known Risks

- Current prod RP data is stale for newer works because delta mode skips RP
  profile/example refresh unless `--refresh-rp` is set.
- Current prod batch wrapper can miss products where `episode_summary` is
  complete but `episode_character_signals` is incomplete.
- `relation_inventory` exists in prod DB but is not useful until runtime prompt
  assembly consumes it.
- A character card cannot reliably open the intended character until frontend
  passes `character_scope_key`.

#### Minimal Safe Rollout Order

1. Fix batch retry coverage for missing `episode_character_signals`.
   - Implemented in local branch after the 2026-06-28 review; verify again
     before deploy.
2. Enable controlled shadow/backfill for RP profile/examples.
3. Deploy runtime consumption of `character_inventory_v3` and
   `relation_inventory`.
4. Expose admin character roster from v3 eligible rows.
5. Wire frontend character card click to pass `character_scope_key`.
6. Run prod smoke on a small allowlisted product set before broad exposure.

#### External Prod Readiness Review

Review date: 2026-06-28.

Oracle Pro Extended review session `character-chat-prod-readiness` verdict:
`NOT DEPLOYABLE`.

Oracle blockers:

- Prod runtime is not actually wired to the improved path yet.
- Direct character-card chat lacks stable `character_scope_key` handoff.
- Public/free RP coverage is materially incomplete.
- Failed products expose an `episode_character_signals` retry gap.
- Legacy fallback and v3 public gate behavior is not proven safe enough for
  broad prod exposure.

Claude Opus review verdict: `CONDITIONAL PASS` only for backend free-text RP
quality improvements behind gates; `NOT DEPLOYABLE` for direct character-card
chat. Claude reviewed the same local packet, but workspace/LSP readback was
blocked, so its judgment is advisory over the supplied evidence.

Claude blockers:

- Frontend/admin `scope_key` handoff is missing.
- Legacy inventory seed can bypass v3 public gate unless verified or patched.
- Delta/cron skips RP refresh unless `--refresh-rp` is used.
- Delta candidate selection can miss products where `episode_summary` is
  complete but `episode_character_signals` is incomplete. This was patched in
  the local branch after the review; deploy still requires test and prod
  readback.

Current combined decision:

- Do not expose the full improved character-chat path to prod users yet.
- Backend v3/relation RP improvements may proceed only as shadow or narrow
  internal/admin-only validation after legacy seed gate verification.
- Missing `episode_character_signals` retry is no longer an intended blocker
  after the local patch, but it must be verified in the deployed batch wrapper.
- Character-card direct chat requires a separate frontend/admin `scope_key`
  handoff rollout.
