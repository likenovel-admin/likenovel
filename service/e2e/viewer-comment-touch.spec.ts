import { devices, expect, test, type CDPSession, type Page } from "@playwright/test";
import JSZip from "jszip";

test.use({ ...devices["Galaxy S9+"] });

const viewerPath = "/viewer/101?productId=10";
const lastPage = "#epub-lastpage-host";

async function buildEpisode() {
  const epub = new JSZip();
  epub.file("mimetype", "application/epub+zip", { compression: "STORE" });
  epub.file("META-INF/container.xml", `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles><rootfile full-path="episode.opf" media-type="application/oebps-package+xml"/></rootfiles>
    </container>`);
  epub.file("episode.opf", `<?xml version="1.0"?>
    <package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="id">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="id">viewer-comment-touch</dc:identifier><dc:title>댓글 터치 검증</dc:title><dc:language>ko</dc:language>
        <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
      </metadata>
      <manifest>
        <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
      </manifest>
      <spine><itemref idref="chapter"/></spine>
    </package>`);
  epub.file("chapter.xhtml", `<html xmlns="http://www.w3.org/1999/xhtml"><head><title>첫 회차</title></head><body>
    ${Array.from({ length: 55 }, (_, index) => `<p>첫 회차 본문 ${index + 1}</p>`).join("")}
    </body></html>`);
  epub.file("nav.xhtml", `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
    <head><title>목차</title></head><body><nav epub:type="toc"><ol><li><a href="chapter.xhtml">첫 회차</a></li></ol></nav></body></html>`);
  return epub.generateAsync({ type: "nodebuffer" });
}

async function swipe(client: CDPSession, x: number, fromY: number, toY: number) {
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: fromY }] });
  for (let step = 1; step <= 10; step += 1) {
    const y = Math.round(fromY + (toY - fromY) * step / 10);
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

const scrollPosition = (page: Page) => page.locator(lastPage).evaluate((host) => {
  const container = host.parentElement!;
  return { top: container.scrollTop, max: container.scrollHeight - container.clientHeight };
});

async function reachLastPageEnd(page: Page, client: CDPSession) {
  const height = page.viewportSize()!.height;
  for (let swipeCount = 0; swipeCount < 18; swipeCount += 1) {
    const { top, max } = await scrollPosition(page);
    if (top >= max - 2) return;
    await swipe(client, 8, height - 104, 100);
  }
  await expect.poll(async () => {
    const { top, max } = await scrollPosition(page);
    return max - top;
  }).toBeLessThanOrEqual(2);
}

async function openViewer(page: Page, baseURL: string, nextEpisodeId = 0) {
  const epub = await buildEpisode();
  await page.route("**/viewer-comment-touch.epub", (route) => route.fulfill({
    contentType: "application/epub+zip",
    body: epub,
  }));
  const submissions: { content: string }[] = [];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/query/episodes/101" || path === "/api/v1/query/episodes/102") {
      const isFirst = path.endsWith("/101");
      return route.fulfill({ json: {
        data: {
          product_id: 10,
          title: "댓글 터치 검증을 위한 긴 작품 제목 테스트",
          episodeTitle: isFirst ? "첫 회차. 좁은 화면에서도 읽기 순서가 보이는 아주 긴 회차 제목" : "다음 회차",
          episodeNo: isFirst ? 1 : 2,
          commentOpenYn: "Y",
          nextEpisodeId: isFirst ? nextEpisodeId : 0,
          nextEpisodes: 2,
          nextEpisodePriceType: "free",
          previousEpisodeId: isFirst ? 100 : 101,
          websochatSupported: true,
          websochatEligible: true,
          websochatSyncedLatestEpisodeNo: 2,
          epubFilePath: `${baseURL}/viewer-comment-touch.epub`,
        },
      } });
    }
    if (path === "/api/v1/query/products/10/comments") {
      return route.fulfill({ json: { data: { comments: [], commentTotalCount: 0 } } });
    }
    if (path === "/api/v1/query/user") {
      const member = route.request().headers().authorization === "Bearer comment-test-session";
      return route.fulfill({ json: { data: member ? { userId: 42, userRole: "user" } : {} } });
    }
    if (path === "/api/v1/command/products/comments/episodes/101" && route.request().method() === "POST") {
      submissions.push(route.request().postDataJSON());
      return route.fulfill({ json: { data: {} } });
    }
    return route.fulfill({ json: { data: [] } });
  });

  await page.goto(viewerPath);
  await page.locator(lastPage).waitFor({ state: "attached" });
  await expect(page.getByText("본문을 불러오는 중이에요")).toHaveCount(0);
  const client = await page.context().newCDPSession(page);
  await reachLastPageEnd(page, client);
  return { client, submissions };
}

