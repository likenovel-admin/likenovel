# Home Engagement Ticker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a near-real-time purple home engagement ticker between the main shortcut buttons and "인기 무료 Top".

**Architecture:** Backend owns candidate selection, visibility filtering, public copy, prioritization, and a 60-second per-process TTL cache. Service frontend fetches `/v1/query/products/home-ticker`, rotates one message every 5 seconds, refreshes data every 60 seconds only while the tab is visible, and renders the ticker between `MiddleMenu` and `FreeTop`.

**Tech Stack:** FastAPI, SQLAlchemy async raw SQL, MySQL, Next.js 14, React 18, TanStack Query, Tailwind, Node `--experimental-strip-types` contract tests, pytest.

---

## Source Facts Read Before Planning

- Home page composition is in `service/app/page.tsx`; `MiddleMenu` renders at line 234 and `FreeTop` currently renders at line 236.
- Public home product hooks live in `service/app/api/query/product/index.ts`.
- Public home product DTOs live in `service/app/api/query/product/dto.ts`.
- Public product query routes live in `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/routers/product/product_query.py`.
- Existing product visibility contracts use `p.open_yn = 'Y'`, adult filtering through `p.ratings_code = 'all'` when `adult_yn = 'N'`, and direct-recommend also checks `p.blind_yn = 'N'`.
- `tb_product` has `price_type`, `author_id`, `author_name`, `paid_open_date`, `open_yn`, `blind_yn`, `ratings_code`, and `status_code`.
- `tb_product_episode` has `episode_id`, `product_id`, `episode_no`, `episode_title`, `publish_reserve_date`, `open_yn`, `use_yn`, `created_date`, and `updated_date`.
- `tb_product_rank_snapshot_hourly` stores hourly ranking snapshots with `area_code`, `rank_no`, `product_id`, `title_snapshot`, and `author_name_snapshot`.
- `tb_product_trend_index` and `tb_product_count_variance` store `reading_rate` and `reading_rate_indicator`.
- `tb_product_ai_metadata` stores `protagonist_material_tags`.

## File Structure

- Create: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/product/home_ticker_service.py`
  - Builds ticker candidates, applies red-team filters, limits output, and owns TTL cache.
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/routers/product/product_query.py`
  - Adds `GET /v1/query/products/home-ticker`.
- Create: `likenovel-service-api/likenovel-service-api/fastapi_be_server/tests/test_home_ticker_service.py`
  - Unit tests helper behavior, SQL visibility filters, priority order, fallback, and cache copy safety.
- Modify: `service/app/api/query/product/dto.ts`
  - Adds typed ticker item/response DTOs.
- Modify: `service/app/api/query/product/index.ts`
  - Adds `useGetHomeTicker` with 60-second refetch and no background polling.
- Create: `service/components/main/HomeTicker.tsx`
  - Renders the purple ticker bar and handles 5-second rotation/pause/click behavior.
- Modify: `service/app/page.tsx`
  - Places `HomeTicker` after `MiddleMenu` and before `FreeTop`.
- Create: `service/components/main/HomeTicker.contract.test.mts`
  - Static contract test for copy, interval constants, pause handlers, and blocked internal metric terms.
- Create: `service/app/homeTickerPlacement.contract.test.mts`
  - Static placement test for home page ordering.
- Modify: `service/package.json`
  - Adds both new frontend contract tests to `test:utils`.

## Branch And Submodule Setup

- [ ] **Step 1: Confirm root branch is ticker-only**

Run:

```bash
cd /home/hongsan/work/likenovel
git status --short --branch
git diff --submodule=log -- likenovel-service-api/likenovel-service-api
git -C likenovel-service-api/likenovel-service-api status --short --branch
```

Expected:

```text
## feature/home-engagement-ticker-20260608...origin/dev
```

Root must not show unrelated modified files. If the backend submodule is detached at the root-recorded SHA, that is acceptable before backend edits.

- [ ] **Step 2: Create backend submodule branch before backend edits**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api
git fetch origin --quiet
git switch -c feature/home-engagement-ticker-20260608 origin/dev
```

Expected:

```text
Switched to a new branch 'feature/home-engagement-ticker-20260608'
```

If the branch already exists locally, run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api
git switch feature/home-engagement-ticker-20260608
```

---

### Task 1: Backend Pure Helpers And Red-Team Guards

**Files:**
- Create: `likenovel-service-api/likenovel-service-api/fastapi_be_server/tests/test_home_ticker_service.py`
- Create: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/product/home_ticker_service.py`

- [ ] **Step 1: Write failing backend helper tests**

Create `tests/test_home_ticker_service.py` with:

```python
from datetime import datetime

from app.services.product import home_ticker_service as service


def test_paid_conversion_summary_message_uses_public_copy():
    item = service.build_paid_conversion_summary_item(3)

    assert item == {
        "type": "paid_conversion_summary",
        "message": "이번 주 유료전환 작가님 3명 축하드립니다.",
        "productId": None,
        "priority": 100,
        "freshness": "weekly",
    }


def test_paid_conversion_summary_omits_zero_count():
    assert service.build_paid_conversion_summary_item(0) is None


