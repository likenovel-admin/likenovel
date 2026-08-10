import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./ProductCoverArea.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /line-clamp-4 md:line-clamp-5/);
assert.match(source, /data\.trendindex && !isSynopsisOpen/);
assert.match(
  source,
  /data\.trendindex &&\s*user &&\s*\(isAdminCPEditor \|\| isAuthor\) &&/
);
assert.doesNotMatch(
  source,
  /relative w-full max-w-\[530px\] mt-10pxr/
);
assert.match(
  source,
  /relative w-full max-w-\[530px\] mt-6pxr/,
  "소개문은 작품 정보와 과하게 붙거나 벌어지지 않도록 6px 추가 여백을 사용해야 한다"
);
assert.match(source, /min-h-\[44px\]/);
assert.match(source, /w-full/);
assert.match(source, /\{isSynopsisOpen \? "접기" : "더보기"\}/);
assert.match(source, /aria-expanded=\{isSynopsisOpen\}/);
assert.match(source, /scrollIntoView\(\{\s*block:\s*"nearest",?\s*\}\)/);
assert.doesNotMatch(source, /top-\[99px\]/);
assert.doesNotMatch(source, /h-\[200px\]/);
assert.doesNotMatch(source, /overflow-auto/);
assert.doesNotMatch(
  source,
  /synopsisRef\.current\s*&&\s*!synopsisRef\.current\.contains/
);
assert.equal(
  source.match(/renderSynopsisText\(synopsisText\)/g)?.length,
  1,
  "소개문은 접힘/펼침 상태에서 같은 본문 노드를 재사용해야 한다"
);

assert.match(
  source,
  /className=\{`flex flex-col items-start gap-4pxr md:gap-10pxr w-full/,
  "모바일 작품 헤더는 제목과 같은 왼쪽 정렬축을 사용해야 한다"
);

const publicMetadataStart = source.indexOf(
  'className="flex w-full flex-wrap items-center gap-x-8pxr gap-y-2pxr md:gap-x-12pxr"'
);
const publicMetadataEnd = source.indexOf(
  "{user && (isAdminCPEditor || isAuthor) ? (",
  publicMetadataStart
);
const publicMetadata = source.slice(publicMetadataStart, publicMetadataEnd);

assert.ok(
  publicMetadataStart >= 0 && publicMetadataEnd > publicMetadataStart,
  "작가·날짜·회차·연재·유료전환 정보는 하나의 수평 줄바꿈 행이어야 한다"
);
assert.ok(
  publicMetadata.indexOf("<UserNickname") <
    publicMetadata.indexOf("latestEpisodeDateLabel") &&
    publicMetadata.indexOf("latestEpisodeDateLabel") <
      publicMetadata.indexOf("displayEpisodeCount") &&
    publicMetadata.indexOf("displayEpisodeCount") <
      publicMetadata.indexOf("getUpdateFrequency") &&
    publicMetadata.indexOf("getUpdateFrequency") <
      publicMetadata.indexOf("paidOpenDateLabel"),
  "공개 작품 정보는 작가·최근일·회차·연재·유료전환 순서를 유지해야 한다"
);

const desktopActionsStart = source.indexOf(
  'className={`hidden md:grid gap-8pxr'
);
const desktopActionsEnd = source.indexOf(
  "{isShowButtonProposal && (",
  desktopActionsStart
);
const desktopActions = source.slice(desktopActionsStart, desktopActionsEnd);

assert.ok(desktopActionsStart >= 0 && desktopActionsEnd > desktopActionsStart);
assert.match(desktopActions, /w-\[488px\] grid-cols-2/);
assert.match(desktopActions, /w-\[240px\] grid-cols-1/);
assert.ok(
  desktopActions.indexOf("<WebsochatEntryCtas") <
    desktopActions.indexOf("<Button"),
  "PC에서는 채팅 CTA가 첫화 보기 바로 왼쪽에 있어야 한다"
);

const mobileActionsStart = source.indexOf('className={`grid gap-5pxr');
const mobileActionsEnd = source.indexOf(
  "<WebsochatMiniPreview",
  mobileActionsStart
);
const mobileActions = source.slice(mobileActionsStart, mobileActionsEnd);

assert.ok(mobileActionsStart >= 0 && mobileActionsEnd > mobileActionsStart);
assert.match(mobileActions, /grid-cols-2/);
assert.match(mobileActions, /grid-cols-1/);
assert.ok(
  mobileActions.indexOf("<WebsochatEntryCtas") <
    mobileActions.indexOf("<Button"),
  "모바일에서도 채팅 CTA가 첫화 보기 바로 왼쪽에 있어야 한다"
);

console.log("ProductCoverArea synopsis contract tests passed");
