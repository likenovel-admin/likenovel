import assert from "node:assert/strict";
import { createFunnelRouteContext } from "./funnelRouteContext.ts";

const viewerContext = createFunnelRouteContext(
  "/viewer/5403",
  new URLSearchParams({
    productId: "634",
    entrySource: "ai_taste_section",
    lnr: "resume-token",
    title: "ignored",
    keep: "visible",
  })
);

assert.equal(viewerContext.rawFullPath, "/viewer/5403?productId=634&entrySource=ai_taste_section&lnr=resume-token&title=ignored&keep=visible");
assert.equal(viewerContext.fullPath, "/viewer/5403?keep=visible");
assert.equal(viewerContext.search, "?keep=visible");
assert.equal(viewerContext.viewerHintProductId, 634);
