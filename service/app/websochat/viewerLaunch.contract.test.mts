import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildWebsochatAssetRequestSignalBody,
  getViewerWebsochatReadinessRefetchInterval,
  postWebsochatAssetRequestBestEffort,
  resolveViewerWebsochatButtonState,
  resolveViewerWebsochatClickOutcome,
  shouldPollViewerWebsochatReadiness,
} from "../../utils/websochatLaunch.ts";

const supportedViewerSource = {
  websochatEligible: true,
  websochatSupported: true,
  episodeNo: 10,
  websochatSyncedLatestEpisodeNo: 10,
};

assert.equal(
  resolveViewerWebsochatButtonState({
    websochatEligible: false,
    websochatSupported: false,
    episodeNo: 10,
  }),
  "hidden"
);
assert.equal(
  resolveViewerWebsochatButtonState({
    websochatContextStatus: "ready",
    websochatPublishedLatestEpisodeNo: 10,
    episodeNo: 10,
    websochatSyncedLatestEpisodeNo: 9,
  }),
  "pending"
);
assert.equal(
  resolveViewerWebsochatButtonState({
    websochatSupported: true,
    websochatContextStatus: "pending",
    websochatPublishedLatestEpisodeNo: 10,
    episodeNo: 10,
    websochatSyncedLatestEpisodeNo: 0,
  }),
  "pending"
);
assert.equal(
  resolveViewerWebsochatButtonState(supportedViewerSource),
  "enabled"
);
assert.equal(resolveViewerWebsochatClickOutcome("pending"), "modal");
assert.equal(resolveViewerWebsochatClickOutcome("enabled"), "launch");
assert.equal(resolveViewerWebsochatClickOutcome("hidden"), "noop");
assert.deepEqual(
  buildWebsochatAssetRequestSignalBody({
    productId: 1182,
    episodeId: 27362,
    episodeNo: 51,
  }),
  {
    product_id: 1182,
    episode_id: 27362,
    event_type: "websochat_asset_request",
    event_payload: { episode_no: 51 },
  }
);

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "window"
);
const originalConsoleError = console.error;
try {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem() {
          throw new Error("storage blocked");
        },
      },
      sessionStorage: {
        getItem() {
          return null;
        },
      },
    },
  });
  console.error = () => undefined;
  assert.doesNotThrow(() =>
    postWebsochatAssetRequestBestEffort({
      productId: 1182,
      episodeId: 27362,
      episodeNo: 51,
    })
  );
} finally {
  console.error = originalConsoleError;
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
  } else {
    delete globalThis.window;
  }
}
assert.equal(
  shouldPollViewerWebsochatReadiness({
    ...supportedViewerSource,
    websochatSyncedLatestEpisodeNo: 9,
  }),
  true
);
assert.equal(shouldPollViewerWebsochatReadiness(supportedViewerSource), false);
assert.equal(
  getViewerWebsochatReadinessRefetchInterval({
    websochatSupported: true,
    websochatContextStatus: "ready",
    websochatPublishedLatestEpisodeNo: 10,
    episodeNo: 10,
    websochatSyncedLatestEpisodeNo: 9,
  }),
  60_000
);
assert.equal(
  getViewerWebsochatReadinessRefetchInterval(supportedViewerSource),
  false
);

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const viewerSource = readFileSync(
  new URL("../viewer/[id]/page.tsx", import.meta.url),
  "utf8"
);
const episodeQuerySource = readFileSync(
  new URL("../api/query/episode/index.ts", import.meta.url),
  "utf8"
);
const websochatButtonSource = readFileSync(
  new URL("../../components/menu/WebsochatButton.tsx", import.meta.url),
  "utf8"
);

assert.match(
  source,
  /const shouldAutoSendViewerLaunch =\s*pendingLaunchPayload\.launchSource === "viewer_bottom_nav"/
);
assert.match(
  source,
  /if \(launchActionModeKey === "qa" && !launchQaActionKey\) \{[\s\S]*if \(!shouldAutoSendViewerLaunch\) \{[\s\S]*return;[\s\S]*\}/
);
assert.match(
  source,
  /void handleSend\(pendingLaunchPayload\.action\.prompt, \{[\s\S]*starterModeKey: launchActionModeKey/
);
assert.match(
  viewerSource,
  /if \(clickOutcome === "modal"\) \{[\s\S]*postWebsochatAssetRequestBestEffort\([\s\S]*content: "아직 웹소챗\/주인공챗이 준비되지 않았어요\."[\s\S]*confirmText: "확인"[\s\S]*return;/
);
assert.match(
  viewerSource,
  /const websochatEligible =[\s\S]*websochatReadiness\?\.websochatEligible[\s\S]*if \(!episode \|\| !websochatEligible \|\| !episode\.episodeNo\) return;/
);
assert.match(
  episodeQuerySource,
  /useSelectViewerWebsochatReadiness[\s\S]*websochat-readiness[\s\S]*refetchInterval/
);
assert.doesNotMatch(
  websochatButtonSource,
  /aria-disabled=\{pending\}/,
  "Pending viewer chat must stay clickable so it can open the readiness modal"
);
assert.doesNotMatch(
  episodeQuerySource,
  /useSelectViewerPath[\s\S]{0,1200}refetchInterval/
);
assert.doesNotMatch(
  source,
  /pendingLaunchPayload\.launchSource === "viewer_bottom_nav"[\s\S]{0,300}setDraft/
);
assert.match(
  source,
  /const shouldHideWebsochatGameActions = websochatProductPriceType === "paid";/
);
assert.match(
  source,
  /withoutHiddenWebsochatGameActions\(starter, shouldHideWebsochatGameActions\)/
);
assert.match(
  source,
  /composerShortcutActions[\s\S]*isVisibleWebsochatComposerShortcutAction/
);
assert.match(
  source,
  /!shouldHideWebsochatGameActions \|\| isVisibleWebsochatShortcutAction\(action\)/
);
assert.doesNotMatch(
  source,
  /const visibleActionCards = \(actionCards \|\| \[\]\)\.filter\(isVisibleWebsochatShortcutAction\);/
);
assert.match(
  source,
  /allowedModes: enforcedActiveSessionAllowedModes/
);
assert.match(
  source,
  /if \(!isWebsochatModeAllowed\(resolvedModeKey, enforcedActiveSessionAllowedModes\)\) return;/
);
assert.match(
  source,
  /if \(!isWebsochatModeAllowed\(requestedModeKey, enforcedActiveSessionAllowedModes\)\) \{\s*return null;\s*\}/
);
assert.doesNotMatch(
  source,
  /availableShortcutActions\.find[\s\S]{0,240}DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS\.find/
);
