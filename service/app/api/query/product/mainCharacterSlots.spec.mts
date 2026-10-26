import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { QueryClient, QueryObserver, type QueryObserverOptions } from "@tanstack/react-query";

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(
  readFileSync(new URL("./index.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function loadSlotOptions(refreshOnEntry: boolean, fetch: () => Promise<object>) {
  let captured: QueryObserverOptions | undefined;
  const queryModule = require("@tanstack/react-query");
  const loadedModule = { exports: {} as Record<string, (...args: unknown[]) => unknown> };
  const run = vm.runInNewContext(`(function(require, module, exports) { ${compiled}\n})`);
  run((name: string) => {
    if (name === "@tanstack/react-query") {
      return { ...queryModule, useQuery: (options: QueryObserverOptions) => { captured = options; } };
    }
    if (name === "../../axios") return { instance: { get: async () => ({ data: await fetch() }) } };
    throw new Error(`Unexpected runtime import: ${name}`);
  }, loadedModule, loadedModule.exports);
  loadedModule.exports.useGetMainCharacterSlots("N", true, "guest", refreshOnEntry);
  assert.ok(captured);
  return captured;
}

test("메인 재진입은 신선한 캐시가 있어도 다시 추첨하고 같은 방문의 카드는 유지한다", async () => {
  let calls = 0;
  const options = loadSlotOptions(true, async () => ({ data: [++calls] }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(options.queryKey!, { data: [0] });
  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  try {
    await observer.getCurrentQuery().promise;
    assert.equal(calls, 1);
    assert.deepEqual(observer.getCurrentResult().data, { data: [1] });
    assert.equal(observer.shouldFetchOnWindowFocus(), false);
    assert.equal(observer.shouldFetchOnReconnect(), false);
    observer.setOptions(options);
    assert.equal(calls, 1);
    assert.deepEqual(observer.getCurrentResult().data, { data: [1] });
  } finally {
    unsubscribe();
  }
  const nextVisit = new QueryObserver(client, options);
  const unsubscribeNext = nextVisit.subscribe(() => {});
  try {
    await nextVisit.getCurrentQuery().promise;
    assert.equal(calls, 2);
    assert.deepEqual(nextVisit.getCurrentResult().data, { data: [2] });
  } finally {
    unsubscribeNext();
    client.clear();
  }
});

test("웹소챗 시작 선택은 기존의 신선한 구좌 캐시를 재사용한다", async () => {
  let calls = 0;
  const options = loadSlotOptions(false, async () => ({ data: [++calls] }));
  const client = new QueryClient();
  client.setQueryData(options.queryKey!, { data: [7] });
  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  try {
    assert.equal(calls, 0);
    assert.deepEqual(observer.getCurrentResult().data, { data: [7] });
  } finally {
    unsubscribe();
    client.clear();
  }
});
