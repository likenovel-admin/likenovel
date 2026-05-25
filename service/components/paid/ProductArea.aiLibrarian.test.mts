import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./ProductArea.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /useGetAiProductBriefs/);
assert.match(source, /listType === "list"/);
assert.match(source, /aiBriefsByProductId\.get\(product\.productId\)/);
assert.match(source, /enableAiLibrarianPreview/);
assert.match(source, /aiLibrarianBrief=/);
