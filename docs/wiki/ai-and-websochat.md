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

### Read Scope And Paid Access

> Last verified: 2026-07-21
> Source of truth: backend `websochat_service.py`, viewer episode service, and
> `service/utils/websochatLaunch.ts`.

Websochat is not free-product-only. Paid products may enter Websochat when the
product is public, context-ready, has synced story-agent context, and the actor
has at least one contiguous readable episode from episode 1.

The backend is the authority for access. Frontend launch eligibility must not
decide paid ownership; it may only check product identity, context status, and
published/synced episode counts. Session creation and every message request
must recompute the readable ceiling from current server state.

Read scope is:

```text
min(user requested/read episode, highest contiguous server-authorized episode, synced latest episode)
```

Backend authorization and sync clamps are the final hard ceiling. Persistent
scope authority comes only from structured account, viewer, or session progress.
Free-form episode mentions may narrow the current turn's topic and evidence
ceiling only when structured scope is already known; they never create or
change persistent scope.

Only a whole-line exact `N화` input is a text scope command. It may initialize
an unknown scope or strictly narrow a known scope. An equal or higher request is
a no-op and preserves the existing structured provenance. When scope is unknown,
arbitrary free-form text, titles, wishes, completion claims, and nested game
state fail closed and cannot establish or override scope.

At the end of every message, a final fresh authorization check re-clamps both
stored scope and all episode references in the response.

Server-authorized episodes are open episodes that are free, owned, or under an
unexpired rental in `tb_user_productbook`. Non-contiguous purchases do not extend
the scope past the first missing/unauthorized episode, because current
Websochat retrieval uses an integer `read_episode_to` range.

Important examples:

- A new character-chat session uses the episode selected within the signed-in
  account's server-side reading scope. Automatic character catalog entries use
  the character's earliest usable appearance episode as the lower bound; legacy
  entries without that field retain episode 1. The authorized and synced
  ceilings remain server-side safety caps.
- If a user purchased through episode 50 but the viewer launch says the last
  read episode is 27, Websochat starts from episode 27.
- If a client sends 50 but server authorization or context sync only reaches
  27, Websochat clamps to 27.
- If rental/ownership is revoked or expired after a session was created, the
  next message/list/readback must clamp or clear the stored session scope before
  exposing episode references or retrieval context.
- If no episode is currently readable, Websochat rejects the session/message
  before character resolution, summary lookup, RP context, game setup, or QA
  retrieval can run.

Daily free message quotas are separate by session type: dedicated character-chat
sessions receive 10 free user messages per actor per day, while regular
Websochat sessions retain 3. Messages in one pool do not consume the other pool;
the existing login and cash rules apply after that pool is exhausted.

### Character Chat End-to-End Code Map — 2026-09-07

현재 확인한 로컬 주인공챗 전체 순서는
[주인공챗 전체 데이터·실행 흐름](../character-chat-end-to-end-flow.md)에 기록한다.
원문부터 22단계, 새/기존 RP 경로, 실제 prompt 소비 자산, 기억 제한,
실패·재사용 경계를 포함한다. 코드 스냅샷이며 PROD 실행·실작품 품질 보증이 아니다.
아래 2026-06-28 pipeline 및 날짜별 검증은 당시의 역사 기록으로 보존한다.

현재 미커밋 로컬 생산 경로는 첫 3공개 회차의 작품 인물 registry를 만들고,
최대 30공개 회차 관측을 이름과 무관한 ID로 연결한다. 발화자·묘사 주체·상대·
전언 여부를 분리해 grounded RP와 실제 채팅 프롬프트까지 보존한다.
기존 serving 인물을 다음 배치에서 자동으로 새 ID로 교체하지 않는다.
기능 회귀와 실작품 의미 품질을 구분하며, 전환 조건·0화 제약·현재 검증 환경은
위 흐름 문서 §7.2를 따른다. 이 상태는 배포 완료/승인이 아니다.

### Character Chat Pipeline — Historical 2026-06-28

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

### Local verification 2026-09-06–07

These are uncommitted local changes, not deployed behavior or a replacement for
the dated production readbacks above.

