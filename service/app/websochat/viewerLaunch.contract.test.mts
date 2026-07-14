import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

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
