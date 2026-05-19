"use client";

import {
  useGetAiProductMetadataDetail,
  useGetAiProductMetadataList,
  usePostAiProductMetadataReanalyze,
  usePutAiProductMetadata,
  usePutAiProductMetadataExclude,
} from "@/api/aiProductMetadata";
import {
  AxisKey,
  IGetAiProductMetadataParams,
  IPutAiProductMetadataRequest,
} from "@/api/aiProductMetadata/dto";
import AiMetadataTable from "@/app/products/ai-metadata/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { item_per_page } from "@/constants/common";
import { isConfirmedEnter } from "@/lib/keyboard";
import { calculatePageCount, catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const parseStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const joinArrayForInput = (value: unknown): string => parseStringArray(value).join(", ");

const parseInputArray = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const AXIS_CONFIG: { key: AxisKey; label: string; helper?: string }[] = [
  { key: "세", label: "세(세계관)" },
  { key: "직", label: "직(주인공 직업)" },
  { key: "능", label: "능(주인공 능력/재료)" },
  { key: "연", label: "연(연애/케미)" },
  { key: "작", label: "작(작풍/톤)" },
  { key: "타", label: "타(주인공 유형)" },
  { key: "목", label: "목(주인공 목표)", helper: "콤마로 입력해도 첫 번째만 저장됩니다." },
];

const defaultAxisInputs: Record<AxisKey, string> = {
  세: "",
  직: "",
  능: "",
  연: "",
  작: "",
  타: "",
  목: "",
};

const defaultForm: IPutAiProductMetadataRequest = {
  protagonist_type: "",
  protagonist_desc: "",
  heroine_type: "",
  heroine_weight: "",
  mood: "",
  pacing: "",
  premise: "",
  hook: "",
  episode_summary_text: "",
  themes: [],
  similar_famous: [],
  taste_tags: [],
};

export default function AiMetadataPage() {
  const [filters, setFilters] = useState<IGetAiProductMetadataParams>({
    search_target: "",
    search_word: "",
    analysis_status: "all",
    exclude_from_recommend_yn: "all",
    page: 1,
    count_per_page: item_per_page,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [themesInput, setThemesInput] = useState("");
  const [similarInput, setSimilarInput] = useState("");
  const [tasteTagsInput, setTasteTagsInput] = useState("");
  const [axisInputs, setAxisInputs] = useState<Record<AxisKey, string>>({
    ...defaultAxisInputs,
  });
  const [form, setForm] = useState<IPutAiProductMetadataRequest>(defaultForm);

  const { data, isLoading, isFetching, refetch } = useGetAiProductMetadataList({
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
    analysis_status: filters.analysis_status || undefined,
    exclude_from_recommend_yn: filters.exclude_from_recommend_yn || undefined,
    page: filters.page,
    count_per_page: filters.count_per_page,
  });

  const { data: detailData, isLoading: isDetailLoading } = useGetAiProductMetadataDetail(
    selectedProductId,
    isEditOpen
  );

  const putMutation = usePutAiProductMetadata();
  const reanalyzeMutation = usePostAiProductMetadataReanalyze();
  const excludeMutation = usePutAiProductMetadataExclude();

  useEffect(() => {
    if (!detailData?.data) return;
    const d = detailData.data;
    const detailAxis = d.axis_labels || {};
    setForm({
      protagonist_type: d.protagonist_type || "",
      protagonist_desc: d.protagonist_desc || "",
      heroine_type: d.heroine_type || "",
      heroine_weight: d.heroine_weight || "",
      mood: d.mood || "",
      pacing: d.pacing || "",
      premise: d.premise || "",
      hook: d.hook || "",
      episode_summary_text: d.episode_summary_text || "",
      themes: parseStringArray(d.themes),
      similar_famous: parseStringArray(d.similar_famous),
      taste_tags: parseStringArray(d.taste_tags),
    });
    setAxisInputs({
      세: joinArrayForInput(detailAxis.세 || d.worldview_tags),
      직: joinArrayForInput(detailAxis.직 || d.protagonist_job_tags),
      능: joinArrayForInput(detailAxis.능 || d.protagonist_material_tags),
      연: joinArrayForInput(detailAxis.연 || d.axis_romance_tags),
      작: joinArrayForInput(detailAxis.작 || d.axis_style_tags),
      타: joinArrayForInput(detailAxis.타 || d.protagonist_type_tags),
      목: joinArrayForInput(
        detailAxis.목 || (d.protagonist_goal_primary ? [d.protagonist_goal_primary] : [])
      ),
    });
    setThemesInput(joinArrayForInput(d.themes));
    setSimilarInput(joinArrayForInput(d.similar_famous));
    setTasteTagsInput(joinArrayForInput(d.taste_tags));
  }, [detailData]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters((prev) => ({
      ...prev,
      search_target: "",
      search_word: "",
      analysis_status: "all",
      exclude_from_recommend_yn: "all",
      page: 1,
    }));
  };

  const handleOpenEdit = (productId: number) => {
    setSelectedProductId(productId);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProductId) return;

    const parsedAxis: Record<AxisKey, string[]> = {
      세: parseInputArray(axisInputs.세),
      직: parseInputArray(axisInputs.직),
      능: parseInputArray(axisInputs.능),
      연: parseInputArray(axisInputs.연),
      작: parseInputArray(axisInputs.작),
      타: parseInputArray(axisInputs.타),
      목: parseInputArray(axisInputs.목).slice(0, 1),
    };

    const protagonistType = (form.protagonist_type ?? "").trim() || parsedAxis.타[0] || "";
    const mood = (form.mood ?? "").trim() || parsedAxis.작[0] || "";
    const premise =
      (form.premise ?? "").trim() ||
      [parsedAxis.세[0], parsedAxis.능[0], parsedAxis.목[0]].filter(Boolean).join(", ");

    const payload: IPutAiProductMetadataRequest = {
      ...form,
      protagonist_type: protagonistType,
      mood,
      premise,
      protagonist_goal_primary: parsedAxis.목[0] || undefined,
      worldview_tags: parsedAxis.세,
      protagonist_job_tags: parsedAxis.직,
      protagonist_material_tags: parsedAxis.능,
      axis_romance_tags: parsedAxis.연,
      axis_style_tags: parsedAxis.작,
      protagonist_type_tags: parsedAxis.타,
      axis_labels: parsedAxis,
      themes: parseInputArray(themesInput),
      similar_famous: parseInputArray(similarInput),
      taste_tags: parseInputArray(tasteTagsInput),
    };

    if (!protagonistType || !mood || !premise) {
      showAlert("오류", "주인공 유형/분위기/핵심 소재를 확인해주세요. (7축 태그로 자동 보정 가능)", "확인");
      return;
    }

    try {
      await putMutation.mutateAsync({ product_id: selectedProductId, body: payload });
      showAlert("완료", "AI 메타정보를 저장했습니다.", "확인");
      setIsEditOpen(false);
      refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handleReanalyze = async (productId: number) => {
    const result = await confirm({
      title: "재분석을 실행할까요?",
      text: "최대 3회(초기 1 + 재시도 2) 시도 후 실패 시 실패 상태로 저장됩니다.",
      confirm: "실행",
      cancel: "취소",
    });
    if (!result.isConfirmed) return;

    try {
      await reanalyzeMutation.mutateAsync({ product_id: productId });
      showAlert("완료", "재분석이 완료되었습니다.", "확인");
      refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
      refetch();
    }
  };

  const handleToggleExclude = async (
    productId: number,
    currentValue: "Y" | "N"
  ) => {
    const nextValue: "Y" | "N" = currentValue === "Y" ? "N" : "Y";
    try {
      await excludeMutation.mutateAsync({
        product_id: productId,
        exclude_from_recommend_yn: nextValue,
      });
      refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const totalPages = useMemo(
    () => calculatePageCount(data?.total_count || 0, filters.count_per_page || item_per_page),
    [data?.total_count, filters.count_per_page]
  );

  return (
    <>
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="AI 작품 메타정보" />

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-4">
            <Select
              value={filters.search_target || "none"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  search_target: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="검색 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안함</SelectItem>
                <SelectItem value="product-title">작품명</SelectItem>
                <SelectItem value="author-name">작가명</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="w-[220px]"
              placeholder="검색어 입력"
              value={filters.search_word || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search_word: e.target.value }))
              }
              onKeyDown={(e) => {
                if (isConfirmedEnter(e)) handleSearch();
              }}
            />

            <Select
              value={filters.analysis_status || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, analysis_status: value }))
              }
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="분석 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">상태 전체</SelectItem>
                <SelectItem value="missing">미생성</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="success">성공</SelectItem>
                <SelectItem value="failed">실패</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.exclude_from_recommend_yn || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, exclude_from_recommend_yn: value }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="추천 제외" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">추천 제외 전체</SelectItem>
                <SelectItem value="N">추천 포함</SelectItem>
                <SelectItem value="Y">추천 제외</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
            <Button onClick={handleSearch}>검색</Button>
          </div>

          <AiMetadataTable
            data={data?.results || []}
            loading={isLoading || isFetching}
            onEdit={handleOpenEdit}
            onReanalyze={handleReanalyze}
            onToggleExclude={handleToggleExclude}
          />

          <PaginationControls
            page={filters.page || 1}
            setPage={(page) => setFilters((prev) => ({ ...prev, page }))}
            totalPages={totalPages}
          />
        </div>
      </SidebarInset>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedProductId(null);
            setForm(defaultForm);
            setAxisInputs({ ...defaultAxisInputs });
            setThemesInput("");
            setSimilarInput("");
            setTasteTagsInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI 메타정보 편집</DialogTitle>
            <DialogDescription>
              작품 ID: {selectedProductId || "-"} / 7축 태그를 우선 수정하고, 필요한 경우 아래 보조 필드를 조정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-gray-50 p-3">
            <h4 className="text-sm font-semibold mb-2">7축 태그 (권장)</h4>
            <div className="grid grid-cols-2 gap-4">
              {AXIS_CONFIG.map((axis) => (
                <div key={axis.key} className="flex flex-col gap-2">
                  <Label>{axis.label}</Label>
                  <Input
                    placeholder="콤마(,)로 구분"
                    value={axisInputs[axis.key]}
                    onChange={(e) =>
                      setAxisInputs((prev) => ({ ...prev, [axis.key]: e.target.value }))
                    }
                  />
                  {axis.helper ? (
                    <p className="text-xs text-muted-foreground">{axis.helper}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-semibold mb-2">보조 필드</h4>
            <p className="text-xs text-muted-foreground mb-3">
              주인공 유형/분위기/핵심 소재를 비워두면 7축 태그값으로 자동 보정됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>주인공 유형</Label>
              <Input
                value={form.protagonist_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, protagonist_type: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>주인공 설명</Label>
              <Input
                value={form.protagonist_desc}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, protagonist_desc: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>히로인 유형</Label>
              <Input
                value={form.heroine_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, heroine_type: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>히로인 비중 (high/mid/low/none)</Label>
              <Input
                value={form.heroine_weight}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, heroine_weight: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>분위기</Label>
              <Input
                value={form.mood}
                onChange={(e) => setForm((prev) => ({ ...prev, mood: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>전개 속도 (fast/medium/slow)</Label>
              <Input
                value={form.pacing}
                onChange={(e) => setForm((prev) => ({ ...prev, pacing: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>핵심 소재</Label>
            <Textarea
              rows={2}
              value={form.premise}
              onChange={(e) => setForm((prev) => ({ ...prev, premise: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <Label>1화 훅</Label>
            <Textarea
              rows={2}
              value={form.hook}
              onChange={(e) => setForm((prev) => ({ ...prev, hook: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <Label>작품요약 (예: 1화: 3문장 요약, 2화: 3문장 요약 ...)</Label>
            <Textarea
              rows={8}
              placeholder={"1화: ...\n2화: ...\n3화: ..."}
              value={form.episode_summary_text || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, episode_summary_text: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <Label>테마 태그 (콤마 구분)</Label>
            <Input value={themesInput} onChange={(e) => setThemesInput(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <Label>유사 유명작 (콤마 구분)</Label>
            <Input value={similarInput} onChange={(e) => setSimilarInput(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <Label>취향 태그 (콤마 구분)</Label>
            <Input value={tasteTagsInput} onChange={(e) => setTasteTagsInput(e.target.value)} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveEdit} disabled={putMutation.isPending || isDetailLoading}>
              {putMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FullPageLoader
        isLoading={
          isLoading ||
          isFetching ||
          isDetailLoading ||
          putMutation.isPending ||
          reanalyzeMutation.isPending ||
          excludeMutation.isPending
        }
      />
    </>
  );
}
