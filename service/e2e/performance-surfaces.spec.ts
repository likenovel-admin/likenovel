import { expect, test, type Page } from "@playwright/test";

type RequestCounters = {
  eventList: string[];
  eventProducts: number;
  search: string[];
  searchParams: string[];
  autocomplete: string[];
  modalDeferred: string[];
  unexpected: string[];
};

const progressEvent = {
  id: 1,
  title: "진행 이벤트 E2E",
  start_date: "2026-01-01T00:00:00",
  end_date: "2027-01-01T00:00:00",
  thumbnail_image_path: "/images/default-cover.png",
};

const endedEvent = {
  ...progressEvent,
  id: 2,
  title: "종료 이벤트 E2E",
  end_date: "2025-01-01T00:00:00",
};

const makeProduct = (productId: number) => ({
  productId,
  title: `이벤트 작품 ${productId}`,
  adultYn: "N",
  authorNickname: "테스트 작가",
  priceType: "paid",
  rank: { currentRank: 0, rankIndicator: 0 },
  genre: [],
  keywords: [],
  image: {
    coverImagePath: "",
    adultDefaultcoverImagePath: "",
  },
  totalOpenEpisodeCount: 10,
  authorId: 1,
  remainingNotificationCount: 0,
  interestStatus: "no_interest",
});

const installApiMock = async (
  page: Page,
  counters: RequestCounters,
  productGate?: Promise<void>
) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, "");

    if (path === "/v1/query/events") {
      const closeYn = url.searchParams.get("close_yn") === "Y" ? "Y" : "N";
      counters.eventList.push(closeYn);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: closeYn === "Y" ? [endedEvent] : [progressEvent] }),
      });
    }

    if (path === "/v1/query/events/2") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: 2,
            title: "이벤트 상세 E2E",
            account_name: "이벤트 작품",
            product_ids: "[101, 102]",
            detail_image_path: "/images/default-cover.png",
            information: "",
          },
        }),
      });
    }

    const productMatch = path.match(
      /^\/v1\/query\/products\/(\d+)\/details-group$/
    );
    if (productMatch) {
      counters.eventProducts += 1;
      if (productGate) await productGate;
      const productId = Number(productMatch[1]);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { product: makeProduct(productId) } }),
      });
    }

    if (path === "/v1/query/search") {
      counters.searchParams.push(url.search);
      counters.search.push(
        (url.searchParams.get("keyword") ?? "") +
          ":" +
          (url.searchParams.get("orderby") ?? "")
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            products: url.searchParams.get("keyword") === "없음" || Number(url.searchParams.get("page") || 1) > 3 ? [] : [{ ...makeProduct(201), synopsis: "퇴마사가 사건을 해결하는 이야기", searchMatchReasons: ["주인공 목표: 퇴마"] }],
            events: [], quests: [],
            totalCount: url.searchParams.get("keyword") === "없음" ? 0 : 21,
            facets: [{ id: "dna:goal:퇴마", label: "퇴마", group: "주인공 목표", count: 12 }, { id: "keyword:17", label: "미스터리", group: "작품 태그", count: 3 }],
            selectedTags: [{ id: "dna:goal:퇴마", label: "퇴마", group: "주인공 목표" }, { id: "keyword:17", label: "미스터리", group: "작품 태그" }],
            page: Number(url.searchParams.get("page") || 1), pageSize: Number(url.searchParams.get("limit") || 10),
          },
        }),
      });
    }

    if (path === "/v1/query/search/autocomplete") {
      counters.autocomplete.push(url.searchParams.get("keyword") ?? "");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    }

    if (path === "/v1/query/search/trending-keywords") {
      counters.modalDeferred.push("trending");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    }

    if (path === "/v1/query/search/weekly-most-searched") {
      counters.modalDeferred.push("weekly");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    }

    if (path === "/v1/query/products/suggest-by-recent-viewed") {
      counters.modalDeferred.push("suggest");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    }

    if (path === "/v1/query/user" || path === "/v1/query/notices/top-bar") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null }),
      });
    }

    if (
      path === "/v1/query/notices/rolling-notices" ||
      path === "/v1/command/statistics/page-view" ||
      path === "/v1/command/statistics/page-dwell"
    ) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    }

    counters.unexpected.push(`${request.method()} ${path}`);
    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Unexpected E2E API request" }),
    });
  });
};

const createCounters = (): RequestCounters => ({
  eventList: [],
  eventProducts: 0,
  search: [],
  searchParams: [],
  autocomplete: [],
  modalDeferred: [],
  unexpected: [],
});

test("event tabs request each dataset once and reuse the cached progress list", async ({
  page,
}) => {
  const counters = createCounters();
  await installApiMock(page, counters);

  await page.goto("/product/event");
  await expect(page.getByText("진행 이벤트 E2E")).toBeVisible();
  await page.getByRole("button", { name: "종료된 이벤트" }).click();
  await expect(page.getByText("종료 이벤트 E2E")).toBeVisible();
  await page.getByRole("button", { name: "진행중인 이벤트" }).click();
  await expect(page.getByText("진행 이벤트 E2E")).toBeVisible();
  await page.waitForTimeout(500);

  expect(counters.eventList).toEqual(["N", "Y"]);
  expect(counters.unexpected).toEqual([]);
});