test("mobile reader can return from the end and tap the inline comment controls", async ({ page, baseURL }) => {
  const { client, submissions } = await openViewer(page, baseURL!);
  const fullComments = page.getByRole("button", { name: "댓글 전체보기" });
  await expect(fullComments).toBeInViewport();
  await fullComments.tap();
  const dialog = page.getByRole("dialog", { name: "작품 댓글" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "댓글 닫기" }).tap();
  await expect(dialog).toHaveCount(0);

  const before = await scrollPosition(page);
  await swipe(client, 8, 140, 440);
  await expect.poll(async () => (await scrollPosition(page)).top).toBeLessThan(before.top - 25);
  const comment = page.getByRole("textbox", { name: "댓글 입력" });
  await comment.tap();
  await expect(comment).toBeFocused();
  const quickComment = page.getByRole("button", { name: "잘 보고 갑니다", exact: true });
  await quickComment.tap();
  await expect(comment).toHaveValue("잘 보고 갑니다");
  await expect(comment).toBeFocused();
  await page.getByRole("button", { name: "댓글 등록" }).tap();
  await expect(page).toHaveURL(/\/login\?modal=open/);
  expect(submissions).toEqual([]);
});

test("one mobile registration tap sends one episode comment", async ({ page, baseURL }) => {
  await page.addInitScript(() => sessionStorage.setItem("access_token", "comment-test-session"));
  const { submissions } = await openViewer(page, baseURL!);
  const text = "모바일에서 댓글을 남깁니다.";
  const comment = page.getByRole("textbox", { name: "댓글 입력" });
  await comment.tap();
  await comment.fill(text);
  await page.getByRole("button", { name: "댓글 등록" }).tap();
  await expect(page.getByText("댓글이 등록되었습니다.")).toBeVisible();
  await expect(comment).toHaveValue("");
  expect(submissions).toEqual([{ content: text }]);
});

test("dragging over the next episode card scrolls and tapping still opens the next episode", async ({ page, baseURL }) => {
  const { client } = await openViewer(page, baseURL!, 102);
  const nextEpisode = page.locator(lastPage).getByText("다음화 보기");
  await nextEpisode.scrollIntoViewIfNeeded();
  const height = page.viewportSize()!.height;
  const center = Math.round(height / 2);
  const initialBox = (await nextEpisode.boundingBox())!;
  await page.mouse.move(8, center);
  await page.mouse.wheel(0, Math.round(initialBox.y + initialBox.height / 2 - center));
  await expect.poll(async () => {
    const box = (await nextEpisode.boundingBox())!;
    return Math.abs(box.y + box.height / 2 - center);
  }).toBeLessThan(20);
  const box = (await nextEpisode.boundingBox())!;
  const startY = Math.round(box.y + box.height / 2);
  const before = await scrollPosition(page);
  await swipe(client, Math.round(box.x + box.width / 2), startY, startY + 180);
  await expect(page).toHaveURL(/\/viewer\/101\?/);
  await expect.poll(async () => (await scrollPosition(page)).top).toBeLessThan(before.top - 25);
  await nextEpisode.tap();
  await expect(page).toHaveURL(/\/viewer\/102\?/);
});

