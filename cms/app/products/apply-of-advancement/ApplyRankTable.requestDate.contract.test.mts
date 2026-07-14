import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const tablePath = path.resolve(
  process.cwd(),
  "app/products/apply-of-advancement/ApplyRankTable.tsx",
);
const source = fs.readFileSync(tablePath, "utf8");

assert.match(source, /key:\s*"req_apply_date"/);
assert.match(source, /row\.req_apply_date/);
assert.doesNotMatch(source, /row\?\.apply_date|row\.apply_date/);

console.log("ApplyRankTable request-date contract passed");
