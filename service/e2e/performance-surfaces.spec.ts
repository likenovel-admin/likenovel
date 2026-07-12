import { expect, test, type Page } from "@playwright/test";

type RequestCounters = {
  eventList: string[];
  eventProducts: number;
  search: string[];
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
      counters.search.push(
        (url.searchParams.get("keyword") ?? "") +
          ":" +
          (url.searchParams.get("orderby") ?? "")
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { products: [makeProduct(201)], events: [] },
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

    if (path === "/v1/query/user") {
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
  expect(counters.unexpected).toEqual([]);
});

test("search modal opens before its supporting content finishes loading", async ({
  page,
}) => {
  const counters = createCounters();
  await installApiMock(page, counters);

  await page.goto("/product/event");
  await expect(page.getByText("진행 이벤트 E2E")).toBeVisible();
  await page
    .locator('button:has(svg[viewBox="0 0 20 20"])')
    .first()
    .click();

  await expect(page.getByText("통합검색", { exact: true })).toBeVisible();
  await expect(
    page.getByPlaceholder("작품명, 작가명, 태그입력")
  ).toBeVisible();
  await expect
    .poll(() => [...counters.modalDeferred].sort())
    .toEqual(["suggest", "trending", "weekly"]);
  await page.waitForTimeout(500);

  expect([...counters.modalDeferred].sort()).toEqual([
    "suggest",
    "trending",
    "weekly",
  ]);
  expect(counters.unexpected).toEqual([]);
});

test("search keeps sort state, avoids duplicate results, and debounces input", async ({
  page,
}) => {
  const counters = createCounters();
  await installApiMock(page, counters);

  await page.goto(
    "/product/search/result/normal?keyword=%ED%85%8C%EC%8A%A4%ED%8A%B8"
  );
  await expect.poll(() => counters.search).toEqual(["테스트:update"]);

  const viewOrderButton = page.getByRole("button", { name: "조회 순" });
  await viewOrderButton.click();
  await expect
    .poll(() => counters.search)
    .toEqual(["테스트:update", "테스트:view"]);
  await expect(viewOrderButton).toHaveClass(/font-semibold/);

  const input = page.getByPlaceholder("작품명, 작가명, 태그입력");
  await page.waitForTimeout(350);
  expect(counters.autocomplete).toEqual([]);
  await input.fill("");
  await page.waitForTimeout(350);
  await input.pressSequentially("abcd", { delay: 50 });

  await expect.poll(() => counters.autocomplete).toEqual(["abcd"]);
  await page.waitForTimeout(500);

  expect(counters.search).toEqual(["테스트:update", "테스트:view"]);
  expect(counters.autocomplete).toEqual(["abcd"]);
  expect(counters.unexpected).toEqual([]);
});