The 2026-09-07 pre-deploy check found that both DEV/PROD workflows omitted the
required `scripts/character_asset_attempt.py`; each now has an explicit `cp`.
The regression executes the actual workflow copy commands, then imports the helper
outside the checkout with `python -I -S`: both failed before the fix and passed after.
The standalone deployment gate also runs this test. This is local packaging proof,
not DEV/PROD deployment or real-work semantic quality verification.

The earlier v4 experiment below is historical evidence. The later local v5
contract supersedes it in the working tree, but has not regenerated production
assets or established real-work identity accuracy:

- v5 signals require bounded evidence quotes from the supplied episode source or
  summary, with explicit provenance. Grounding is checked against the supplied
  text; substring equality is not proof of correct speaker attribution.
- All requested signal payloads must validate before any signal serving row is
  activated. Accepted provider payloads survive a serving-transaction rollback in
  the separate `tb_story_agent_character_asset_attempt` receipt table. Identical accepted
  requests replay without another paid call; invalid or ambiguous in-flight
  attempts do not automatically retry or fall back to another provider.
- Grounding follows the resolved inventory identity into a versioned RP pair.
  New v1 pairs are assembled without profile/dialogue LLM calls. Runtime requires
  matching inventory/profile/examples contracts and selects evidence and names
  within the reader's episode boundary. Partial/mixed v1 generations fail closed;
  only completely unmarked assets use the existing legacy path.
- Bounded, source-grounded action/state evidence can make v1 assets ready without
  invented dialogue examples or a global personality profile. Both opening and
  reply prompts consume the selected grounding; future quotes and names are
  excluded. The earlier example-only readiness rule below applies to legacy
  assets, not these v1 pairs.
- Latest combined related local regression run: 916 passed, 167 opt-in MySQL tests
  skipped, 369 subtests passed. All 167 MySQL tests separately passed
  against the existing local MySQL 8.0 container, including rollback persistence,
  concurrent duplicate claims, migration idempotency, SQL/Python readiness parity,
  public consumer queries, and the actual manual-full wrapper SQL. A further
  17 existing MySQL cases passed after adding same-database comparisons between
  the actual producer source-map query/scene binding helper and public scene SQL.
  These helper-level comparisons do not claim full bundle readiness. Synthetic
  scratch schemas were removed. No DEV/PROD database, environment, or paid batch
  was changed by this validation. Real-work semantic quality, production-scale
  query performance, rendered browser behavior, and deployed behavior remain unverified.
  Frontend `yarn test:utils` (including the new actual QueryObserver temporal-cache
  regression) and `tsc --noEmit --incremental false` also passed.
- Follow-up review regressions reject ambiguous same-label possession targets and
  preserve cannot-links to potential body owners. Invalid marker-bearing v5 rows
  cannot enter legacy aggregation; actually unmarked rows retain compatibility.
  Full CLI failures now return nonzero even alongside budget deferral.
- v1 opening/reply prompts no longer duplicate source dialogue through legacy raw
  example blocks. Grounding remains round-trip-preserving JSON, with structural
  control/separator characters escaped. Python/MySQL checks cover unsafe characters
  inside otherwise nonempty identity labels as well as inconsistent marked pairs.
- Grounded v1 identity, display safety, generation binding, and final readiness
  decisions now feed the producer, runtime, and public consumers coherently.
  Synthetic producer-to-runtime tests cover an anonymous main character and a
  named action-grounded major character; this is not real-work attribution or
  conversation-quality evidence. Chat eligibility and stricter public-slot
  eligibility remain distinct. Grounded evidence is counted separately from real
  dialogue examples; an empty examples array still has example count zero.
- Public catalog/preview/slot consumers and guarded manual-full selection accept
  coherent v1 pairs without requiring fabricated legacy dialogue. Mixed markers,
  different generations, and invalid final decisions fail closed. Exact legacy
  source-document gates and wholly unmarked compatibility remain in place.
  Existing public snapshots are not regenerated or invalidated by these local
  asset-contract changes; their normal refresh is a separate future rollout gate.
