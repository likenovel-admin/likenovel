import assert from "node:assert/strict";
import { buildViewerPath } from "./viewerPath.ts";

{
  assert.equal(
    buildViewerPath(123, {
      productId: 456,
      entrySource: "ai_taste_section",
    }),
    "/viewer/123?productId=456&entrySource=ai_taste_section"
  );
}

{
  assert.equal(
    buildViewerPath(123, {
      productId: 456,
      entrySource: "  ",
    }),
    "/viewer/123?productId=456"
  );
}
