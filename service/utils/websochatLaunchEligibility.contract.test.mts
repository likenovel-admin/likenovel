import assert from "node:assert/strict";
import {
  buildWebsochatLaunchPayload,
  filterWebsochatActionsByAllowedModes,
  getWebsochatLaunchEligibility,
  isVisibleWebsochatComposerShortcutAction,
  isVisibleWebsochatPublicShortcutAction,
  isWebsochatModeAllowed,
  consumeWebsochatStartChooserRequest,
  requestWebsochatStartChooser,
} from "./websochatLaunch.ts";

const paidReadyProduct = {
  productId: 100,
  title: "유료 테스트 작품",
  priceType: "paid",
  isPaidProduct: true,
  publishedLatestEpisodeNo: 50,
  syncedLatestEpisodeNo: 50,
  contextStatus: "ready",
};

const eligibility = getWebsochatLaunchEligibility(paidReadyProduct);

assert.equal(eligibility.canLaunch, true);
assert.equal(eligibility.displayState, "ready");

const payload = buildWebsochatLaunchPayload(paidReadyProduct, {
  label: "작품 대화",
  prompt: "27화까지 읽었어",
  modeKey: "qa",
  qaActionKey: null,
});

assert.equal(payload?.productId, 100);
assert.equal(payload?.priceType, "paid");
assert.equal(payload?.publishedLatestEpisodeNo, 50);
assert.equal(payload?.syncedLatestEpisodeNo, 50);

const shortcutActions = [
  { label: "작품 대화", modeKey: "qa" as const },
  { label: "다음 전개 예상", modeKey: "qa" as const },
  { label: "인물과 대화", modeKey: "rp" as const },
];

assert.deepEqual(
  filterWebsochatActionsByAllowedModes(shortcutActions, ["rp"]),
  [{ label: "인물과 대화", modeKey: "rp" }]
);
assert.deepEqual(
  filterWebsochatActionsByAllowedModes(shortcutActions, null),
  shortcutActions
);
assert.deepEqual(
  filterWebsochatActionsByAllowedModes(shortcutActions, []),
  []
);
assert.equal(isWebsochatModeAllowed("qa", ["rp"]), false);
assert.equal(isWebsochatModeAllowed("rp", ["rp"]), true);
assert.equal(isWebsochatModeAllowed("qa", null), true);

assert.deepEqual(
  shortcutActions.filter(isVisibleWebsochatComposerShortcutAction),
  [
    { label: "작품 대화", modeKey: "qa" },
    { label: "다음 전개 예상", modeKey: "qa" },
  ]
);

assert.deepEqual(
  shortcutActions.filter(isVisibleWebsochatPublicShortcutAction),
  [
    { label: "작품 대화", modeKey: "qa" },
    { label: "다음 전개 예상", modeKey: "qa" },
  ]
);

const chooserRequestStorage = new Map<string, string>();
const chooserStorage = {
  getItem: (key: string) => chooserRequestStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    chooserRequestStorage.set(key, value);
  },
  removeItem: (key: string) => {
    chooserRequestStorage.delete(key);
  },
};

assert.equal(
  consumeWebsochatStartChooserRequest({ storage: chooserStorage }),
  false
);
chooserRequestStorage.set(
  "pending_websochat_launch",
  JSON.stringify({ productId: 100 })
);
requestWebsochatStartChooser({ storage: chooserStorage });
assert.equal(
  chooserRequestStorage.has("pending_websochat_launch"),
  false
);
assert.equal(
  consumeWebsochatStartChooserRequest({ storage: chooserStorage }),
  true
);
assert.equal(
  consumeWebsochatStartChooserRequest({ storage: chooserStorage }),
  false
);