- Confirmed user policy: collect the first 30 public episode rows ordered by
  `episode_no`, then `episode_id`, not episode numbers 1 through 30. The mistakenly
  added numeric cap has been removed from producer, wrapper, and consumers. With
  episode 27 missing, episode 31 is included and the 31st public row (episode 32)
  is excluded from automatic asset collection. Existing manual full-summary
  behavior outside that asset window is preserved. The original ordinal
  regression expectation is retained and now passes.
- Producer/catalog grounding validation uses an explicit `read_episode_to=None`
  (no numeric reader bound); actual chat passes its authoritative reader boundary,
  while the public preview passes its requested episode selection bound. The
  public preview route does not authenticate account reading permission. Evidence
  at episode 31 or later is valid when it belongs to
  the selected public window, but future evidence remains excluded for a reader
  below that number. The maximum selected grounding count stays 12. Producer
  selection SQL gap/order checks use SQLite as a dialect proxy; wrapper and
  consumer SQL are separately exercised on MySQL.
- Signals/scenes now keep raw text and request/receipt scope by exact
  `episode:<episode_id>` throughout full/delta/repair. Active-doc reload also
  matches episode/document/chunk identity and first-30 public ordinal membership;
  same-number private or inactive sibling sources cannot supply the request.
  Scene hashes include exact scope and raw text. A one-way numeric projection
  remains only for the named unmarked legacy RP consumer, using already-selected
  public sources; remove it when that legacy consumer is removed. No v5 signal
  or scene producer consumes that lossy projection.
- Public catalog/preview scenes require exact episode scope, public ordinal
  membership, and the existing free-scene gate. Preview enforces the shared
  product policy and five globally prepared scene episode IDs, then returns only
  scene/identity metadata at or below the requested anchor. Requiring five scenes
  below that anchor would break the existing entry-episode preview, so global
  readiness and preview selection remain distinct. Marked v1 preview excludes
  unbounded inventory aliases and leftover personality/speech metadata; fully
  unmarked legacy API metadata retains compatibility.
- Admin roster selection and product quality now use the same batched scene-count
  query as the public catalog. Active raw-text token occurrence is not scene
  evidence. Actual MySQL regressions reject four valid scenes plus a paid,
  private, inactive, out-of-window, or malformed fifth row, while valid five-scene
  v1 and legacy assets remain selectable.
- Repair coverage and its before/after postcondition retain exact episode scope
  keys, intersected with the selected public/free source set. Five exact IDs can
  satisfy readiness even when two share an episode number; a paid same-number
  sibling cannot hide the missing free source. Numeric scene lists remain only
  in the existing diagnostic JSON, not repair decisions; remove that projection
  when its diagnostic consumer is retired. Requested and automatic repair use
  the same exact-scope eligibility boundary.
- A real anonymous producer-to-scene regression exposed a missing-field mismatch:
  inventory emits `first_person_evidence.episode_count`, while the scene packet
  formerly required top-level `is_first_person`. The packet now reuses the existing
  canonical generic-first-person helper and keeps its main/stable-role boundary.
  Shared, mixed, fake-prefix, missing-source, zero/missing-evidence, and nonmain
  variants remain excluded. Actual named/anonymous producer-to-repair tests cover
  six raw-present/missing and requested/automatic paths; HTTP/storage boundaries
  are synthetic, not a paid provider or real-database repair execution.
- Frontend preview placeholder and retained-success data are scoped by product,
  character, and requested episode. A 31-to-30 pending/error transition cannot
  select 31-episode metadata or text. Same-anchor cache/failed refresh remains
  usable, and request 30 may validly select a scene at 29. The preview no longer
  falls back to unbounded catalog personality/speech fields. These are actual
  QueryObserver state tests, not a claim of rendered-browser verification.
- Preserved baseline limitation: public episode 0 occupies a public ordinal, but
  character-signal generation skips episode 0 before a provider call. This
  predates the local correction; the positive-episode signal contract was not
  expanded in this policy alignment.
- Oracle round 3 requested admin scene-count parity and exact-scope repair
  coverage. Those changes passed the combined tests reported above, but later
  producer replays still found lost exact observation provenance, numeric repair
  targeting, accepted-but-unservable scene receipts, inconsistent scene headers,
  and permissive anonymous-source suffixes. The earlier pass counts do not close
  those later regressions.
