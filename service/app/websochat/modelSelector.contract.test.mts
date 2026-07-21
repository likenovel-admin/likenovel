import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const querySource = readFileSync(
  new URL("../api/query/websochat/index.ts", import.meta.url),
  "utf8"
);
const selectorSource = readFileSync(
  new URL("../../components/websochat/WebsochatModelSelector.tsx", import.meta.url),
  "utf8"
);
const bottomSheetSource = readFileSync(
  new URL("../../components/common/BottomSheetContainer.tsx", import.meta.url),
  "utf8"
);

test("모델 선택은 캐릭터챗 composer 최좌측에만 있고 모바일과 PC 표면을 분리한다", () => {
  const selectorIndex = pageSource.indexOf("<WebsochatModelSelector");
  const textareaIndex = pageSource.indexOf("<textarea", selectorIndex);
  const characterOnlyGuardIndex = pageSource.lastIndexOf(
    "{isCharacterChatExperience ? (",
    selectorIndex
  );

  assert.ok(selectorIndex >= 0);
  assert.ok(textareaIndex > selectorIndex);
  assert.ok(characterOnlyGuardIndex >= 0);
  assert.ok(selectorIndex - characterOnlyGuardIndex < 160);
  assert.match(selectorSource, /device === "mobile"/);
  assert.match(selectorSource, /<BottomSheetContainer/);
  assert.match(selectorSource, /absolute bottom-full left-0/);
  assert.match(selectorSource, /event\.key !== "Escape"/);
  assert.match(selectorSource, /document\.addEventListener\("mousedown"/);
  assert.match(bottomSheetSource, /aria-label="닫기"/);
  assert.doesNotMatch(selectorSource, /추천|양호|부족/);
  assert.doesNotMatch(selectorSource, /OpenRouter|Gemma|Gemini/i);
  assert.match(
    pageSource.slice(textareaIndex, textareaIndex + 2400),
    /className="min-w-0 flex-1/,
    "360px composer에서도 textarea가 모델·액션 버튼을 밀어내지 않아야 한다"
  );
});

test("캐릭터챗 선택 모델만 저장·preflight·stream·one-shot·retry에 전달된다", () => {
  assert.match(querySource, /query\.set\("model_key", modelKey\)/);
  assert.match(querySource, /sessions\/\$\{sessionId\}\/model/);
  assert.match(
    pageSource,
    /const characterChatModelKey = isCharacterChatExperience[\s\S]*\? selectedModelKey[\s\S]*: undefined/
  );
  assert.match(pageSource, /getWebsochatBillingStatusQueryOptions\([\s\S]*characterChatModelKey/);
  assert.match(pageSource, /patchSessionModel\([\s\S]*model_key: modelKey/);
  assert.match(pageSource, /if \(!isCharacterChatExperience\) return;/);
  assert.match(pageSource, /createSession\(\{[\s\S]*model_key: characterChatModelKey/);

  const sendModelKeyCount = pageSource.match(/model_key: characterChatModelKey/g)?.length ?? 0;
  assert.equal(
    sendModelKeyCount,
    6,
    "character-chat session creation, next-episode guard, one-shot, stream, and fallback share the optional character key"
  );
});

test("일반 웹소챗은 모델 UI와 모델별 비용 힌트 없이 기존 무료 3회 표기를 유지한다", () => {
  assert.match(
    pageSource,
    /isCharacterChatExperience \? requestedModelKey : null/
  );
  assert.match(
    pageSource,
    /generalFreeRemainingMessageSuffix = generalFreeRemainingMessages > 0[\s\S]*무료 \$\{generalFreeRemainingMessages\}회 남음/
  );
  assert.match(
    pageSource,
    /shouldShowModelUsageHint =[\s\S]*isCharacterChatExperience[\s\S]*effectiveShortcutState !== "qa_next_episode_write"/
  );
  assert.match(
    pageSource,
    /: `\$\{composerGhostQuestion\}\$\{generalFreeRemainingMessageSuffix\}`/
  );
});

test("생성 중에는 모델을 바꾸지 않고 모바일에서 키보드를 먼저 내린다", () => {
  assert.match(pageSource, /isModelSelectorDisabled[\s\S]*isCharacterStreamRevealDraining/);
  assert.match(pageSource, /isPatchingSessionModel/);
  assert.match(pageSource, /onBeforeMobileOpen=\{\(\) => composerTextareaRef\.current\?\.blur\(\)\}/);
  assert.match(selectorSource, /disabled=\{isDisabled\}/);
});
