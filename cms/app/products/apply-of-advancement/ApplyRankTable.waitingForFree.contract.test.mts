import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const table = readFileSync(path.join(here, "ApplyRankTable.tsx"), "utf8");
const api = readFileSync(
  path.join(here, "../../../api/applyRank/index.ts"),
  "utf8"
);
const dto = readFileSync(
  path.join(here, "../../../api/applyRank/dto.ts"),
  "utf8"
);

assert.match(table, /DEFAULT_PAID_EPISODE_NO = 26/);
assert.match(
  table,
  /Math\.min\(DEFAULT_PAID_EPISODE_NO, maxPaidEpisodeNo\)/
);
assert.match(table, /id="waitingForFreeEnabled"[^>]*checked/);
assert.match(table, /DEFAULT_WAITING_FOR_FREE_PERIOD_MONTHS = 12/);
for (const value of [3, 6, 12, 36]) {
  assert.match(table, new RegExp(`value: ${value}`));
}
assert.match(api, /waiting_for_free_enabled/);
assert.match(api, /waiting_for_free_period_months/);
assert.match(dto, /waitingForFreeActivationDelayMinutes/);
assert.match(dto, /waitingForFreeDirectSlotManual/);

console.log("ApplyRankTable waiting-for-free contract OK");
