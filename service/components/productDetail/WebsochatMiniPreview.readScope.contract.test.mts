import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const coverAreaSource = readFileSync(
  new URL("./ProductCoverArea.tsx", import.meta.url),
  "utf8"
);
const miniPreviewSource = readFileSync(
  new URL("./WebsochatMiniPreview.tsx", import.meta.url),
  "utf8"
);
const productDetailSource = readFileSync(
  new URL("../../app/product/[id]/ProductDetailClient.tsx", import.meta.url),
  "utf8"
);

test("작품 상세는 인증별 읽기 범위 준비 완료 상태를 표지까지 전달한다", () => {
  assert.match(
    productDetailSource,
    /const \{\s*data: episodes,\s*isSuccess: isEpisodesSuccess,?\s*\} = useSelectEpisodes\(/
  );
  assert.doesNotMatch(productDetailSource, /isFetched: isEpisodesFetched/);
  assert.match(
    productDetailSource,
    /const isAuthIdentitySettled = isAuthInitialized && !isUserScopePending;/
  );
  assert.match(
    productDetailSource,
    /const hasRefreshedGuestReadProgress =\s*guestReadProgressReadyProductId === productId;/
  );
  assert.match(
    productDetailSource,
    /const isWebsochatReadScopeReady =\s*isAuthIdentitySettled &&\s*\(canUseUserScope\s*\? isEpisodesSuccess\s*:\s*hasRefreshedGuestReadProgress\);/
  );

  const coverAreaCall = productDetailSource.match(
    /<ProductCoverArea\b([\s\S]*?)\/>/
  )?.[1];
  assert.ok(coverAreaCall);
  assert.match(
    coverAreaCall,
    /isWebsochatReadScopeReady=\{isWebsochatReadScopeReady\}/
  );
});

test("작품 상세의 모든 미니 웹소챗이 기존 읽기 회차를 전달한다", () => {
  const miniPreviewCalls = [
    ...coverAreaSource.matchAll(/<WebsochatMiniPreview\b([\s\S]*?)\/>/g),
  ];

  assert.equal(miniPreviewCalls.length, 2);
  miniPreviewCalls.forEach(([, props]) => {
    assert.match(props, /accountReadEpisodeTo=\{latestEpisodeNo \?\? null\}/);
    assert.match(
      props,
      /isReadScopeReady=\{isWebsochatReadScopeReady\}/
    );
  });
});

test("미니 웹소챗은 유효한 읽기 회차만 세션과 모든 메시지 요청에 사용한다", () => {
  assert.match(
    miniPreviewSource,
    /accountReadEpisodeTo\?: number \| null;/
  );
  assert.match(miniPreviewSource, /isReadScopeReady: boolean;/);
  assert.match(
    miniPreviewSource,
    /const normalizedAccountReadEpisodeTo =\s*typeof accountReadEpisodeTo === "number" &&\s*Number\.isInteger\(accountReadEpisodeTo\) &&\s*accountReadEpisodeTo > 0\s*\? accountReadEpisodeTo\s*:\s*null;/
  );

  const createSessionBody = miniPreviewSource.match(
    /const created = await createSession\(\{([\s\S]*?)\}\);/
  )?.[1];
  const messageRequestBody = miniPreviewSource.match(
    /const requestBody = \{([\s\S]*?)\n\s*\};/
  )?.[1];

  assert.ok(createSessionBody);
  assert.match(
    createSessionBody,
    /account_read_episode_to: normalizedAccountReadEpisodeTo/
  );
  assert.ok(messageRequestBody);
  assert.match(
    messageRequestBody,
    /account_read_episode_to: normalizedAccountReadEpisodeTo/
  );
  assert.match(
    miniPreviewSource,
    /postWebsochatMessageStream\(\s*requestBody,/
  );
  assert.match(
    miniPreviewSource,
    /postWebsochatMessageOnce\(requestBody\)/
  );

  const createSessionSource = miniPreviewSource.match(
    /const ensurePreviewSession = async \(\) => \{([\s\S]*?)\n  \};/
  )?.[1];
  const submitSource = miniPreviewSource.match(
    /const handleSubmit = async \(event: FormEvent<HTMLFormElement>\) => \{([\s\S]*?)\n  \};/
  )?.[1];

  assert.ok(createSessionSource);
  assert.match(createSessionSource, /if \(!isReadScopeReady\) \{/);
  assert.ok(submitSource);
  assert.match(submitSource, /if \(!isReadScopeReady\) return;/);
  assert.match(
    miniPreviewSource,
    /readOnly=\{isSending \|\| !isReadScopeReady\}/
  );
  assert.match(
    miniPreviewSource,
    /disabled=\{!isReadScopeReady \|\| !hasInput \|\| isSending\}/
  );
});
