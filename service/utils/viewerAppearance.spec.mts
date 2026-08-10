import assert from "node:assert/strict";

import { resolveViewerAppearance } from "./viewerAppearance.ts";

const appearance = resolveViewerAppearance({
  fontFamily: "고딕",
  theme: "light",
  fontSize: 5,
  letterSpacing: 1,
  lineHeight: 2,
  marginSize: 2,
  useParagraphIndent: true,
});

assert.deepEqual(appearance, {
  fontFamily: "Pretendard",
  backgroundColor: "#f9f8f8",
  textColor: "#111317",
  fontSize: "17px",
  letterSpacing: "0px",
  lineHeight: "1.7em",
  paragraphIndent: "1em",
  desktopScrolledMaxWidth: "920px",
  mobileHorizontalGap: "40px",
});

assert.equal(
  resolveViewerAppearance({
    fontFamily: "명조체",
    theme: "dark",
    fontSize: 1,
    letterSpacing: 5,
    lineHeight: 5,
    marginSize: 5,
    useParagraphIndent: false,
  }).fontFamily,
  "NanumMyeongjo"
);

console.log("viewerAppearance tests passed");
