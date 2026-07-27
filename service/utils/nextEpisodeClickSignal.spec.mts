import assert from "node:assert/strict";
import {
  postGuestNextEpisodeClickSignalBestEffort,
  postNextEpisodeClickSignalBestEffort,
} from "./nextEpisodeClickSignal.ts";

const storage = (items: Record<string, string>) => ({
  getItem: (key: string) => items[key] ?? null,
});

{
  const requests: RequestInit[] = [];
  globalThis.localStorage = storage({ access_token: "token" }) as Storage;
  globalThis.sessionStorage = storage({}) as Storage;
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push(init ?? {});
    return { ok: true } as Response;
  }) as typeof fetch;

  postNextEpisodeClickSignalBestEffort({
    originAction: "next_episode_click",
    productId: 10,
    fromEpisodeId: 20,
    redirectToEpisodeId: 21,
    entrySource: "ai_taste_section",
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requests.length, 1);
  const body = JSON.parse(String(requests[0].body));
  assert.deepEqual(body.event_payload, {
    redirect_to_episode_id: 21,
    entry_source: "ai_taste_section",
  });
}

{
  const payloads: Array<Record<string, unknown>> = [];
  globalThis.localStorage = storage({}) as Storage;
  globalThis.sessionStorage = storage({}) as Storage;
  const context = {
    originAction: "next_episode_click" as const,
    productId: 10,
    fromEpisodeId: 30,
    redirectToEpisodeId: 31,
  };

  const viewerSession = {
    viewerSessionId: "viewer-guest",
    lane: "guest" as const,
    visitorId: "pv_guest",
    browserSessionId: "pvs_guest",
  };
  const postReaderFunnelEvent = (payload: Record<string, unknown>) => {
    payloads.push(payload);
  };
  postGuestNextEpisodeClickSignalBestEffort(
    context,
    viewerSession,
    postReaderFunnelEvent
  );
  postNextEpisodeClickSignalBestEffort(
    context,
    viewerSession,
    postReaderFunnelEvent
  );
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(payloads.length, 1, "guest double dispatch should be deduped");
  assert.equal(payloads[0].eventType, "next_episode_click");
}

{
  const requests: Array<{ url: string; init: RequestInit }> = [];
  globalThis.localStorage = storage({ access_token: "token" }) as Storage;
  globalThis.sessionStorage = storage({}) as Storage;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init: init ?? {} });
    return { ok: true } as Response;
  }) as typeof fetch;
  postNextEpisodeClickSignalBestEffort(
    {
      originAction: "next_episode_click",
      productId: 10,
      fromEpisodeId: 40,
      redirectToEpisodeId: 41,
    },
    {
      viewerSessionId: "viewer-member",
      lane: "member",
      visitorId: "pv_member",
      browserSessionId: "pvs_member",
    }
  );
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "/api/v1/command/ai/signal-events");
}

{
  const requests: RequestInit[] = [];
  globalThis.localStorage = storage({ access_token: "token" }) as Storage;
  globalThis.sessionStorage = storage({}) as Storage;
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push(init ?? {});
    return { ok: true } as Response;
  }) as typeof fetch;

  postNextEpisodeClickSignalBestEffort({
    originAction: "next_episode_click",
    productId: 10,
    fromEpisodeId: 20,
    redirectToEpisodeId: 21,
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requests.length, 1);
  const body = JSON.parse(String(requests[0].body));
  assert.deepEqual(body.event_payload, {
    redirect_to_episode_id: 21,
  });
}
