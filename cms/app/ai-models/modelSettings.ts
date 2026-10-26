import type {
  AiModelProvider,
  AiModelSetting,
  BillingRoute,
  EditableBillingRoute,
  UpdateAiModelRequest,
} from "@/api/aiModels/dto";

export const BILLING_ROUTE_LABELS: Record<BillingRoute, string> = {
  openrouter: "OpenRouter",
  hive: "Hive",
  river: "River AI",
  gemini: "Gemini 직접 호출",
  anthropic: "Anthropic 직접 호출",
};

export const EDITABLE_BILLING_ROUTES: EditableBillingRoute[] = [
  "openrouter",
  "hive",
  "river",
];

export interface ModelSettingDraft {
  modelId: string;
  billingRoute: BillingRoute;
  baseModelId: string;
  baseBillingRoute: BillingRoute;
  baseRevision: number;
}

export function createModelDraft(item: AiModelSetting): ModelSettingDraft {
  return {
    modelId: item.model_id,
    billingRoute: item.billing_route,
    baseModelId: item.model_id,
    baseBillingRoute: item.billing_route,
    baseRevision: item.revision,
  };
}

export function isModelDraftDirty(draft: ModelSettingDraft): boolean {
  return (
    draft.modelId.trim() !== draft.baseModelId ||
    draft.billingRoute !== draft.baseBillingRoute
  );
}

export function syncModelDraft(
  draft: ModelSettingDraft,
  item: AiModelSetting
): ModelSettingDraft {
  return isModelDraftDirty(draft) ? draft : createModelDraft(item);
}

export function rebaseModelDraft(
  draft: ModelSettingDraft,
  item: AiModelSetting
): ModelSettingDraft {
  return {
    ...createModelDraft(item),
    modelId: draft.modelId,
    billingRoute: draft.billingRoute,
  };
}

export function needsStructuredOutput(item: AiModelSetting): boolean {
  return item.required_capabilities.some((capability) =>
    ["json_object", "json_schema", "structured_outputs", "tools"].includes(
      capability
    )
  );
}

export function isEditableBillingRoute(
  route: string
): route is EditableBillingRoute {
  return EDITABLE_BILLING_ROUTES.some((candidate) => candidate === route);
}

export function billingRouteDisabledReason(
  item: AiModelSetting,
  route: EditableBillingRoute,
  providers: AiModelProvider[],
  modelId: string = item.model_id
): string | null {
  if (
    route === "hive" &&
    modelId.trim() === "deepseek/deepseek-v4.1-flash-1017" &&
    item.required_capabilities.includes("tools")
  ) {
    return "Flash 1017의 Hive 도구 호출은 지원 확인에 실패하여 선택할 수 없습니다.";
  }
  if (!providers.find((provider) => provider.id === route)?.configured) {
    return "서버에 연결된 계정이 없습니다.";
  }
  return null;
}

export function buildModelUpdate(
  item: AiModelSetting,
  draft: ModelSettingDraft,
  providers: AiModelProvider[]
): { body: UpdateAiModelRequest; error?: never } | { body?: never; error: string } {
  if (draft.baseRevision !== item.revision) {
    return {
      error: "다른 곳에서 설정이 변경되었습니다. 현재 설정을 확인한 뒤 다시 적용해 주세요.",
    };
  }
  if (!isEditableBillingRoute(draft.billingRoute)) {
    return { error: "변경할 결제 경로를 선택해 주세요." };
  }
  const disabledReason = billingRouteDisabledReason(
    item,
    draft.billingRoute,
    providers,
    draft.modelId
  );
  if (disabledReason) return { error: disabledReason };
  const modelId = draft.modelId.trim();
  if (
    modelId.length > 200 ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(modelId)
  ) {
    return { error: "OpenRouter 모델 ID를 입력해 주세요. 예: deepseek/deepseek-v4.1-flash-1017" };
  }
  return {
    body: {
      model_id: modelId,
      billing_route: draft.billingRoute,
      expected_revision: draft.baseRevision,
    },
  };
}

export function isModelRevisionConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 409
  );
}

export function modelSaveErrorMessage(error: unknown): string {
  if (isModelRevisionConflict(error)) {
    return "다른 곳에서 설정이 변경되었습니다. 입력값은 유지했습니다. 현재 설정을 확인한 뒤 다시 적용해 주세요.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "설정을 적용하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.";
}