def test_public_message_guard_blocks_internal_metric_terms():
    blocked = service.build_ticker_item(
        item_type="reader_momentum",
        message="<테스트> 작품의 연독률이 높아지고 있습니다.",
        priority=70,
        freshness="metric_snapshot",
        product_id=10,
    )

    assert blocked is None


def test_public_message_guard_accepts_reader_facing_terms():
    item = service.build_ticker_item(
        item_type="reader_momentum",
        message="<테스트>을 이어 읽는 독자가 늘고 있습니다.",
        priority=70,
        freshness="metric_snapshot",
        product_id=10,
    )

    assert item is not None
    assert item["message"] == "<테스트>을 이어 읽는 독자가 늘고 있습니다."
    assert "연독률" not in item["message"]
    assert "재유입" not in item["message"]
    assert "전환율" not in item["message"]


def test_query_window_uses_kst_week_start():
    now = datetime(2026, 6, 10, 15, 30, 0)
    week_start = service.get_kst_week_start(now)

    assert week_start == datetime(2026, 6, 8, 0, 0, 0)
```

- [ ] **Step 2: Run helper tests and verify failure**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry run python -m pytest tests/test_home_ticker_service.py -q
```

Expected: FAIL because `home_ticker_service` does not exist.

- [ ] **Step 3: Implement minimal helper functions**

Create `app/services/product/home_ticker_service.py` with:

```python
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


HOME_TICKER_REFRESH_AFTER_SECONDS = 60
HOME_TICKER_ROTATE_EVERY_MS = 5000
HOME_TICKER_LIMIT = 10
BLOCKED_PUBLIC_TERMS = ("연독률", "재유입", "전환율")


def get_kst_week_start(now: datetime | None = None) -> datetime:
    current = now or datetime.now()
    start = current - timedelta(days=current.weekday())
    return start.replace(hour=0, minute=0, second=0, microsecond=0)


def build_ticker_item(
    *,
    item_type: str,
    message: str,
    priority: int,
    freshness: str,
    product_id: int | None = None,
) -> dict[str, Any] | None:
    clean_message = message.strip()
    if not clean_message:
        return None
    if any(term in clean_message for term in BLOCKED_PUBLIC_TERMS):
        return None
    return {
        "type": item_type,
        "message": clean_message,
        "productId": product_id,
        "priority": priority,
        "freshness": freshness,
    }


def build_paid_conversion_summary_item(count: int) -> dict[str, Any] | None:
    if count <= 0:
        return None
    return build_ticker_item(
        item_type="paid_conversion_summary",
        message=f"이번 주 유료전환 작가님 {count}명 축하드립니다.",
        priority=100,
        freshness="weekly",
    )
```

- [ ] **Step 4: Run helper tests and verify pass**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry run python -m pytest tests/test_home_ticker_service.py -q
```

Expected: PASS.

---

### Task 2: Backend SQL Builders And Candidate Assembly

**Files:**
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/tests/test_home_ticker_service.py`
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/product/home_ticker_service.py`

- [ ] **Step 1: Add SQL contract tests**

Append to `tests/test_home_ticker_service.py`:

```python
def test_paid_conversion_query_filters_public_visible_products():
    query, params = service.build_paid_conversion_count_query(
        adult_yn="N",
        week_start=datetime(2026, 6, 8, 0, 0, 0),
        now=datetime(2026, 6, 10, 15, 30, 0),
    )
    sql = str(query)

    assert "COUNT(DISTINCT p.author_id)" in sql
    assert "p.price_type = 'paid'" in sql
    assert "p.paid_open_date >= :week_start" in sql
    assert "p.open_yn = 'Y'" in sql
    assert "COALESCE(p.blind_yn, 'N') = 'N'" in sql
    assert "p.ratings_code = 'all'" in sql
    assert params["week_start"] == datetime(2026, 6, 8, 0, 0, 0)


def test_recent_episode_query_requires_published_visible_episode_and_product():
    query, params = service.build_recent_episode_query(adult_yn="N")
    sql = str(query)

    assert "tb_product_episode e" in sql
    assert "e.open_yn = 'Y'" in sql
    assert "e.use_yn = 'Y'" in sql
    assert "e.publish_reserve_date <= NOW()" in sql
    assert "p.open_yn = 'Y'" in sql
    assert "COALESCE(p.blind_yn, 'N') = 'N'" in sql
    assert "p.ratings_code = 'all'" in sql
    assert params["limit"] == 5


def test_rank_query_uses_latest_free_serial_top_snapshot():
    query, _params = service.build_popular_free_top_query(adult_yn="N")
    sql = str(query)

    assert "tb_product_rank_snapshot_hourly" in sql
    assert "area_code = 'freeSerialTop'" in sql
    assert "rank_no = 1" in sql
    assert "ORDER BY basis_at DESC" in sql


def test_reader_momentum_query_uses_sample_thresholds():
    query, params = service.build_reader_momentum_query(adult_yn="N")
    sql = str(query)

    assert "tb_product_trend_index pti" in sql
    assert "tb_product_count_variance pcv" in sql
    assert "pcv.reading_rate_indicator >= :min_reading_rate_indicator" in sql
    assert "p.count_hit >= :min_count_hit" in sql
    assert params["min_reading_rate_indicator"] > 0
    assert params["min_count_hit"] >= 100
