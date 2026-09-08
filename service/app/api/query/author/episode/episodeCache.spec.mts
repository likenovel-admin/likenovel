import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const query = require("@tanstack/react-query");

// Execute the real mutation hooks and QueryClient. Only HTTP is substituted.
function loadHooks(instance) {
  const target = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL("./index.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(source, {
    module: target, exports: target.exports, URLSearchParams,
    console: { log() {} },
    require: (name) => name === "@/app/api/axios" ? { instance } : require(name),
  });
  return target.exports;
}

for (const mode of ["update", "register", "temporary-save", "failed-update"]) {
  test(`${mode}: saved title replaces cached list without browser reload`, async () => {
    const client = new query.QueryClient({ defaultOptions: { queries: { staleTime: 300000, retry: false }, mutations: { retry: false } } });
    let serverTitle = "19";
    let reads = 0;
    const writes = [];
    const instance = {
      put: async (url, body) => {
        writes.push({ url, body });
        if (mode === "failed-update") throw new Error("HTTP 500");
        serverTitle = body.title;
        return { data: { data: { episodeId: 27545 } } };
      },
      post: async (url, body) => {
        writes.push({ url, body });
        serverTitle = body.title;
        return { data: { data: { episodeId: 27545 } } };
      },
    };
    const hooks = loadHooks(instance);
    let mutation;
    function Capture() {
      mutation = mode.includes("update") ? hooks.useUpdateEpisode() : hooks.useMakeEpisode();
      return null;
    }
    renderToStaticMarkup(React.createElement(query.QueryClientProvider, { client }, React.createElement(Capture)));
    const listOptions = (identity) => ({
      queryKey: ["selectProductDetail", 2022, identity],
      queryFn: async () => { reads++; return { title: serverTitle }; },
      staleTime: 300000,
    });
    try {
      await client.fetchQuery(listOptions("guest"));
      await client.fetchQuery(listOptions("admin"));
      client.setQueryData(["selectProductDetail", 9999, "guest"], { title: "unrelated" });
      const data = { title: "20", content: "본문", episode_open_yn: "N", publish_reserve_yn: "Y", publish_reserve_date: "2030-01-01T09:00:00Z" };
      const variables = { productId: 2022, episodeId: 27545, data, isSave: mode === "temporary-save" ? "Y" : "N" };
      if (mode === "failed-update") {
        await assert.rejects(mutation.mutateAsync(variables), /HTTP 500/);
      } else {
        await mutation.mutateAsync(variables);
      }
      const expected = mode === "failed-update" ? "19" : "20";
      assert.equal((await client.fetchQuery(listOptions("guest"))).title, expected);
      assert.equal((await client.fetchQuery(listOptions("admin"))).title, expected);
      assert.equal(reads, mode === "failed-update" ? 2 : 4);
      assert.equal(client.getQueryState(["selectProductDetail", 9999, "guest"]).isInvalidated, false);
      assert.equal(writes.length, 1);
      assert.equal(writes[0].body.publish_reserve_date, data.publish_reserve_date);
      assert.equal(writes[0].body.productId, undefined, "cache identity must not enter HTTP payload");
    } finally {
      client.clear();
    }
  });
}
