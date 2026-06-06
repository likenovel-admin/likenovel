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
