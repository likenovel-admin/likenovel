import assert from "node:assert/strict";
import { postNextEpisodeClickSignalBestEffort } from "./nextEpisodeClickSignal.ts";

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
