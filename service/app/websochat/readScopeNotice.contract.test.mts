import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

assert.match(
  source,
  /const WEBSOCHAT_SCOPE_NOTICE_TTL_MS = 5_000;/,
  "read-scope notices should expire after five seconds"
);
assert.match(
  source,
  /kind: "mode" \| "action" \| "read_scope" \| "sync_pending";/,
  "read-scope notices should have a dedicated transient kind"
);
assert.match(
  source,
  /최신 회차는 아직 반영 중이에요\. 우선 \$\{[^}]+\} 무렵의 맥락에서 주인공과 새로운 이야기를 이어가볼게요\./,
  "sync-pending copy should describe the story experience instead of internal context"
);
assert.match(
  source,
  /isCharacterChatExperience[\s\S]*\? buildWebsochatReadScopeAppliedNotice\(\{[\s\S]*episodeNo: userReadEpisodeNo \|\| 1,[\s\S]*episodeTitle: userReadEpisodeTitle \|\| null,[\s\S]*isSyncPending: true,[\s\S]*\}\)[\s\S]*: buildWebsochatSyncPendingNotice\(syncedLatestEpisodeNo\)/,
  "character-chat sync notice should use the reader scope while regular websochat keeps the synced scope"
);
assert.match(
  source,
  /\$\{conversationScopeText\}까지 읽으셨네요\. 그 무렵의 맥락에서 주인공과 새로운 이야기를 이어가볼게요\./,
  "ready copy should acknowledge the reader's last episode"
);
assert.match(
  source,
  /filter\(\(item\) => !isTransientWebsochatScopeNoticeKind\(item\?\.kind\)\)/,
  "stored notices should discard legacy transient scope notices"
);
assert.match(
  source,
  /const persistentItems = items\.filter\([\s\S]*!isTransientWebsochatScopeNoticeKind\(item\.kind\)[\s\S]*\);/,
  "new transient scope notices should not be written to session storage"
);
assert.match(
  source,
  /window\.setTimeout\([\s\S]*WEBSOCHAT_SCOPE_NOTICE_TTL_MS/,
  "transient scope notices should be removed on a timer"
);
assert.match(
  source,
  /const handleSend = async[\s\S]*clearTransientWebsochatScopeNotices\(\);/,
  "starting a chat should dismiss the scope notice"
);
assert.match(
  source,
  /if \(characterChatChoices\.length === 0\) return;[\s\S]*clearTransientWebsochatScopeNotices\(\);/,
  "showing character-chat choices should dismiss the scope notice"
);