test("event detail keeps its header visible while product cards are loading", async ({
  page,
}) => {
  const counters = createCounters();
  let releaseProducts = () => {};
  const productGate = new Promise<void>((resolve) => {
    releaseProducts = resolve;
  });
  await installApiMock(page, counters, productGate);

  try {
    await page.goto("/product/event/2");
    await expect.poll(() => counters.eventProducts).toBe(2);
    await expect(
      page.getByRole("img", { name: "이벤트 상세 E2E" })
    ).toHaveAttribute("fetchpriority", "high");
    await expect(page.getByRole("heading", { name: "이벤트 작품" })).toBeVisible();
  } finally {
    releaseProducts();
  }

  await expect(
    page.locator("span:visible").filter({ hasText: /^이벤트 작품 101$/ })
  ).toBeVisible();
  await expect(
    page.locator("span:visible").filter({ hasText: /^이벤트 작품 102$/ })
  ).toBeVisible();
  await page.getByRole("button", { name: "목록" }).click();
  await expect(page).toHaveURL("/product/event");
  expect(counters.unexpected).toEqual([]);
});

test("search modal loads asset facets without popularity or history requests", async ({ page }) => {
  const counters = createCounters();
  await installApiMock(page, counters);
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/v1/query/search?**", async (route) => { await gate; await route.fallback(); });
  await page.goto("/product/event");
  const opener = page.locator('button:visible:has(svg[viewBox="0 0 20 20"])').first();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "작품 찾기" });
  try {
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("작품을 찾고 있습니다…")).toBeVisible();
    await expect(dialog.getByRole("searchbox")).toBeVisible();
  } finally { release(); }
  await dialog.getByRole("button", { name: "퇴마", exact: true }).click();
  await expect(dialog.getByText("주인공 목표: 퇴마", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "퇴마 조건 해제" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(counters.modalDeferred).toEqual([]);
  expect(counters.autocomplete).toEqual([]);
  expect(counters.unexpected).toEqual([]);
});

test("search preserves tags, sort and pagination in the URL and handles empty results", async ({ page }) => {
  const counters = createCounters();
  await installApiMock(page, counters);
  await page.goto("/product/search/result/normal?keyword=테스트");
  await expect.poll(() => counters.search).toEqual(["테스트:relevance"]);
  await page.getByRole("combobox", { name: "정렬" }).selectOption("update");
  await expect(page).toHaveURL(/orderby=update/);
  await page.getByRole("button", { name: "조건 좁히기", exact: true }).click();
  await page.getByRole("button", { name: "퇴마", exact: true }).click();
  await expect(page.getByRole("button", { name: "퇴마 조건 해제" })).toBeVisible();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  expect(new URL(page.url()).searchParams.get("tag")).toBe("dna:goal:퇴마");
  await page.goBack();
  await expect(page.getByText("1 / 3", { exact: true })).toBeVisible();
  await page.getByRole("searchbox").fill("없음");
  await expect(page.getByText("조건에 맞는 작품이 없습니다.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "퇴마 조건 해제" }).click();
  await expect(page.getByRole("button", { name: "퇴마 조건 해제" })).not.toBeVisible();
  expect(counters.unexpected).toEqual([]);
});

test("search debounces input, waits for Korean composition and safely encodes the submitted query", async ({ page }) => {
  const counters = createCounters();
  await installApiMock(page, counters);
  await page.goto("/product/search/result/normal?keyword=테스트");
  await expect.poll(() => counters.search.length).toBe(1);
  const input = page.getByRole("searchbox");
  await input.dispatchEvent("compositionstart");
  await input.fill("퇴");
  await page.waitForTimeout(400);
  expect(counters.search).toEqual(["테스트:relevance"]);
  await input.fill("퇴마 & 미스터리+");
  await input.dispatchEvent("compositionend");
  await expect.poll(() => counters.search.length).toBe(2);
  await input.press("Enter");
  await expect.poll(() => new URL(page.url()).searchParams.get("keyword")).toBe("퇴마 & 미스터리+");
  expect(counters.autocomplete).toEqual([]);
  expect(counters.unexpected).toEqual([]);
});

test("search reports request failure and supports retry", async ({ page }) => {
  const counters = createCounters();
  await installApiMock(page, counters);
  let fail = true;
  await page.route("**/api/v1/query/search?**", (route) => fail
    ? route.fulfill({ status: 500, contentType: "application/json", body: '{}' })
    : route.fallback());
  await page.goto("/product/search/result/normal?keyword=테스트");
  await expect(page.getByRole("alert").filter({ hasText: "작품을 불러오지 못했습니다." })).toBeVisible({ timeout: 15000 });
  fail = false;
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByText("이벤트 작품 201", { exact: true })).toBeVisible();
});


test("desktop search keeps keyboard focus inside and carries facets to full results", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const counters = createCounters();
  await installApiMock(page, counters);
  await page.goto("/product/event");
  await page.locator('button:visible:has(svg[viewBox="0 0 20 20"])').first().click();
  const dialog = page.getByRole("dialog", { name: "작품 찾기" });
  await expect(dialog.getByRole("searchbox")).toBeFocused();
  await dialog.getByRole("button", { name: "퇴마", exact: true }).click();
  await expect(dialog.getByText("주인공 목표: 퇴마", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "검색 닫기" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "전체 21개 작품 보기" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "검색 닫기" })).toBeFocused();
  await dialog.getByRole("button", { name: "전체 21개 작품 보기" }).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe("dna:goal:퇴마");
  await expect(page.getByText("주인공 목표: 퇴마", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(counters.unexpected).toEqual([]);
});

test("search recovers from a stale page link and redirects legacy story links", async ({ page }) => {
  const counters = createCounters();
  await installApiMock(page, counters);
  await page.goto("/product/search/result/normal?keyword=공포&page=999");
  await page.getByRole("button", { name: "첫 페이지로" }).click();
  await expect(page.getByText("이벤트 작품 201", { exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "정렬" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/product/search/result/story?keyword=퇴마%20공포");
  await expect(page).toHaveURL(/result\/normal/);
  await expect(page.getByRole("searchbox")).toHaveValue("퇴마 공포");
  expect(counters.unexpected).toEqual([]);
});
