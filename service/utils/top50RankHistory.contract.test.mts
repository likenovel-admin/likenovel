import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const backendRoot = resolve(
  repoRoot,
  "likenovel-service-api/likenovel-service-api/fastapi_be_server",
);

const read = (path: string) => readFileSync(path, "utf8");

const migrationPath = resolve(
  backendRoot,
  "dist/init/100-create-product-rank-snapshot-hourly.sql",
);
assert.equal(
  existsSync(migrationPath),
  true,
  "rank history needs a migration for tb_product_rank_snapshot_hourly",
);

const migration = read(migrationPath);
assert.match(
  migration,
  /CREATE TABLE IF NOT EXISTS tb_product_rank_snapshot_hourly/i,
  "rank history migration should create tb_product_rank_snapshot_hourly",
);
assert.match(
  migration,
  /PRIMARY KEY\s*\(\s*basis_at\s*,\s*area_code\s*,\s*rank_no\s*\)/i,
  "rank history snapshots should be unique by hour, area, and rank",
);
assert.match(
  migration,
  /KEY\s+idx_product_rank_snapshot_product_basis/i,
  "rank history should support product/date lookups",
);

const batch = read(resolve(backendRoot, "dist/batch/service_reset_hourly_batch.sql"));
assert.match(
  batch,
  /INSERT INTO tb_product_rank_snapshot_hourly/i,
  "hourly batch should store the rank result snapshot after calculating rankings",
);
assert.match(
  batch,
  /FROM tb_product_rank_area/i,
  "rank history snapshots should be captured from the final rank area table",
);
const deleteCurrentSnapshotIndex = batch.search(
  /DELETE FROM tb_product_rank_snapshot_hourly[\s\S]*?basis_at\s*=\s*@recent_24h_basis_at[\s\S]*?area_code\s+IN\s*\('freeSerialTop',\s*'paidSerialTop',\s*'paidEndTop',\s*'paidStandaloneTop'\)/i,
);
const insertSnapshotIndex = batch.search(
  /INSERT INTO tb_product_rank_snapshot_hourly/i,
);
assert.notEqual(
  deleteCurrentSnapshotIndex,
  -1,
  "hourly batch should delete the current basis/area snapshots before reinserting",
);
assert.ok(
  deleteCurrentSnapshotIndex < insertSnapshotIndex,
  "current basis/area snapshot delete should happen before rank history insert",
);
assert.match(
  batch,
  /INTERVAL 365 DAY/i,
  "rank history retention should keep one year of hourly snapshots",
);

const productQueryRouter = read(
  resolve(backendRoot, "app/routers/product/product_query.py"),
);
assert.match(
  productQueryRouter,
  /rank-history/,
  "backend should expose /v1/query/products/rank-history",
);

const productService = read(
  resolve(backendRoot, "app/services/product/product_service.py"),
);
assert.match(
  productService,
  /get_product_rank_history/,
  "backend service should build a date/hour ranking history payload",
);

const top50Api = read(resolve(repoRoot, "service/app/api/query/top50/index.ts"));
assert.match(
  top50Api,
  /useSelectTop50RankHistory/,
  "top50 query hooks should include the rank history API",
);

const top50Page = read(resolve(repoRoot, "service/components/top50/Top50Page.tsx"));
const top50ProductArea = read(
  resolve(repoRoot, "service/components/top50/ProductArea.tsx"),
);
assert.match(
  top50Page,
  /RankHistoryModal/,
  "Top50 page should open the hourly ranking history in a modal",
);
assert.match(
  top50ProductArea,
  /timeSpeechBubbleOnClick/,
  "Top50 page should expose rank history through the ranking time speech bubble",
);
assert.match(
  top50Page,
  /RANK_HISTORY_VISIBLE_FROM_KST\s*=\s*"2026-06-03"/,
  "rank history trigger should be temporarily visible for spacing review",
);
assert.match(
  top50Page,
  /isRankHistoryTriggerVisible=\{isRankHistoryTriggerVisible\}/,
  "Top50 page should gate the rank history speech bubble action by visibility date",
);
assert.doesNotMatch(
  top50Page,
  /시간대별 랭킹\s*<\/button>/,
  "Top50 page should not render a separate rank history button",
);