```

- [ ] **Step 2: Run SQL tests and verify failure**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry run python -m pytest tests/test_home_ticker_service.py -q
```

Expected: FAIL because SQL builder functions are missing.

- [ ] **Step 3: Implement SQL builders**

Append to `app/services/product/home_ticker_service.py`:

```python
from sqlalchemy import text
from sqlalchemy.sql.elements import TextClause


def get_adult_filter(adult_yn: str, alias: str = "p") -> str:
    return f"AND {alias}.ratings_code = 'all'" if adult_yn != "Y" else ""


def get_public_product_filter(adult_yn: str, alias: str = "p") -> str:
    adult_filter = get_adult_filter(adult_yn, alias)
    return f"""
      AND {alias}.open_yn = 'Y'
      AND COALESCE({alias}.blind_yn, 'N') = 'N'
      AND {alias}.status_code IN ('ongoing', 'end')
      {adult_filter}
    """


def build_paid_conversion_count_query(
    *, adult_yn: str, week_start: datetime, now: datetime
) -> tuple[TextClause, dict[str, Any]]:
    public_filter = get_public_product_filter(adult_yn)
    return (
        text(f"""
            SELECT COUNT(DISTINCT p.author_id) AS author_count
              FROM tb_product p
             WHERE p.price_type = 'paid'
               AND p.paid_open_date >= :week_start
               AND p.paid_open_date < :now
               {public_filter}
        """),
        {"week_start": week_start, "now": now},
    )


def build_recent_episode_query(adult_yn: str) -> tuple[TextClause, dict[str, Any]]:
    public_filter = get_public_product_filter(adult_yn)
    return (
        text(f"""
            SELECT p.product_id AS product_id
                 , p.title AS title
                 , p.author_name AS author_name
                 , e.publish_reserve_date AS published_at
              FROM tb_product_episode e
              JOIN tb_product p ON p.product_id = e.product_id
             WHERE e.open_yn = 'Y'
               AND e.use_yn = 'Y'
               AND e.publish_reserve_date IS NOT NULL
               AND e.publish_reserve_date <= NOW()
               AND e.publish_reserve_date >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
               {public_filter}
             ORDER BY e.publish_reserve_date DESC, e.episode_id DESC
             LIMIT :limit
        """),
        {"limit": 5},
    )


def build_popular_free_top_query(adult_yn: str) -> tuple[TextClause, dict[str, Any]]:
    public_filter = get_public_product_filter(adult_yn)
    return (
        text(f"""
            SELECT r.product_id AS product_id
                 , r.title_snapshot AS title
                 , r.author_name_snapshot AS author_name
                 , r.basis_at AS basis_at
              FROM tb_product_rank_snapshot_hourly r
              JOIN tb_product p ON p.product_id = r.product_id
             WHERE r.area_code = 'freeSerialTop'
               AND r.rank_no = 1
               {public_filter}
             ORDER BY basis_at DESC
             LIMIT 1
        """),
        {},
    )


def build_reader_momentum_query(adult_yn: str) -> tuple[TextClause, dict[str, Any]]:
    public_filter = get_public_product_filter(adult_yn)
    return (
        text(f"""
            SELECT p.product_id AS product_id
                 , p.title AS title
                 , pcv.reading_rate_indicator AS reading_rate_indicator
              FROM tb_product p
              JOIN tb_product_trend_index pti ON pti.product_id = p.product_id
              JOIN tb_product_count_variance pcv ON pcv.product_id = p.product_id
             WHERE pcv.reading_rate_indicator >= :min_reading_rate_indicator
               AND p.count_hit >= :min_count_hit
               {public_filter}
             ORDER BY pcv.reading_rate_indicator DESC, p.count_hit DESC
             LIMIT :limit
        """),
        {"min_reading_rate_indicator": 0.03, "min_count_hit": 100, "limit": 3},
    )
```

- [ ] **Step 4: Add candidate assembly tests**

Append to `tests/test_home_ticker_service.py`:

```python
def test_build_response_prioritizes_paid_summary_and_limits_items():
    rows = {
        "paid_count": 3,
        "episodes": [
            {"product_id": 10, "title": "회차작", "author_name": "회차작가"},
        ],
        "new_products": [],
        "popular_top": [
            {"product_id": 20, "title": "랭킹작", "author_name": "랭킹작가"},
        ],
        "reader_momentum": [
            {"product_id": 30, "title": "독자작"},
        ],
        "material_trends": [
            {"material_name": "회귀"},
        ],
    }

    response = service.build_home_ticker_response(rows, now=datetime(2026, 6, 10, 15, 30, 0))

    assert response["refreshAfterSeconds"] == 60
    assert response["rotateEveryMs"] == 5000
    assert response["items"][0]["message"] == "이번 주 유료전환 작가님 3명 축하드립니다."
    assert len(response["items"]) <= 10
    assert all("연독률" not in item["message"] for item in response["items"])


def test_build_response_uses_neutral_fallback_without_fabricated_count():
    response = service.build_home_ticker_response(
        {
            "paid_count": 0,
            "episodes": [],
            "new_products": [],
            "popular_top": [],
            "reader_momentum": [],
            "material_trends": [],
        },
        now=datetime(2026, 6, 10, 15, 30, 0),
    )

    assert response["items"] == [
        {
            "type": "fallback",
            "message": "오늘도 새로운 이야기가 라이크노벨에서 독자를 만나고 있습니다.",
            "productId": None,
            "priority": 1,
            "freshness": "fallback",
        }
    ]
```