- With explicit user approval, old 5.6 run
  `20260906T064540Z-aae06c7a-10c93d` was abandoned after preserving its records and
  the separately recovered complete round-4 browser answer. Exact-session harvest
  had encountered a changed Chrome target and captured an intermediate message;
  that partial output is not a completed review. Stored history was not rewritten.
- Fresh run `20260906T154838Z-365b492e-40b717` selected GPT-6 Astra and verified
  the actual `6 Pro` composer label. Its first terminal verdict was
  `CHANGES_REQUESTED`: the reproduced issues above plus a same-number episode
  authorization gap confirmed in the current runtime function. Local corrections
  pass the combined tests above. After two same-conversation follow-ups, round 2
  returned terminal `APPROVED`; the harness run is complete and no longer owns the
  project. This approves the bounded local contract, not deployment or real-work
  semantics. No DEV/PROD
  database, environment, provider batch, deployment, or commit is authorized by
  that review. Passing synthetic tests is not deployment readiness.
- Marked observation IDs and grounding now retain canonical exact source scope.
  Same-number observations do not overwrite one another, and generation ordering
  is stable. Python and public SQL validate every grounding item's scope before
  reader filtering or selection. Partial markers and marked assets missing that
  provenance do not enter numeric legacy repair; retained exact-scoped signals
  can support deterministic rebuilding, but old observation references must not
  be guessed or silently reinterpreted.
- Scene acceptance validates canonical required/preserved actors before storing
  an accepted receipt. The existing `receipt_v1` identity is checked before a new
  constraint-bearing `receipt_v2` claim: valid accepted bytes replay unchanged;
  invalid accepted, inflight, or terminal-invalid rows remain unchanged and block.
  This one-way compatibility boundary preserves existing persisted attempts; it
  cannot be removed until an explicitly approved receipt-retirement/migration
  policy proves those attempts and old writers no longer need protection. Dynamic
  preservation constraints do not change the serving content hash by themselves.
- Astra follow-up 1 closed the reviewed provenance, metadata, anonymous-key and
  authorization findings, but found one cached-replacement preservation mismatch:
  an obsolete actor key was reintroduced after the active-row path canonicalized
  it. The local correction canonicalizes only the cached preservation addition,
  keeping raw keys for superseded-cache detection, and shares one effective actor
  set between request and serving validation. Six new cases cover fresh/v1/v2
  accepted replay and companion omission, rollback replay, no obsolete activation,
  unchanged receipt bytes/status/hash, and exact coverage 4→5. The 916-test run
  above includes this correction. Astra follow-up 2 approved it while explicitly
  distinguishing fixture-controlled rollback replay from a new actual-MySQL
  cached-replacement transaction test.
- Prepared scenes must match the authoritative public/free source's episode ID
  and number in `episode_from`, `episode_to`, and integer payload `episode_no`.
  Cached activation, producer scene coverage, repair before/after, public catalog,
  admin counts, and preview use that same rule. Generic anonymous source suffixes
  accept only canonical ASCII decimal occurrences >=2; helper tests cover 10/11
  without claiming the normalizer emits more than its existing six-item cap.
- Chat's scalar read boundary advances past a number only when every active/open
  exact episode row with that number is authorized. Actual opening/message
  fixtures cover both free/paid ID orders, the fully authorized case, and access
  decreasing after locks. Provider inputs exclude unauthorized evidence; reduced
  access stops generation/storage, and unavailable marked RP remains uncharged.
  Recall-decision and final RP calls are counted separately in these fixtures.
- Scene-receipt tests execute the actual nonblocking wrapper, including its
  default commit mode. They are combined with existing full/delta rollback tests
  and verified `commit_changes=False` call sites; a new complete full/delta replay
  beginning with a scene-invalid response was not run. Do not describe that
  combined evidence as a new end-to-end scene-invalid batch test.
- Review-transport failure mode: the remote round-3 answer completed, but its
  local collector kept waiting. After verifying the exact conversation, unchanged
  complete answer, and no active generation, only the owned local collector was
  terminated. Canonical same-run `oraclectl resume` harvested the existing answer
  and recorded a terminal verdict. The remote model was not stopped and no
  replacement prompt was sent. This recovered the review record; the collector
  defect itself is not fixed. A future hang requires the same evidence check,
  not an unverified cancellation, duplicate run, or harness-state edit.

