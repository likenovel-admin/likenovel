import { expect, test, type Page, type TestInfo } from "@playwright/test";

const diagnostics = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }, info) => {
  const messages = diagnostics.get(page) || [];
  await info.attach("console-warnings-and-errors", { body: JSON.stringify(messages), contentType: "application/json" });
  expect(messages.filter(message => !message.includes("net::ERR_FAILED"))).toEqual([]);
});

const groupNames = ["작품 태그", "세계관", "주인공 목표", "주인공 유형", "주인공 직업", "능력/소재", "작풍", "로맨스"];
const facets = Array.from({ length: 401 }, (_, i) => ({
  id: `keyword:${i + 1}`, label: i === 0 ? "LongStoryKeyword".repeat(7) : `${groupNames[i % 8]} ${i + 1}`,
  group: groupNames[i % 8], count: 149 - (i % 100),
}));
const longTitle = "AWorldBeyondTheForbiddenGate".repeat(9);

async function setup(page: Page, options: { delay?: (keyword: string) => number } = {}) {
  const messages: string[] = [];
  diagnostics.set(page, messages);
  page.on("console", message => { if (["warning", "error"].includes(message.type())) messages.push(message.text()); });
  const calls: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) return route.abort();
    if (!url.pathname.startsWith("/api/")) return route.continue();
    const path = url.pathname.slice(4);
    let data: unknown = [];
    if (path === "/v1/query/search") {
      const keyword = url.searchParams.get("keyword") || "";
      calls.push(keyword);
      const delay = options.delay?.(keyword) || 0;
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      const tags = url.searchParams.getAll("tag");
      data = {
        products: Array.from({ length: 6 }, (_, i) => ({
          productId: 100 + i, title: `${keyword || "탐색"}: ${longTitle}`, authorNickname: "긴작가이름".repeat(10),
          synopsis: "마법과 사건을 찾아가는 이야기. ".repeat(50), image: { coverImagePath: "/images/default-cover.png" },
          searchMatchReasons: [`작품명: ${keyword || "탐색"}`, "주인공 목표: " + "LongMatchedKeyword".repeat(7)],
        })),
        facets, selectedTags: facets.filter(f => tags.includes(f.id)), totalCount: 149,
        events: [], quests: [], page: 1, pageSize: 6,
      };
    } else if (path === "/v1/query/notices/top-bar") {
      data = { noticeId: 98765, text: "상단 공지가 있는 검색 화면 검증", endAt: null };
    } else if (path === "/v1/query/user") data = null;
    else if (!["/v1/query/events", "/v1/query/notices/rolling-notices", "/v1/command/statistics/page-view", "/v1/command/statistics/page-dwell"].includes(path)) {
      errors.push(`Unexpected API: ${path}`);
      return route.fulfill({ status: 500, json: { detail: "Unexpected API" } });
    }
    return route.fulfill({ json: { data } });
  });
  await page.goto("/product/event");
  await expect(page.getByRole("region", { name: "사이트 공지" })).toBeVisible();
  return { calls, errors };
}