const mainHeader = read(resolve(repoRoot, "service/components/common/MainHeader.tsx"));
assert.match(
  mainHeader,
  /timeSpeechBubbleOnClick\?: \(\) => void/,
  "MainHeader should allow the time speech bubble to trigger rank history",
);
assert.match(
  mainHeader,
  /timeSpeechBubbleShowActionIndicator\?: boolean/,
  "MainHeader should allow a compact action indicator in the time speech bubble",
);

const freeTop = read(resolve(repoRoot, "service/components/main/FreeTop.tsx"));
assert.match(
  freeTop,
  /RankHistoryModal/,
  "main FreeTop should reuse the hourly ranking history modal",
);
assert.match(
  freeTop,
  /timeSpeechBubbleAriaLabel="시간대별 랭킹 보기"/,
  "main FreeTop should expose the rank history speech bubble as an accessible action",
);
assert.match(
  freeTop,
  /timeSpeechBubbleOnClick/,
  "main FreeTop rank history action should be attached to the ranking time speech bubble",
);
assert.match(
  freeTop,
  /timeSpeechBubbleShowActionIndicator=\{isRankHistoryTriggerVisible\}/,
  "main FreeTop rank history action should show a compact indicator when visible",
);
assert.doesNotMatch(
  freeTop,
  />\s*기록\s*</,
  "main FreeTop should not render a separate record button beside the guide icon",
);
assert.match(
  freeTop,
  /RANK_HISTORY_VISIBLE_FROM_KST\s*=\s*"2026-06-03"/,
  "main FreeTop rank history action should be temporarily visible for spacing review",
);

const rankHistoryModalPath = resolve(
  repoRoot,
  "service/components/top50/RankHistoryModal.tsx",
);
assert.equal(
  existsSync(rankHistoryModalPath),
  true,
  "rank history should have a dedicated PC modal component",
);
const rankHistoryModal = read(rankHistoryModalPath);
const snapshotWordingPattern = new RegExp("\\uC2A4\\uB0C5\\uC0F7");
assert.match(
  rankHistoryModal,
  /시간대별 랭킹/,
  "rank history modal should label the Munpia-style hourly ranking view",
);
assert.doesNotMatch(
  rankHistoryModal,
  snapshotWordingPattern,
  "rank history modal should not expose technical snapshot wording",
);
assert.match(
  rankHistoryModal,
  /max-h-\[calc\(86vh-145px\)\]\s+overflow-auto/,
  "rank history modal should keep horizontal scrolling visible inside the table viewport",
);
assert.match(
  rankHistoryModal,
  /scrollbarGutter:\s*"stable"/,
  "rank history modal should reserve visible scrollbar space for the hourly table",
);
assert.match(
  rankHistoryModal,
  /buildFullDayBasisTimes/,
  "rank history modal should synthesize a full 00-23h header even before all records exist",
);
assert.match(
  rankHistoryModal,
  /Array\.from\(\s*\{\s*length:\s*24\s*\}/,
  "rank history modal should render all 24 hourly columns",
);
assert.match(
  rankHistoryModal,
  /padStart\(\s*2\s*,\s*"0"\s*\)/,
  "rank history modal should label hours as 00시 through 23시",
);
assert.match(
  rankHistoryModal,
  /\$\{selectedDate\}\s+\$\{paddedHour\}:30:00/,
  "rank history modal should key synthesized hours to the hourly batch basis time at HH:30:00",
);
assert.match(
  rankHistoryModal,
  /cellsByBasisAt/,
  "rank history modal should map existing rank history cells by basisAt into the full-day columns",
);