The following earlier local v4 snapshot is retained as experiment history, not
the latest v5/v1 contract or test result:

- Dedicated character-chat readiness requires a nonempty RP example with a
  parseable episode number inside the validated read scope. The loader does not
  restore future-only examples when filtering returns nothing. Episode 0 remains
  a named compatibility case for turn examples; the opening renderer still
  excludes it. Full opening/turn parity is not established.
- Entry context uses the latest two eligible summary rows at or below the read
  boundary, allows episode-number gaps, and still requires the boundary episode.
- After session/actor locks and snapshot refresh, message handling reloads the
  product and authorization ceiling before charging or generating a reply.
- Character signals v4 uses the strict JSON schema contract. Episode summary v13
  adds the instruction to preserve original character names and invalidates v12
  summary hashes. Its lexical name-preservation measure is `diagnostic_only`:
  ordinary nouns can be candidates, so it changes neither retries nor acceptance.
  The existing lexical semantic checks are also diagnostic-only and recorded in
  `name_preservation.semantic_issues`; they no longer trigger paid retries.
  Structural/header/core-format validation and its retry behavior remain intact.
- Batch generation of unused `character_chat_internal_prompt` and
  `character_chat_opening_v1` assets was removed from the dedicated-chat pipeline;
  this does not claim deletion of existing stored assets.
- Local suite: 1658 passed, five pre-existing failures, 256 subtests passed;
  no collection errors or additional failures. Future-only, mixed, blank,
  malformed/missing/negative episode, and prologue examples were checked through
  real readiness and turn selection, without mocking readiness.
- Shadow regeneration covered 119 existing episodes numbered at most 30 across
  products 1103/1105/1137/1159 (30/30/29/30). Product 1137 has no episode 27 in
  the snapshot; episode 31 was excluded, not substituted for it. All 119 summary
  and signal rows matched their request ledger, input and provenance hashes;
  original source and prior signals were preserved.
- Two signal responses exceeded the four-action-tag schema limit. Each passed
  one identical-request retry in the experiment; invalid responses remain in the
  ledger. This experiment retry is not implemented in the production generator's
  post-parse contract validation path. The 240 physical calls cost $0.750279494954;
  including the prior experiment's conservative upper bound totals $1.280559404426.
- Offline aggregation selected `나(주인공)` for 1103 and `신미아의 동생` for
  1105, both rejected by the public display gate. It selected `아셔` for 1137 and
  `나디야` for 1159. These are observed outputs, not identity-accuracy labels;
  `RESOLVED` alone does not establish correct identity or usable chat assets.
- A subsequent display-only correction prevents a hard-blocked `possessed_as`
  target label from replacing the existing use-name. Replaying the saved signals
  selects `추종자` for 1105 and passes inventory display eligibility; the other
  three selected names remain unchanged. Synthetic tests preserve proper-name
  possession targets and keep the original body owner separate. This is an
  in-memory replay, not a published inventory or chat-readiness result.
- `persona_rename_same_person` rejects blocking identity conflicts on any selected
  row before checking role-evidence rows. Selected-only, selected-plus-generic,
  and multiple-selected cases cannot bypass that guard or absorb generic evidence.
- Source inspection for 1103 confirms a shared occupation label, not a unique
  name: its signals split the narrator between generic and named-role observations.
  The opening resolver already returns a generic role selection and therefore
  does not invoke its conflicting-claimants LLM branch. The generic display gate
  remains closed; neither a title-specific merge nor a gate bypass was applied.
- A synthetic resolver-to-aggregation regression keeps another occupation-holder's
  death evidence separate. A named observation alone does not connect it to the
  anonymous narrator; an explicit `self_reference_as` edge permits the narrator's
  proper-name identity to connect. This proves the existing contract's boundary,
  not that the real work's generated signals contain that evidence.
- No deployment, canonical inventory publication, scene/RP regeneration, or live
  chat-quality verification was performed. Identity correctness, existing public
  LKG/retirement behavior and malformed example confidence handling remain open.
