import assert from "node:assert/strict";
import type { AiModelProvider, AiModelSetting } from "../../api/aiModels/dto.ts";
import {
  billingRouteDisabledReason,
  buildModelUpdate,
  createModelDraft,
  isModelDraftDirty,
  isModelRevisionConflict,
  modelSaveErrorMessage,
  rebaseModelDraft,
  syncModelDraft,
} from "./modelSettings.ts";

const item: AiModelSetting = {
  feature_key: "storyctx.signals",
  title: "인물 신호 추출",
  category: "작품 수집",
  model_id: "deepseek/deepseek-v4.1-flash-1017",
  billing_route: "openrouter",
  revision: 3,
  default_model_id: "deepseek/deepseek-v4.1-flash-1017",
  default_billing_route: "openrouter",
  required_capabilities: ["json_schema"],
  job_boundary: "작품 수집 시작",
};
const providers: AiModelProvider[] = [
  { id: "openrouter", label: "OpenRouter", account_count: 1, configured: true },
  { id: "hive", label: "Hive", account_count: 3, configured: true },
  { id: "river", label: "River AI", account_count: 5, configured: true },
];

const clean = createModelDraft(item);
assert.equal(isModelDraftDirty(clean), false);
const dirty = { ...clean, billingRoute: "river" as const };
assert.equal(isModelDraftDirty(dirty), true);
const newer = { ...item, model_id: "google/gemma-4-31b-it", revision: 4 };
assert.deepEqual(syncModelDraft(clean, newer), createModelDraft(newer));
assert.deepEqual(syncModelDraft(dirty, newer), dirty);
assert.equal(syncModelDraft(dirty, newer).baseRevision, 3);
assert.match(buildModelUpdate(newer, dirty, providers).error ?? "", /다른 곳/);

const reviewed = rebaseModelDraft(dirty, newer);
assert.equal(reviewed.modelId, dirty.modelId);
assert.equal(reviewed.billingRoute, "river");
assert.equal(reviewed.baseRevision, 4);
assert.deepEqual(buildModelUpdate(newer, reviewed, providers).body, {
  model_id: item.model_id,
  billing_route: "river",
  expected_revision: 4,
});

assert.equal(billingRouteDisabledReason(item, "hive", providers), null);
assert.equal(
  billingRouteDisabledReason({ ...item, required_capabilities: ["text"] }, "hive", providers),
  null
);
assert.match(
  billingRouteDisabledReason(item, "river", [{ ...providers[2], configured: false }]) ?? "",
  /계정/
);
assert.equal(buildModelUpdate(item, { ...clean, billingRoute: "hive" }, providers).body?.billing_route, "hive");
const toolItem = { ...item, required_capabilities: ["tools"] };
assert.match(billingRouteDisabledReason(toolItem, "hive", providers) ?? "", /도구 호출/);
assert.match(buildModelUpdate(toolItem, { ...clean, billingRoute: "hive" }, providers).error ?? "", /도구 호출/);
assert.equal(
  billingRouteDisabledReason(toolItem, "hive", providers, "another/model"),
  null,
  "Other models are checked by the authoritative backend capability validation."
);
assert.equal(
  buildModelUpdate(toolItem, { ...clean, modelId: "another/model", billingRoute: "hive" }, providers).body?.model_id,
  "another/model"
);
for (const modelId of ["", "https://openrouter.ai/deepseek/test", "deepseek/test model", "test", "deepseek/test\nmodel"]) {
  assert.match(buildModelUpdate(item, { ...clean, modelId }, providers).error ?? "", /모델 ID/);
}
assert.equal(
  buildModelUpdate(item, { ...dirty, modelId: `  ${item.model_id}  ` }, providers).body?.model_id,
  item.model_id
);
assert.match(
  buildModelUpdate(item, { ...dirty, billingRoute: "anthropic" }, providers).error ?? "",
  /결제 경로/
);

const conflict = Object.assign(new Error("conflict"), { statusCode: 409 });
assert.equal(isModelRevisionConflict(conflict), true);
assert.match(modelSaveErrorMessage(conflict), /입력값은 유지/);
assert.equal(isModelRevisionConflict(new Error("409")), false);
assert.equal(modelSaveErrorMessage(new Error("JSON Schema 미지원")), "JSON Schema 미지원");
assert.match(modelSaveErrorMessage(null), /적용하지 못했습니다/);

const saved = { ...item, billing_route: "river" as const, revision: 4 };
assert.equal(isModelDraftDirty(createModelDraft(saved)), false);
assert.equal(createModelDraft(saved).baseRevision, 4);
console.log("AI model settings draft, validation, and conflict checks passed.");
