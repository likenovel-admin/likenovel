"use client";

import { useApplyAiModelSetting, useGetAiModelSettings } from "@/api/aiModels";
import type { AiModelProvider, AiModelSetting } from "@/api/aiModels/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import {
  BILLING_ROUTE_LABELS,
  EDITABLE_BILLING_ROUTES,
  billingRouteDisabledReason,
  buildModelUpdate,
  createModelDraft,
  isEditableBillingRoute,
  isModelDraftDirty,
  isModelRevisionConflict,
  modelSaveErrorMessage,
  needsStructuredOutput,
  rebaseModelDraft,
  syncModelDraft,
} from "./modelSettings";

function ModelSettingRow({
  item,
  providers,
  refresh,
}: {
  item: AiModelSetting;
  providers: AiModelProvider[];
  refresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => createModelDraft(item));
  const [conflict, setConflict] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const update = useApplyAiModelSetting();
  const dirty = isModelDraftDirty(draft);
  const stale = dirty && draft.baseRevision !== item.revision;
  const structured = needsStructuredOutput(item);
  const needsTools = item.required_capabilities.includes("tools");
  const hiveRestriction = billingRouteDisabledReason(item, "hive", providers, draft.modelId);
  const inputId = `model-${item.feature_key}`;
  const routeId = `route-${item.feature_key}`;
  const feedbackId = `feedback-${item.feature_key}`;

  useEffect(() => {
    setDraft((current) => syncModelDraft(current, item));
  }, [item]);

  const apply = async () => {
    const prepared = buildModelUpdate(item, draft, providers);
    if (!prepared.body) {
      setFeedback({ kind: "error", message: prepared.error });
      return;
    }
    setFeedback(null);
    try {
      const response = await update.mutateAsync({
        featureKey: item.feature_key,
        body: prepared.body,
      });
      setDraft(createModelDraft(response.data));
      setConflict(false);
      setFeedback({ kind: "success", message: "저장했습니다. 다음 작업부터 적용됩니다." });
    } catch (error) {
      setFeedback({ kind: "error", message: modelSaveErrorMessage(error) });
      if (isModelRevisionConflict(error)) {
        setConflict(true);
        await refresh();
      }
    }
  };

  return (
    <TableRow>
      <TableCell className="w-[20%] align-top py-5">
        <div className="font-medium">{item.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{item.category}</div>
        <div className="mt-3 text-xs leading-5 text-muted-foreground">
          {needsTools ? "도구 호출 필요" : structured ? "JSON 출력 필요" : "일반 텍스트 생성"}
          <br />
          적용 시점: {item.job_boundary}
        </div>
      </TableCell>
      <TableCell className="w-[25%] align-top py-5">
        <div className="break-all font-mono text-xs leading-5">{item.model_id}</div>
        <div className="mt-2 text-sm">{BILLING_ROUTE_LABELS[item.billing_route]}</div>
        <div className="mt-1 text-xs text-muted-foreground">설정 버전 {item.revision}</div>
      </TableCell>
      <TableCell className="w-[35%] align-top py-5">
        <div className="space-y-3">
          <div>
            <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium">
              OpenRouter 모델 ID
            </label>
            <Input
              id={inputId}
              value={draft.modelId}
              onChange={(event) => {
                setDraft((current) => ({ ...current, modelId: event.target.value }));
                setFeedback(null);
              }}
              disabled={update.isPending}
              placeholder="deepseek/deepseek-v4.1-flash-1017"
              autoComplete="off"
              spellCheck={false}
              maxLength={200}
              aria-describedby={feedback ? feedbackId : undefined}
            />
          </div>
          <div>
            <label htmlFor={routeId} className="mb-1.5 block text-xs font-medium">
              결제 경로
            </label>
            <Select
              value={draft.billingRoute}
              disabled={update.isPending}
              onValueChange={(route) => {
                if (!isEditableBillingRoute(route)) return;
                setDraft((current) => ({ ...current, billingRoute: route }));
                setFeedback(null);
              }}
            >
              <SelectTrigger id={routeId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!isEditableBillingRoute(draft.billingRoute) && (
                  <SelectItem value={draft.billingRoute} disabled>
                    {BILLING_ROUTE_LABELS[draft.billingRoute]} (현재 경로)
                  </SelectItem>
                )}
                {EDITABLE_BILLING_ROUTES.map((route) => {
                  const disabledReason = billingRouteDisabledReason(item, route, providers, draft.modelId);
                  return (
                    <SelectItem key={route} value={route} disabled={Boolean(disabledReason)}>
                      {BILLING_ROUTE_LABELS[route]}
                      {disabledReason && (route === "hive" && needsTools ? " · 선택 불가" : " · 계정 미연결")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {needsTools && hiveRestriction && (
            <p className="text-xs leading-5 text-muted-foreground">
              Hive: {hiveRestriction}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[20%] align-top py-5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={apply} disabled={!dirty || update.isPending || stale || conflict}>
            {update.isPending ? "검증·저장 중…" : "검증 후 적용"}
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              disabled={update.isPending}
              onClick={() => {
                setDraft(createModelDraft(item));
                setConflict(false);
                setFeedback(null);
              }}
            >
              취소
            </Button>
          )}
        </div>
        {(stale || conflict) && (
          <div className="mt-3 space-y-2 text-xs leading-5">
            <p>저장된 설정이 변경되었습니다. 입력값은 유지했습니다.</p>
            {draft.baseRevision !== item.revision ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft((current) => rebaseModelDraft(current, item));
                  setConflict(false);
                  setFeedback(null);
                }}
              >
                최신 설정 확인 · 입력 유지
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                최신 설정 다시 조회
              </Button>
            )}
          </div>
        )}
        {feedback && (
          <p
            id={feedbackId}
            role={feedback.kind === "error" ? "alert" : "status"}
            className={`mt-3 text-xs leading-5 ${feedback.kind === "error" ? "text-destructive" : "text-foreground"}`}
          >
            {feedback.message}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function Page() {
  const { data, error, isLoading, isFetching, refetch } = useGetAiModelSettings();
  const refresh = async () => {
    await refetch();
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <div className="flex flex-1 flex-col gap-6 p-4 py-8 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">AI 모델 관리</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              기능별 모델과 결제 경로를 설정합니다. 진행 중인 작업은 기존 설정을 유지하고,
              변경한 설정은 다음 작업부터 적용됩니다.
            </p>
          </div>
          <Button variant="outline" disabled={isFetching} onClick={() => void refresh()}>
            {isFetching ? "조회 중…" : "새로고침"}
          </Button>
        </header>

        {error && (
          <div className="rounded-md border border-destructive p-4 text-sm" role="alert">
            설정을 조회하지 못했습니다. {modelSaveErrorMessage(error)}
            {data && <p className="mt-1">마지막 조회 내용과 편집 중인 입력값을 표시합니다.</p>}
          </div>
        )}

        {isLoading && <p role="status">모델 설정을 불러오는 중입니다.</p>}

        {data && (
          <>
            <section aria-labelledby="provider-heading" className="space-y-2">
              <h2 id="provider-heading" className="text-sm font-medium">연결된 결제 경로</h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {data.data.providers.map((provider) => (
                  <li key={provider.id}>
                    {provider.label}: {provider.configured ? `계정 ${provider.account_count}개 연결` : "계정 미연결"}
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-5 text-muted-foreground">
                연결된 계정 수는 잔액을 보장하지 않습니다. 선택한 서비스의 계정 크레딧이 모두
                소진되면 OpenRouter를 사용합니다.
              </p>
            </section>

            <section aria-label="기능별 AI 모델 설정" className="overflow-hidden rounded-lg border bg-background">
              {data.data.items.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">등록된 AI 모델 항목이 없습니다.</p>
              ) : (
                <Table className="min-w-[1050px]" classNameWrap="px-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>기능</TableHead>
                      <TableHead>저장된 설정</TableHead>
                      <TableHead>변경할 설정</TableHead>
                      <TableHead>적용</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.items.map((item) => (
                      <ModelSettingRow
                        key={item.feature_key}
                        item={item}
                        providers={data.data.providers}
                        refresh={refresh}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
            <p className="text-xs leading-5 text-muted-foreground">
              적용할 때 모델 제공 여부와 요청 형식 지원을 확인합니다. 실제 생성 응답의 품질이나
              JSON 파싱 성공을 보장하는 검사는 아닙니다.
            </p>
          </>
        )}
      </div>
    </SidebarInset>
  );
}