- [ ] **Step 5: Implement candidate assembly**

Append to `app/services/product/home_ticker_service.py`:

```python
def _first_text(row: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = row.get(key)
        if value:
            return str(value).strip()
    return ""


def build_home_ticker_response(rows: dict[str, Any], *, now: datetime | None = None) -> dict[str, Any]:
    items: list[dict[str, Any]] = []

    paid_item = build_paid_conversion_summary_item(int(rows.get("paid_count") or 0))
    if paid_item:
        items.append(paid_item)

    for row in rows.get("episodes", []):
        author = _first_text(row, "author_name")
        title = _first_text(row, "title")
        product_id = row.get("product_id")
        if author and title and product_id:
            item = build_ticker_item(
                item_type="episode_upload",
                message=f"{author} 작가님이 <{title}>의 신규 회차를 업로드했습니다.",
                product_id=int(product_id),
                priority=90,
                freshness="near_real_time",
            )
            if item:
                items.append(item)

    for row in rows.get("new_products", []):
        author = _first_text(row, "author_name")
        title = _first_text(row, "title")
        product_id = row.get("product_id")
        if author and title and product_id:
            item = build_ticker_item(
                item_type="new_product",
                message=f"{author} 작가님의 신규작 <{title}>이 등록되었습니다.",
                product_id=int(product_id),
                priority=85,
                freshness="near_real_time",
            )
            if item:
                items.append(item)

    for row in rows.get("popular_top", []):
        author = _first_text(row, "author_name")
        title = _first_text(row, "title")
        product_id = row.get("product_id")
        if author and title and product_id:
            item = build_ticker_item(
                item_type="popular_free_top",
                message=f"{author} 작가님의 <{title}>이 인기무료 TOP 1위에 올랐습니다.",
                product_id=int(product_id),
                priority=80,
                freshness="ranking_snapshot",
            )
            if item:
                items.append(item)

    for row in rows.get("reader_momentum", []):
        title = _first_text(row, "title")
        product_id = row.get("product_id")
        if title and product_id:
            item = build_ticker_item(
                item_type="reader_momentum",
                message=f"<{title}>을 이어 읽는 독자가 늘고 있습니다.",
                product_id=int(product_id),
                priority=70,
                freshness="metric_snapshot",
            )
            if item:
                items.append(item)

    for row in rows.get("material_trends", []):
        material_name = _first_text(row, "material_name")
        if material_name:
            item = build_ticker_item(
                item_type="material_trend",
                message=f"최근 {material_name} 소재 작품을 찾는 독자가 늘고 있습니다.",
                priority=60,
                freshness="trend_snapshot",
            )
            if item:
                items.append(item)

    deduped: list[dict[str, Any]] = []
    seen_keys: set[tuple[str, int | None]] = set()
    for item in sorted(items, key=lambda value: value["priority"], reverse=True):
        key = (item["type"], item["productId"])
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(item)

    if not deduped:
        deduped.append(
            build_ticker_item(
                item_type="fallback",
                message="오늘도 새로운 이야기가 라이크노벨에서 독자를 만나고 있습니다.",
                priority=1,
                freshness="fallback",
            )
        )

    return {
        "asOf": (now or datetime.now()).isoformat(),
        "refreshAfterSeconds": HOME_TICKER_REFRESH_AFTER_SECONDS,
        "rotateEveryMs": HOME_TICKER_ROTATE_EVERY_MS,
        "items": deduped[:HOME_TICKER_LIMIT],
    }
```

- [ ] **Step 6: Run backend tests and verify pass**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry run python -m pytest tests/test_home_ticker_service.py -q
```

Expected: PASS.

---

### Task 3: Backend Endpoint And TTL Cache

**Files:**
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/product/home_ticker_service.py`
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/routers/product/product_query.py`
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/tests/test_home_ticker_service.py`

- [ ] **Step 1: Add cache copy-safety test**

Append to `tests/test_home_ticker_service.py`:

```python
def test_cache_returns_deep_copy_so_callers_cannot_mutate_cached_response():
    service.reset_home_ticker_cache_for_tests()
    payload = {
        "asOf": "2026-06-10T15:30:00",
        "refreshAfterSeconds": 60,
        "rotateEveryMs": 5000,
        "items": [
            {
                "type": "fallback",
                "message": "오늘도 새로운 이야기가 라이크노벨에서 독자를 만나고 있습니다.",
                "productId": None,
                "priority": 1,
                "freshness": "fallback",
            }
        ],
    }

    service.set_home_ticker_cache_for_tests("adult:N", payload, now_monotonic=100.0)
    first = service.get_cached_home_ticker("adult:N", now_monotonic=110.0)
    assert first is not None
    first["items"][0]["message"] = "mutated"

    second = service.get_cached_home_ticker("adult:N", now_monotonic=111.0)
    assert second["items"][0]["message"] == "오늘도 새로운 이야기가 라이크노벨에서 독자를 만나고 있습니다."
```

- [ ] **Step 2: Implement cache helpers and async endpoint service**

Append to `app/services/product/home_ticker_service.py`:

