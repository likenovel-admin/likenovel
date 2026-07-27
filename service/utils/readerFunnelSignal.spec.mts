import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  clearReaderFunnelViewerSession,
  getReaderFunnelDestinationGroup,
  getReaderFunnelActiveMs,
  getReaderFunnelViewerSession,
  pauseReaderFunnelActiveWindow,
  postReaderFunnelEventBestEffort,
  registerReaderFunnelViewerSession,
  isReaderFunnelEpisodeComplete,
  resolveReaderFunnelLane,
  resumeReaderFunnelActiveWindow,
} from "./readerFunnelSignal.ts";

assert.equal(resolveReaderFunnelLane(false), "guest");
assert.equal(resolveReaderFunnelLane(true), "member");
assert.equal(isReaderFunnelEpisodeComplete(94.99), false);
assert.equal(isReaderFunnelEpisodeComplete(95), true);
assert.equal(
  getReaderFunnelDestinationGroup({
    destinationPath: "/",
    destinationPageType: "other",
    sourceProductId: 10,
  }),
  "home"
);
assert.equal(
  getReaderFunnelDestinationGroup({
    destinationPath: "/product/11",
    destinationPageType: "product_detail",
    sourceProductId: 10,
    destinationProductId: 11,
  }),
  "other_product"
);

{
  const requests: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init: init ?? {} });
    return { ok: true } as Response;
  }) as typeof fetch;

  postReaderFunnelEventBestEffort({
    eventId: "9e6c64d6-9222-4546-a7ef-8699f89e2d26",
    occurredAt: "2026-07-27T01:02:03.000Z",
    visitorId: "pv_visitor",
    browserSessionId: "pvs_session",
    viewerSessionId: "viewer-session",
    productId: 10,
    episodeId: 20,
    eventType: "episode_exit",
    activeMs: 2_500,
    progressRatio: 0.5,
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(
    requests[0].url,
    "/api/v1/command/statistics/reader-funnel-event"
  );
  assert.equal(requests[0].init.keepalive, true);
  assert.deepEqual(JSON.parse(String(requests[0].init.body)), {
    eventId: "9e6c64d6-9222-4546-a7ef-8699f89e2d26",
    occurredAt: "2026-07-27T01:02:03.000Z",
    visitorId: "pv_visitor",
    browserSessionId: "pvs_session",
    viewerSessionId: "viewer-session",
    productId: 10,
    episodeId: 20,
    eventType: "episode_exit",
    activeMs: 2_500,
    progressRatio: 0.5,
  });
}

{
  const requests: RequestInit[] = [];
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
  });
  globalThis.localStorage = {
    getItem: (key: string) => (key === "access_token" ? "member-token" : null),
  } as Storage;
  globalThis.sessionStorage = {
    getItem: () => null,
  } as Storage;
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push(init ?? {});
    return { ok: true } as Response;
  }) as typeof fetch;

  postReaderFunnelEventBestEffort({
    eventId: "1b6e8ae3-8e02-40da-9b8b-788736bbb1f3",
    occurredAt: new Date().toISOString(),
    visitorId: "pv_guest",
    browserSessionId: "pvs_guest",
    viewerSessionId: "viewer-session",
    productId: 10,
    episodeId: 20,
    eventType: "episode_exit",
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(
    (requests[0].headers as Record<string, string>).Authorization,
    "Bearer member-token"
  );
}

{
  registerReaderFunnelViewerSession({
    episodeId: 20,
    viewerSessionId: "viewer-session",
    lane: "guest",
    visitorId: "pv_visitor",
    browserSessionId: "pvs_session",
  });
  assert.equal(getReaderFunnelViewerSession(20)?.lane, "guest");
  assert.equal(getReaderFunnelViewerSession(21), null);
  clearReaderFunnelViewerSession(20, "other-session");
  assert.equal(getReaderFunnelViewerSession(20)?.viewerSessionId, "viewer-session");
  clearReaderFunnelViewerSession(20, "viewer-session");
  assert.equal(getReaderFunnelViewerSession(20), null);
}

{
  const timing = { accumulatedMs: 0, visibleStartedAt: 1_000 as number | null };
  pauseReaderFunnelActiveWindow(timing, 2_500);
  assert.equal(getReaderFunnelActiveMs(timing, 9_000), 1_500);
  resumeReaderFunnelActiveWindow(timing, 4_000);
  assert.equal(getReaderFunnelActiveMs(timing, 5_000), 2_500);
}

{
  const viewerSource = readFileSync(
    new URL("../components/viewer/EpubViewer.tsx", import.meta.url),
    "utf8"
  );
  const pageSource = readFileSync(
    new URL("../app/viewer/[id]/page.tsx", import.meta.url),
    "utf8"
  );

  assert.match(viewerSource, /eventId: readerExitEventIdRef\.current/);
  assert.match(viewerSource, /window\.addEventListener\("pagehide", sendGuestExit\)/);
  assert.match(
    viewerSource,
    /visibilityState === "hidden"[\s\S]*sendGuestExit\(\)/
  );
  assert.match(
    viewerSource,
    /document\.addEventListener\("visibilitychange", handleVisibilityChange\)/
  );
  assert.match(pageSource, /readerPaused=\{commentState\}/);
  assert.match(pageSource, /controller\.abort\(\)/);
  assert.match(pageSource, /key=\{`\$\{episodeId\}:\$\{epubUrl\}`\}/);
}