for (const width of [320, 360, 390]) {
  test(`viewer shows accessible mobile controls at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 700 });
    await openViewer(page, baseURL!, 102);
    const header = page.getByRole("navigation", { name: "뷰어 상단 메뉴" });
    const footer = page.getByRole("navigation", { name: "뷰어 하단 메뉴" });
    await expect(header.getByRole("button", { name: "북마크" })).toBeVisible();
    const titles = await header.locator("p:visible").evaluateAll((paragraphs) =>
      paragraphs.map((paragraph) => {
        const style = getComputedStyle(paragraph);
        return {
          size: style.fontSize,
          clamp: style.webkitLineClamp,
          right: paragraph.getBoundingClientRect().right,
        };
      }),
    );
    expect(titles.map(({ size, clamp }) => ({ size, clamp }))).toEqual([
      { size: "11px", clamp: "1" },
      { size: "15px", clamp: "2" },
    ]);
    const bookmark = (await header.getByRole("button", { name: "북마크" }).boundingBox())!;
    expect(titles.every(({ right }) => right < bookmark.x)).toBe(true);
    expect(bookmark.width).toBe(44);
    expect(bookmark.height).toBe(44);
    await expect(footer.getByRole("button", { name: "북마크" })).toHaveCount(0);
    const geometry = await footer.evaluate((nav) => ({
      height: nav.getBoundingClientRect().height,
      bounds: Array.from(nav.querySelectorAll("button"), (button) => {
        const rect = button.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
      }),
    }));
    expect(geometry.height).toBe(60);
    expect(geometry.bounds).toHaveLength(5);
    geometry.bounds.forEach(({ left, right, width: hitWidth, height }, index) => {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(width);
      expect(hitWidth).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
      if (index > 0) expect(left - geometry.bounds[index - 1].right).toBeGreaterThanOrEqual(6);
    });
    for (const name of ["이전화", "댓글", "좋아요", "웹소챗", "다음화"]) {
      await expect(footer.getByRole("button", { name, exact: true })).toBeVisible();
    }
    const websochat = footer.getByRole("button", { name: "웹소챗", exact: true });
    await expect(websochat).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(websochat).toHaveCSS("border-top-width", "0px");
    await expect(websochat).toHaveCSS("color", "rgb(77, 81, 89)");
    await expect(websochat).toHaveCSS("font-weight", "500");
    await expect(websochat.locator("svg")).toHaveCSS("color", "rgb(77, 81, 89)");
    const settings = header.getByRole("button", { name: "뷰어 설정" });
    const settingsBox = (await settings.boundingBox())!;
    expect(settingsBox.width).toBe(44);
    expect(settingsBox.height).toBe(44);
    expect(settingsBox.x - bookmark.x - bookmark.width).toBeGreaterThanOrEqual(6);
    await settings.tap();
    const mode = page.getByRole("group", { name: "보기 방식" });
    await expect(mode.getByRole("button", { name: "세로 스크롤" })).toHaveAttribute("aria-pressed", "true");
    expect(await mode.evaluate((elem) => {
      const panel = elem.closest('[class*="overflow-y-auto"]')!;
      return panel.scrollWidth - panel.clientWidth;
    })).toBe(0);
    await mode.getByRole("button", { name: "가로 슬라이드" }).tap();
    await expect(page.getByRole("button", { name: "다음 페이지" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("viewer_is_scroll"))).toBe("false");
    await settings.tap();
    await expect(mode.getByRole("button", { name: "가로 슬라이드" })).toHaveAttribute("aria-pressed", "true");
    await mode.getByRole("button", { name: "세로 스크롤" }).tap();
    await expect(page.locator(lastPage)).toBeAttached();
  });
}

test("mobile bookmark still opens login from the top bar", async ({ page, baseURL }) => {
  await openViewer(page, baseURL!);
  const header = page.getByRole("navigation", { name: "뷰어 상단 메뉴" });
  await header.getByRole("button", { name: "북마크" }).tap();
  await expect(page).toHaveURL(/\/login\?modal=open/);
});

test("tablet viewer keeps the comment control after the mobile footer is hidden", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await openViewer(page, baseURL!);
  const header = page.getByRole("navigation", { name: "뷰어 상단 메뉴" });
  await expect(page.getByRole("navigation", { name: "뷰어 하단 메뉴" })).toHaveCount(0);
  await header.getByRole("button", { name: "댓글", exact: true }).tap();
  await expect(page.getByRole("dialog", { name: "작품 댓글" })).toBeVisible();
});