```python
import copy
import time

from sqlalchemy.ext.asyncio import AsyncSession


HOME_TICKER_CACHE_TTL_SECONDS = 60
_HOME_TICKER_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


def build_cache_key(adult_yn: str) -> str:
    return f"adult:{'Y' if adult_yn == 'Y' else 'N'}"


def get_cached_home_ticker(cache_key: str, *, now_monotonic: float | None = None) -> dict[str, Any] | None:
    current = now_monotonic if now_monotonic is not None else time.monotonic()
    cached = _HOME_TICKER_CACHE.get(cache_key)
    if not cached:
        return None
    cached_at, payload = cached
    if current - cached_at >= HOME_TICKER_CACHE_TTL_SECONDS:
        return None
    return copy.deepcopy(payload)


def set_home_ticker_cache_for_tests(
    cache_key: str, payload: dict[str, Any], *, now_monotonic: float
) -> None:
    _HOME_TICKER_CACHE[cache_key] = (now_monotonic, copy.deepcopy(payload))


def reset_home_ticker_cache_for_tests() -> None:
    _HOME_TICKER_CACHE.clear()


async def _scalar_int(db: AsyncSession, query: TextClause, params: dict[str, Any]) -> int:
    result = await db.execute(query, params)
    row = result.mappings().one_or_none()
    if not row:
        return 0
    return int(row.get("author_count") or 0)


async def _list_rows(db: AsyncSession, query: TextClause, params: dict[str, Any]) -> list[dict[str, Any]]:
    result = await db.execute(query, params)
    return [dict(row) for row in result.mappings().all()]


async def get_home_ticker(*, adult_yn: str, db: AsyncSession) -> dict[str, Any]:
    cache_key = build_cache_key(adult_yn)
    cached = get_cached_home_ticker(cache_key)
    if cached is not None:
        return cached

    now = datetime.now()
    week_start = get_kst_week_start(now)
    paid_query, paid_params = build_paid_conversion_count_query(
        adult_yn=adult_yn,
        week_start=week_start,
        now=now,
    )
    episode_query, episode_params = build_recent_episode_query(adult_yn)
    popular_query, popular_params = build_popular_free_top_query(adult_yn)
    reader_query, reader_params = build_reader_momentum_query(adult_yn)

    rows = {
        "paid_count": await _scalar_int(db, paid_query, paid_params),
        "episodes": await _list_rows(db, episode_query, episode_params),
        "new_products": [],
        "popular_top": await _list_rows(db, popular_query, popular_params),
        "reader_momentum": await _list_rows(db, reader_query, reader_params),
        "material_trends": [],
    }
    payload = build_home_ticker_response(rows, now=now)
    _HOME_TICKER_CACHE[cache_key] = (time.monotonic(), copy.deepcopy(payload))
    return copy.deepcopy(payload)
```

This first pass intentionally leaves `new_products` and `material_trends` empty until their query contracts are added in Task 4. The endpoint still returns useful paid summary, recent episode, ranking, and reader momentum messages.

- [ ] **Step 3: Wire product query route**

In `app/routers/product/product_query.py`, add the service import near existing product service imports:

```python
from app.services.product import home_ticker_service
```

Add route near the other public product home routes:

```python
@router.get(
    "/home-ticker",
    tags=["작품"],
    responses={200: {"description": "메인 실시간 인게이지먼트 전광판 조회"}},
    dependencies=[Depends(analysis_logger)],
)
async def get_home_ticker(
    adult_yn: str = Query("N", description="성인등급 작품 포함 여부 (Y/N)"),
    db: AsyncSession = Depends(get_likenovel_db),
):
    return await home_ticker_service.get_home_ticker(adult_yn=adult_yn, db=db)
```

- [ ] **Step 4: Run backend endpoint-adjacent tests**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry run python -m pytest tests/test_home_ticker_service.py tests/test_home_card_product_select.py tests/test_product_managed_top_rules.py -q
```

Expected: PASS.

---

### Task 4: Backend New-Product And Material-Trend Candidates

**Files:**
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/tests/test_home_ticker_service.py`
- Modify: `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/services/product/home_ticker_service.py`

- [ ] **Step 1: Add SQL tests for new products and material trends**

Append to `tests/test_home_ticker_service.py`:

```python
def test_new_product_query_uses_recent_visible_products():
    query, params = service.build_new_product_query(adult_yn="N")
    sql = str(query)

    assert "FROM tb_product p" in sql
    assert "p.created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)" in sql
    assert "p.open_yn = 'Y'" in sql
    assert "COALESCE(p.blind_yn, 'N') = 'N'" in sql
    assert "p.ratings_code = 'all'" in sql
    assert params["limit"] == 3


def test_material_trend_query_uses_ai_metadata_and_sample_thresholds():
    query, params = service.build_material_trend_query(adult_yn="N")
    sql = str(query)

    assert "tb_product_ai_metadata m" in sql
    assert "m.protagonist_material_tags" in sql
    assert "tb_product_count_variance pcv" in sql
    assert "p.count_hit >= :min_count_hit" in sql
    assert params["min_count_hit"] >= 100
    assert params["limit"] == 3
```

- [ ] **Step 2: Implement query builders**

Append to `app/services/product/home_ticker_service.py`:

```python
def build_new_product_query(adult_yn: str) -> tuple[TextClause, dict[str, Any]]:
    public_filter = get_public_product_filter(adult_yn)
    return (
        text(f"""
            SELECT p.product_id AS product_id
                 , p.title AS title
                 , p.author_name AS author_name
              FROM tb_product p
             WHERE p.created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
               {public_filter}
             ORDER BY p.created_date DESC, p.product_id DESC
             LIMIT :limit
        """),
        {"limit": 3},
    )


def build_material_trend_query(adult_yn: str) -> tuple[TextClause, dict[str, Any]]:
    public_filter = get_public_product_filter(adult_yn)
    return (
        text(f"""
            SELECT JSON_UNQUOTE(JSON_EXTRACT(m.protagonist_material_tags, '$[0]')) AS material_name
                 , COUNT(*) AS product_count
                 , SUM(COALESCE(pcv.count_hit_indicator, 0)) AS hit_momentum
              FROM tb_product p
              JOIN tb_product_ai_metadata m ON m.product_id = p.product_id
              JOIN tb_product_count_variance pcv ON pcv.product_id = p.product_id
             WHERE m.protagonist_material_tags IS NOT NULL
               AND JSON_VALID(m.protagonist_material_tags)
               AND JSON_LENGTH(m.protagonist_material_tags) > 0
               AND p.count_hit >= :min_count_hit
               AND COALESCE(pcv.count_hit_indicator, 0) > 0
               {public_filter}
             GROUP BY material_name
            HAVING material_name IS NOT NULL
               AND material_name != ''
               AND COUNT(*) >= :min_product_count
             ORDER BY hit_momentum DESC, product_count DESC
             LIMIT :limit
        """),
        {"min_count_hit": 100, "min_product_count": 2, "limit": 3},
    )
```

- [ ] **Step 3: Add both queries to `get_home_ticker`**

In `get_home_ticker`, add:

```python
new_product_query, new_product_params = build_new_product_query(adult_yn)
material_query, material_params = build_material_trend_query(adult_yn)
```

Replace the empty rows:

```python
"new_products": await _list_rows(db, new_product_query, new_product_params),
"material_trends": await _list_rows(db, material_query, material_params),
```

- [ ] **Step 4: Run backend tests**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry run python -m pytest tests/test_home_ticker_service.py -q
```

Expected: PASS.

---

### Task 5: Frontend DTO And Query Hook

**Files:**
- Modify: `service/app/api/query/product/dto.ts`
- Modify: `service/app/api/query/product/index.ts`
- Create: `service/components/main/HomeTicker.contract.test.mts`

- [ ] **Step 1: Add frontend contract test for hook and DTO names**

Create `service/components/main/HomeTicker.contract.test.mts` with:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dtoSource = readFileSync(
  new URL("../../app/api/query/product/dto.ts", import.meta.url),
  "utf8",
);
const querySource = readFileSync(
  new URL("../../app/api/query/product/index.ts", import.meta.url),
  "utf8",
);

assert.match(dtoSource, /export interface IHomeTickerItem/);
assert.match(dtoSource, /message: string/);
assert.match(dtoSource, /productId: number \| null/);
assert.match(dtoSource, /export interface IHomeTickerResponse/);
assert.match(querySource, /useGetHomeTicker/);
assert.match(querySource, /\/v1\/query\/products\/home-ticker\?adult_yn=\$\{adultYnParam\}/);
assert.match(querySource, /refetchInterval: HOME_TICKER_REFETCH_INTERVAL_MS/);
assert.match(querySource, /refetchIntervalInBackground: false/);
```

- [ ] **Step 2: Run frontend contract test and verify failure**

Run:

```bash
cd /home/hongsan/work/likenovel/service
node --experimental-strip-types components/main/HomeTicker.contract.test.mts
```

Expected: FAIL because DTO/hook are missing.

- [ ] **Step 3: Add DTOs**

Append to `service/app/api/query/product/dto.ts`:

```ts
export interface IHomeTickerItem {
  type:
    | "paid_conversion_summary"
    | "episode_upload"
    | "new_product"
    | "popular_free_top"
    | "reader_momentum"
    | "material_trend"
    | "fallback";
  message: string;
  productId: number | null;
  priority: number;
  freshness:
    | "weekly"
    | "near_real_time"
    | "ranking_snapshot"
    | "metric_snapshot"
    | "trend_snapshot"
    | "fallback";
}

export interface IHomeTickerResponse {
  asOf: string;
  refreshAfterSeconds: number;
  rotateEveryMs: number;
  items: IHomeTickerItem[];
}
```

- [ ] **Step 4: Add query hook**

In `service/app/api/query/product/index.ts`, add `IHomeTickerResponse` to the DTO import list and append:

```ts
export const HOME_TICKER_REFETCH_INTERVAL_MS = 60 * 1000;

export const useGetHomeTicker = (
  adult_yn?: string,
  enabled: boolean = true,
  cacheIdentity: string = "guest",
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IHomeTickerResponse>({
    queryKey: ["getHomeTicker", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/home-ticker?adult_yn=${adultYnParam}`,
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    refetchInterval: HOME_TICKER_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    enabled,
  });
};
```

- [ ] **Step 5: Run frontend hook test**

Run:

```bash
cd /home/hongsan/work/likenovel/service
node --experimental-strip-types components/main/HomeTicker.contract.test.mts
```

Expected: PASS.

---

### Task 6: Frontend HomeTicker Component And Placement

**Files:**
- Modify: `service/components/main/HomeTicker.contract.test.mts`
- Create: `service/components/main/HomeTicker.tsx`
- Create: `service/app/homeTickerPlacement.contract.test.mts`
- Modify: `service/app/page.tsx`
- Modify: `service/package.json`

- [ ] **Step 1: Extend frontend contract tests**

Append to `service/components/main/HomeTicker.contract.test.mts`:

```ts
const componentSource = readFileSync(new URL("./HomeTicker.tsx", import.meta.url), "utf8");

assert.match(componentSource, /LIVE/);
assert.match(componentSource, /rotateEveryMs \?\? 5000/);
assert.match(componentSource, /onMouseEnter=\{\(\) => setPaused\(true\)\}/);
assert.match(componentSource, /onMouseLeave=\{\(\) => setPaused\(false\)\}/);
assert.match(componentSource, /onFocus=\{\(\) => setPaused\(true\)\}/);
assert.match(componentSource, /onBlur=\{\(\) => setPaused\(false\)\}/);
assert.doesNotMatch(componentSource, /연독률|재유입|전환율/);
```

Create `service/app/homeTickerPlacement.contract.test.mts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

const importIndex = source.indexOf('import HomeTicker from "@/components/main/HomeTicker";');
const middleMenuIndex = source.indexOf("<MiddleMenu />");
const homeTickerIndex = source.indexOf("<HomeTicker");
const freeTopIndex = source.indexOf("<FreeTop");

assert.notEqual(importIndex, -1, "Home page should import HomeTicker");
assert.notEqual(middleMenuIndex, -1, "Home page should render MiddleMenu");
assert.notEqual(homeTickerIndex, -1, "Home page should render HomeTicker");
assert.notEqual(freeTopIndex, -1, "Home page should render FreeTop");
assert.equal(
  middleMenuIndex < homeTickerIndex && homeTickerIndex < freeTopIndex,
  true,
  "HomeTicker should render between shortcut buttons and 인기 무료 Top",
);
```

- [ ] **Step 2: Run placement/component tests and verify failure**

Run:

```bash
cd /home/hongsan/work/likenovel/service
node --experimental-strip-types components/main/HomeTicker.contract.test.mts
node --experimental-strip-types app/homeTickerPlacement.contract.test.mts
```

Expected: FAIL because `HomeTicker.tsx` and placement are missing.

- [ ] **Step 3: Implement `HomeTicker.tsx`**

Create `service/components/main/HomeTicker.tsx`:

```tsx
"use client";

import { useGetHomeTicker } from "@/app/api/query/product";
import type { IHomeTickerItem } from "@/app/api/query/product/dto";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface HomeTickerProps {
  adultYn: string;
  enabled: boolean;
  cacheIdentity: string;
}

const DEFAULT_ROTATE_EVERY_MS = 5000;

const HomeTicker = ({ adultYn, enabled, cacheIdentity }: HomeTickerProps) => {
  const router = useRouter();
  const { data } = useGetHomeTicker(adultYn, enabled, cacheIdentity);
  const items = useMemo<IHomeTickerItem[]>(() => data?.items ?? [], [data]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rotateEveryMs = data?.rotateEveryMs ?? 5000;

  useEffect(() => {
    if (currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, items.length]);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % items.length);
    }, rotateEveryMs ?? DEFAULT_ROTATE_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [items.length, paused, rotateEveryMs]);

  const currentItem = items[currentIndex];
  if (!currentItem) {
    return null;
  }

  const handleClick = () => {
    if (!currentItem.productId) return;
    setPendingProductDetailEntrySource(
      currentItem.productId,
      PRODUCT_DETAIL_ENTRY_SOURCE.HOME_BOTTOM_SUGGEST,
    );
    router.push(buildProductDetailPath(currentItem.productId));
  };

  return (
    <section
      className="w-full px-16pxr md:px-0 mt-24pxr md:mt-30pxr"
      aria-label="라이크노벨 라이브 소식"
    >
      <button
        type="button"
        className="w-full h-44pxr md:h-48pxr rounded-[8px] bg-[#5B2AC8] px-14pxr md:px-20pxr flex items-center gap-10pxr text-left overflow-hidden disabled:cursor-default"
        onClick={handleClick}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        disabled={!currentItem.productId}
      >
        <span className="shrink-0 rounded-full bg-white/18 px-8pxr py-3pxr text-11pxr md:text-12pxr font-bold text-white">
          LIVE
        </span>
        <span className="min-w-0 flex-1 truncate text-14pxr md:text-16pxr font-semibold text-white">
          {currentItem.message}
        </span>
      </button>
    </section>
  );
};

export default HomeTicker;
```

- [ ] **Step 4: Place component in home page**

In `service/app/page.tsx`, add import:

```tsx
import HomeTicker from "@/components/main/HomeTicker";
```

Render after `MiddleMenu`:

```tsx
<MiddleMenu />
<HomeTicker
  adultYn={adultYn}
  enabled={homeQueryState.enabled}
  cacheIdentity={mainProductCacheIdentity}