async function openSearch(page: Page) {
  await page.getByRole("button", { name: "작품 검색 열기" }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog", { name: "작품 찾기" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function record(page: Page, info: TestInfo, label: string, data: unknown) {
  await info.attach(label, { body: JSON.stringify(data, null, 2), contentType: "application/json" });
  const screenshot = info.outputPath(`${label}.png`);
  await page.screenshot({ path: screenshot });
  await info.attach(`${label}-screen`, { path: screenshot, contentType: "image/png" });
}

test("keyword discovery exposes every group and all keywords without counts", async ({ page }, info) => {
  const { calls, errors } = await setup(page);
  const dialog = await openSearch(page);
  const discovery = dialog.getByRole("region", { name: "이야기로 찾아보기" });
  await expect(discovery.getByRole("button", { name: facets[0].label, exact: true })).toBeVisible();
  for (const group of groupNames) {
    const section = discovery.getByRole("group", { name: group, exact: true });
    const groupFacets = facets.filter(f => f.group === group);
    await expect(section.getByRole("button")).toHaveCount(13); // 12 keywords + progressive disclosure.
    for (const facet of groupFacets.slice(0, 12)) {
      await expect(section.getByRole("button", { name: facet.label, exact: true })).toBeAttached();
    }
    const more = section.getByRole("button", { name: `${group} 키워드 더 보기`, exact: true });
    while (await more.count()) await more.click();
    for (const facet of groupFacets) {
      await expect(section.getByRole("button", { name: facet.label, exact: true })).toBeAttached();
    }
  }
  await record(page, info, "all-keywords", { count: await discovery.getByRole("button").count(), calls });
  expect(calls).toEqual([""]); // Disclosure uses already-fetched assets.
  expect(errors).toEqual([]);
});

test("keyword selection brings results forward and allows additional conditions", async ({ page }, info) => {
  const { errors } = await setup(page);
  const dialog = await openSearch(page);
  await dialog.getByRole("button", { name: facets[1].label, exact: true }).click();
  const toggle = dialog.getByRole("button", { name: "조건 좁히기", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(dialog.getByRole("region", { name: "검색 작품" }).getByRole("heading")).toBeInViewport();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await dialog.getByRole("button", { name: facets[2].label, exact: true }).click();
  await expect(dialog.getByRole("button", { name: `${facets[2].label} 조건 해제` })).toBeVisible();
  await dialog.getByRole("button", { name: "조건 초기화", exact: true }).click();
  await expect(dialog.getByRole("button", { name: facets[1].label, exact: true })).toBeVisible();
  // Revisit the final group twice: the second selection uses the query cache.
  const backgroundY = await page.evaluate(() => window.scrollY);
  for (let visit = 0; visit < 2; visit += 1) {
    await dialog.getByRole("button", { name: facets[7].label, exact: true }).click();
    await expect(dialog.getByRole("region", { name: "검색 작품" }).getByRole("heading")).toBeInViewport();
    await dialog.getByRole("button", { name: "조건 초기화", exact: true }).click();
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(backgroundY);
  await record(page, info, "discovery-reset", {});
  expect(errors).toEqual([]);
});

for (const [width, height] of [[320, 568], [390, 844], [767, 540], [768, 540], [844, 390], [1024, 320], [1440, 900]]) {
  test(`QA viewport ${width}x${height}: long content, notice and bounded modal`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    const { errors } = await setup(page);
    const dialog = await openSearch(page);
    await dialog.getByRole("button", { name: "작품 태그 키워드 더 보기", exact: true }).click();
    const before = await dialog.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const scroll = el.querySelector<HTMLElement>(".overflow-y-auto")!;
      return { top: rect.top, bottom: rect.bottom, width: rect.width, scrollWidth: scroll.scrollWidth, clientWidth: scroll.clientWidth };
    });
    await record(page, info, "expanded", before);
    expect.soft(before.bottom).toBeLessThanOrEqual(height + 1);
    expect.soft(before.top).toBeGreaterThanOrEqual(0);
    expect.soft(before.scrollWidth).toBeLessThanOrEqual(before.clientWidth + 1);
    expect(await dialog.getByRole("region", { name: "이야기로 찾아보기" }).getByRole("button").count()).toBeLessThanOrEqual(128);
    await dialog.getByRole("searchbox").fill("공포");
    await expect(dialog.getByRole("region", { name: "검색 작품" })).toBeVisible();
    const content = await dialog.evaluate(el => {
      const scroll = el.querySelector<HTMLElement>(".overflow-y-auto")!;
      return { scrollWidth: scroll.scrollWidth, clientWidth: scroll.clientWidth };
    });
    const backgroundY = await page.evaluate(() => window.scrollY);
    await dialog.getByRole("region", { name: "검색 작품" }).getByRole("heading").scrollIntoViewIfNeeded();
    await record(page, info, "results", content);
    expect(await page.evaluate(() => window.scrollY)).toBe(backgroundY);
    expect.soft(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth + 1);
    await dialog.getByRole("button", { name: "검색 닫기" }).click();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    expect(errors).toEqual([]);
  });
}

test("QA desktop modal blocks header interaction and hands focus to AI", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { errors } = await setup(page);
  const dialog = await openSearch(page);
  const headerLink = page.getByRole("link", { name: "TOP50", exact: true }).filter({ visible: true });
  const backgroundHit = await headerLink.evaluate(el => {
    const box = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  });
  await record(page, info, "header-interaction", { backgroundHit });
  expect.soft(backgroundHit).toBe(false);
  await dialog.getByRole("button", { name: "원하는 이야기를 말로 설명하려면 AI 사서" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByPlaceholder("메시지를 입력하세요")).toBeInViewport();
  await record(page, info, "ai-handoff", { focus: await page.evaluate(() => document.activeElement?.outerHTML) });
  await expect(page.getByPlaceholder("메시지를 입력하세요")).toBeFocused();
  await page.getByRole("button", { name: "AI 사서 패널 닫기" }).click();
  await expect(page.getByRole("button", { name: "작품 검색 열기" }).filter({ visible: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test("QA resize and late response cannot reopen search or retain scroll lock", async ({ page }, info) => {
  const { errors } = await setup(page, { delay: keyword => keyword ? 1200 : 0 });
  const dialog = await openSearch(page);
  await dialog.getByRole("searchbox").fill("입력 유지");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(dialog.getByRole("searchbox")).toHaveValue("입력 유지");
  await record(page, info, "orientation", { bounds: await dialog.boundingBox() });
  await dialog.getByRole("button", { name: "검색 닫기" }).click();
  await page.waitForTimeout(1500); // Intentionally wait for the injected late response.
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  expect(errors).toEqual([]);
});

test("QA 4x CPU: 401 facets, input paint and stale result cancellation", async ({ page }, info) => {
  test.setTimeout(60000);
  const { calls, errors } = await setup(page, { delay: keyword => keyword === "이전" ? 1500 : keyword ? 250 : 0 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.evaluate(() => {
    performance.clearMarks();
    document.addEventListener("input", () => {
      const start = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => performance.measure("search-input-paint", { start, end: performance.now() })));
    });
    document.addEventListener("click", event => {
      if ((event.target as Element).closest('button')?.querySelector('svg[viewBox="0 0 20 20"]')) performance.mark("search-open-click");
    });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) performance.measure("search-long-task", { start: entry.startTime, duration: entry.duration });
    }).observe({ type: "longtask" });
    const observer = new MutationObserver(() => {
      const results = document.querySelector('[aria-label="검색 작품"]');
      if (results?.textContent?.includes("최신:") && !performance.getEntriesByName("search-results-paint").length) {
        const resource = performance.getEntriesByType("resource").filter(e => e.name.includes("/v1/query/search?") && decodeURIComponent(e.name).includes("최신")).at(-1) as PerformanceResourceTiming | undefined;
        if (resource?.responseEnd) requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!performance.getEntriesByName("search-results-paint").length) performance.measure("search-results-paint", { start: resource.responseEnd, end: performance.now() });
        }));
      }
      if (document.querySelector('[role="dialog"]') && !performance.getEntriesByName("search-open-paint").length) {
        requestAnimationFrame(() => {
          if (performance.getEntriesByName("search-open-click").length && !performance.getEntriesByName("search-open-paint").length) performance.measure("search-open-paint", "search-open-click");
        });
      }
    });
    observer.observe(document.body, { subtree: true, childList: true });
  });
  const dialog = await openSearch(page);
  await dialog.getByRole("button", { name: "작품 태그 키워드 더 보기", exact: true }).click();
  const input = dialog.getByRole("searchbox");
  await input.fill("이전");
  await expect.poll(() => calls.includes("이전")).toBe(true);
  await input.fill("최신");
  await expect(dialog.getByRole("region", { name: "검색 작품" }).getByText(`최신: ${longTitle}`, { exact: true })).toHaveCount(6);
  await page.waitForTimeout(1600); // Old response must not replace the current result.
  await expect(dialog.getByText(`이전: ${longTitle}`, { exact: true })).toHaveCount(0);
  const timings = await page.evaluate(() => performance.getEntriesByType("measure").filter(e => e.name.startsWith("search-")).map(e => ({ name: e.name, ms: e.duration })));
  await record(page, info, "cpu4x", { timings, calls, errors });
  expect(timings.filter(t => t.name === "search-input-paint").length).toBeGreaterThanOrEqual(2);
  for (const timing of timings.filter(t => t.name === "search-input-paint")) expect(timing.ms).toBeLessThan(200);
  expect(timings.find(t => t.name === "search-results-paint")?.ms).toBeLessThan(200);
  expect(calls).toEqual(["", "이전", "최신"]);
  expect(errors).toEqual([]);
});
