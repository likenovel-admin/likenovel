import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  consumeWebsochatReturnPath,
  saveWebsochatReturnPath,
} from "../../utils/websochatLaunch.ts";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test("웹소챗 복귀 경로는 내부 경로만 한 번 소비한다", () => {
  const storage = new MemoryStorage();

  saveWebsochatReturnPath({
    path: "/viewer/123?product_id=1103",
    storage,
  });

  assert.equal(
    consumeWebsochatReturnPath({ storage }),
    "/viewer/123?product_id=1103"
  );
  assert.equal(consumeWebsochatReturnPath({ storage }), null);
});

test("외부 URL과 웹소챗 자체 경로는 복귀 경로로 저장하지 않는다", () => {
  const storage = new MemoryStorage();

  saveWebsochatReturnPath({ path: "https://example.com/phishing", storage });
  assert.equal(consumeWebsochatReturnPath({ storage }), null);

  saveWebsochatReturnPath({ path: "/websochat?session_id=1", storage });
  assert.equal(consumeWebsochatReturnPath({ storage }), null);
});

test("공통 헤더는 뒤로가기, 모바일 세션 목록, 새 대화 순서를 유지한다", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const backIndex = source.indexOf('aria-label="이전 화면으로 돌아가기"');
  const sessionListIndex = source.indexOf('aria-label="세션 목록"');
  const newSessionIndex = source.indexOf('aria-label="새 대화"');
  const prepareNavStart = source.indexOf("const handlePrepareNav = () => {");
  const prepareNavEnd = source.indexOf(
    "window.addEventListener(WEBSOCHAT_PREPARE_NAV_EVENT",
    prepareNavStart
  );

  assert.ok(backIndex >= 0);
  assert.ok(backIndex < sessionListIndex);
  assert.ok(sessionListIndex < newSessionIndex);
  assert.ok(prepareNavStart >= 0);
  assert.ok(prepareNavEnd > prepareNavStart);
  assert.doesNotMatch(
    source.slice(prepareNavStart, prepareNavEnd),
    /writeStoredActiveSessionId\(null\)/
  );
  assert.doesNotMatch(
    source,
    /isCharacterChatExperience \? "flex" : "flex md:hidden"/
  );
});
