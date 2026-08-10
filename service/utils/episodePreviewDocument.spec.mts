import assert from "node:assert/strict";

import {
  buildEpisodePreviewDocument,
  hasRenderableEpisodePreviewContent,
} from "./episodePreviewDocument.ts";

const documentHtml = buildEpisodePreviewDocument({
  title: "1화 <시작>",
  contentHtml:
    '<p>첫 문단 &amp; 특수문자 ★</p><p><br></p><p style="text-align: center">마지막 문단</p><script>parent.hacked = true</script>',
  settings: {
    fontFamily: "고딕",
    theme: "light",
    fontSize: 5,
    letterSpacing: 1,
    lineHeight: 2,
    marginSize: 2,
    useParagraphIndent: true,
  },
});

assert.match(documentHtml, /script-src 'none'/);
assert.match(documentHtml, /font-family: "Pretendard"/);
assert.match(documentHtml, /font-size: 17px/);
assert.match(documentHtml, /line-height: 1\.7em/);
assert.match(documentHtml, /text-indent: 1em/);
assert.match(documentHtml, /max-width: 920px/);
assert.match(documentHtml, /width: calc\(100vw - 40px\)/);
assert.match(documentHtml, /첫 문단 &amp; 특수문자 ★/);
assert.match(documentHtml, /<p><br><\/p>|<p><br\/><\/p>/);
assert.match(documentHtml, /<title>1화 &lt;시작&gt; 미리보기<\/title>/);
assert.doesNotMatch(documentHtml, /overflow-wrap:\s*anywhere/);

assert.equal(hasRenderableEpisodePreviewContent(""), false);
assert.equal(hasRenderableEpisodePreviewContent("<p><br></p>"), false);
assert.equal(
  hasRenderableEpisodePreviewContent("<p>&nbsp;\u200b&#xfeff;</p>"),
  false
);
assert.equal(hasRenderableEpisodePreviewContent("<p>본문</p>"), true);
assert.equal(
  hasRenderableEpisodePreviewContent('<p><img src="https://example.com/a.webp"></p>'),
  true
);

console.log("episodePreviewDocument tests passed");