/>
<div className="flex flex-col mt-30pxr md:mt-80pxr gap-70pxr">
  <FreeTop data={freeTopProducts} />
  <RecentlyView />
</div>
```

- [ ] **Step 5: Add tests to `test:utils`**

In `service/package.json`, insert both commands in the `test:utils` script near other main/home tests:

```json
"node --experimental-strip-types components/main/HomeTicker.contract.test.mts && node --experimental-strip-types app/homeTickerPlacement.contract.test.mts"
```

- [ ] **Step 6: Run frontend tests**

Run:

```bash
cd /home/hongsan/work/likenovel/service
node --experimental-strip-types components/main/HomeTicker.contract.test.mts
node --experimental-strip-types app/homeTickerPlacement.contract.test.mts
yarn test:utils
```

Expected: PASS.

---

### Task 7: Full Verification And Commit Scope

**Files:**
- Backend files from Tasks 1-4.
- Frontend files from Tasks 5-6.
- Root submodule pointer only after backend commit is pushed or intentionally retained for local review.

- [ ] **Step 1: Run backend focused tests**

Run:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api/fastapi_be_server
poetry run python -m pytest tests/test_home_ticker_service.py tests/test_home_card_product_select.py tests/test_product_managed_top_rules.py -q
```

Expected: PASS.

- [ ] **Step 2: Run frontend focused tests**

Run:

```bash
cd /home/hongsan/work/likenovel/service
node --experimental-strip-types components/main/HomeTicker.contract.test.mts
node --experimental-strip-types app/homeTickerPlacement.contract.test.mts
yarn test:utils
```

Expected: PASS.

- [ ] **Step 3: Build service**

Run:

```bash
cd /home/hongsan/work/likenovel/service
yarn build
```

Expected: PASS.

- [ ] **Step 4: Local browser verification**

Run:

```bash
cd /home/hongsan/work/likenovel
docker compose up -d --build service
docker ps
curl -fsS http://localhost:3000 >/tmp/likenovel-home.html
```

Expected:

- `likenovel-service-local` is running.
- `curl` exits 0.
- Browser check at `http://localhost:3000` shows the purple ticker between shortcut buttons and "인기 무료 Top".
- The visible message rotates about every 5 seconds.
- Hover/focus pauses rotation.
- No visible copy contains `연독률`, `재유입`, or `전환율`.

- [ ] **Step 5: API readback**

Run against the local backend channel available in the environment:

```bash
curl -fsS "http://localhost:3010/v1/query/products/home-ticker?adult_yn=N"
```

Expected response shape:

```json
{
  "asOf": "2026-06-08T00:00:00",
  "refreshAfterSeconds": 60,
  "rotateEveryMs": 5000,
  "items": [
    {
      "type": "paid_conversion_summary",
      "message": "이번 주 유료전환 작가님 3명 축하드립니다.",
      "productId": null,
      "priority": 100,
      "freshness": "weekly"
    }
  ]
}
```

The exact count must come from DB. Do not report `3명` unless the API readback actually returns `3명`.

- [ ] **Step 6: Exact staging**

Branch purpose sentence:

```text
이 브랜치는 메인 홈 숏컷과 인기 무료 Top 사이에 near-real-time 인게이지먼트 전광판을 추가한다.
```

Run:

```bash
cd /home/hongsan/work/likenovel
git status --short --branch
git diff --submodule=log -- likenovel-service-api/likenovel-service-api
git -C likenovel-service-api/likenovel-service-api status --short --branch
```

Stage only exact files:

```bash
cd /home/hongsan/work/likenovel/likenovel-service-api/likenovel-service-api
git add fastapi_be_server/app/services/product/home_ticker_service.py fastapi_be_server/app/routers/product/product_query.py fastapi_be_server/tests/test_home_ticker_service.py
git commit -m "feat: add home engagement ticker api"

cd /home/hongsan/work/likenovel
git add service/app/api/query/product/dto.ts service/app/api/query/product/index.ts service/components/main/HomeTicker.tsx service/components/main/HomeTicker.contract.test.mts service/app/homeTickerPlacement.contract.test.mts service/app/page.tsx service/package.json likenovel-service-api/likenovel-service-api
git commit -m "feat: add home engagement ticker"
```

Before committing the root submodule pointer, verify:

```bash
cd /home/hongsan/work/likenovel
git diff --cached --name-only
git diff --cached --submodule=log -- likenovel-service-api/likenovel-service-api
git show --stat HEAD
```

Expected: no unrelated files, and submodule pointer points to the backend ticker commit.

## Red-Team Stop Conditions

- Stop if the API exposes adult/blind/private/unapproved product names to `adult_yn=N`.
- Stop if any public message contains `연독률`, `재유입`, `전환율`, internal IDs, emails, or account names.
- Stop if a low-sample metric can produce "늘고 있습니다"; enforce `p.count_hit >= 100` and positive indicator thresholds.
- Stop if the endpoint queries heavy detail joins from product detail paths; keep the ticker service query-only and narrow.
- Stop if the root branch contains `AGENTS.md`, unrelated docs, ai-consent files, or unrelated submodule pointer drift.
- Stop if API readback does not match frontend DTO shape.
- Stop if browser verification is skipped; report it as `미검증` rather than calling the feature complete.
