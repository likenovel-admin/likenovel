"use client";

import {
  useGetAiOnboardingProducts,
  usePutAiOnboardingProducts,
} from "@/api/aiOnboardingProduct";
import MultiProductSearch from "@/components/common/MultiProductSearch";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { IProduct } from "@/types/product";
import { useEffect, useMemo, useState } from "react";

type TagTabKey = "hero" | "worldTone" | "relation";
type SelectedTagMap = Record<TagTabKey, string[]>;

const toProductOption = (
  productId: number,
  title: string,
  coverUrl?: string | null
): IProduct => ({
  product_id: productId,
  title,
  synopsis: "",
  author_nickname: "",
  count_episode: 0,
  contract_type: null,
  cp_company_name: null,
  created_date: "",
  paid_open_date: null,
  isbn: null,
  uci: null,
  status_code: "",
  ratings_code: "",
  paid_yn: "N",
  primary_genre: null,
  sub_genre: null,
  primary_genre_id: null,
  sub_genre_id: null,
  single_regular_price: 0,
  series_regular_price: 0,
  paid_episode_no: null,
  free_episode_start_no: null,
  free_episode_end_no: null,
  price_type: "",
  monopoly_yn: "N",
  blind_yn: "N",
  cp_author_profit: 0,
  cp_contract_price: 0,
  cover_image_path: coverUrl || null,
  coverImagePath: coverUrl || null,
  thumbnail_file_path: coverUrl || null,
  thumbnailFilePath: coverUrl || null,
});

const createEmptySelectedTagMap = (): SelectedTagMap => ({
  hero: [],
  worldTone: [],
  relation: [],
});

const toUniqueTags = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const tag = (value || "").trim();
    if (!tag || seen.has(tag)) return;
    seen.add(tag);
    result.push(tag);
  });
  return result;
};

const areTagMapsEqual = (a: SelectedTagMap, b: SelectedTagMap) => {
  const keys: TagTabKey[] = ["hero", "worldTone", "relation"];
  return keys.every((key) => {
    if (a[key].length !== b[key].length) return false;
    return a[key].every((tag, idx) => tag === b[key][idx]);
  });
};

const buildInitialSelectedTagMap = (
  selectedTagTabs: { key: TagTabKey; tags: { tag: string }[] }[],
  allTagTabs: { key: TagTabKey; tags: { tag: string }[] }[]
) => {
  if (selectedTagTabs.length === 0) {
    const allTagMap = new Map<TagTabKey, string[]>(
      allTagTabs.map((tab) => [tab.key, toUniqueTags(tab.tags.map((item) => item.tag))])
    );
    return {
      hero: (allTagMap.get("hero") ?? []).slice(0, 10),
      worldTone: (allTagMap.get("worldTone") ?? []).slice(0, 10),
      relation: (allTagMap.get("relation") ?? []).slice(0, 10),
    };
  }

  const next = createEmptySelectedTagMap();

  selectedTagTabs.forEach((tab) => {
    next[tab.key] = toUniqueTags(tab.tags.map((item) => item.tag));
  });
  return next;
};

export default function AiOnboardingProductPage() {
  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [brokenImageMap, setBrokenImageMap] = useState<Record<number, boolean>>(
    {}
  );
  const [selectedTagMap, setSelectedTagMap] = useState<SelectedTagMap>(
    createEmptySelectedTagMap()
  );
  const [originSelectedTagMap, setOriginSelectedTagMap] = useState<SelectedTagMap>(
    createEmptySelectedTagMap()
  );
  const { data, isLoading, isFetching, refetch } = useGetAiOnboardingProducts();
  const saveMutation = usePutAiOnboardingProducts();

  const cdnBaseUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_HOST_CDN_URL?.trim();
    if (!raw) return "https://cdn.likenovel.net";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `https://${raw}`;
  }, []);

  const resolveCoverSrc = (path: string | null | undefined) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith("//")) return `https:${path}`;
    if (path.startsWith("/")) return `${cdnBaseUrl}${path}`;
    return `${cdnBaseUrl}/${path}`;
  };

  useEffect(() => {
    if (isDirty) return;
    const rows = data?.data ?? [];
    const allTagTabs = (data?.tag_tabs ?? []) as {
      key: TagTabKey;
      tags: { tag: string }[];
    }[];
    const selectedTagTabs = (data?.selected_tag_tabs ?? []) as {
      key: TagTabKey;
      tags: { tag: string }[];
    }[];
    const nextSelectedTagMap = buildInitialSelectedTagMap(selectedTagTabs, allTagTabs);

    setSelectedProducts(
      rows.map((row) => toProductOption(row.product_id, row.title, row.cover_url))
    );
    setSelectedTagMap(nextSelectedTagMap);
    setOriginSelectedTagMap(nextSelectedTagMap);
    setBrokenImageMap({});
  }, [data, isDirty]);

  const handleSelectedProductsChange: React.Dispatch<
    React.SetStateAction<IProduct[]>
  > = (value) => {
    setIsDirty(true);
    setSelectedProducts(value);
  };

  const selectedIds = useMemo(
    () => selectedProducts.map((product) => product.product_id),
    [selectedProducts]
  );
  const originIds = useMemo(
    () => (data?.data ?? []).map((row) => row.product_id),
    [data]
  );

  const hasChanges = useMemo(() => {
    const hasProductChanges =
      selectedIds.length !== originIds.length ||
      selectedIds.some((id, idx) => id !== originIds[idx]);
    const hasTagChanges = !areTagMapsEqual(selectedTagMap, originSelectedTagMap);
    return hasProductChanges || hasTagChanges;
  }, [originIds, originSelectedTagMap, selectedIds, selectedTagMap]);

  const coverUrlByProductId = useMemo(() => {
    const coverMap = new Map<number, string>();
    for (const row of data?.data ?? []) {
      if (row.cover_url) {
        coverMap.set(row.product_id, row.cover_url);
      }
    }
    for (const product of selectedProducts) {
      const existing =
        product.cover_image_path ||
        product.coverImagePath ||
        product.thumbnail_file_path ||
        product.thumbnailFilePath;
      if (existing && !coverMap.has(product.product_id)) {
        coverMap.set(product.product_id, existing);
      }
    }
    return coverMap;
  }, [data, selectedProducts]);
  const tagTabs = useMemo(() => data?.tag_tabs ?? [], [data]);

  const toggleTag = (tabKey: TagTabKey, tagName: string) => {
    setIsDirty(true);
    setSelectedTagMap((prev) => {
      const current = prev[tabKey];
      if (current.includes(tagName)) {
        return { ...prev, [tabKey]: current.filter((tag) => tag !== tagName) };
      }
      return { ...prev, [tabKey]: [...current, tagName] };
    });
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    setIsDirty(true);
    setSelectedProducts((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeItem = (productId: number) => {
    setIsDirty(true);
    setSelectedProducts((prev) =>
      prev.filter((product) => product.product_id !== productId)
    );
  };

  const handleSave = async () => {
    if (selectedIds.length < 3) {
      showAlert("오류", "온보딩 작품은 최소 3개 이상 필요합니다.", "확인");
      return;
    }
    if (selectedIds.length > 15) {
      showAlert("오류", "온보딩 작품은 최대 15개까지 설정 가능합니다.", "확인");
      return;
    }

    try {
      await saveMutation.mutateAsync({
        product_ids: selectedIds,
        hero_tags: selectedTagMap.hero,
        world_tone_tags: selectedTagMap.worldTone,
        relation_tags: selectedTagMap.relation,
      });
      showAlert("완료", "온보딩 작품 목록이 저장되었습니다.", "확인");
      setIsDirty(false);
      setOriginSelectedTagMap(selectedTagMap);
      refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="AI 온보딩 작품 관리" />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 text-sm text-muted-foreground">
            온보딩 팝업 노출 작품을 직접 관리합니다. 3~15개를 설정하고 순서를 조정하세요.
          </div>
          <MultiProductSearch
            selectedProducts={selectedProducts}
            setSelectedProducts={handleSelectedProductsChange}
          />
          <div className="mt-3 text-sm text-muted-foreground">
            선택 {selectedProducts.length}개 / 최소 3개, 최대 15개
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 text-sm font-medium">노출 순서</div>
          {selectedProducts.length === 0 ? (
            <div className="text-sm text-muted-foreground">선택된 작품이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {(() => {
                      const src = resolveCoverSrc(
                        coverUrlByProductId.get(product.product_id)
                      );
                      const isBroken = brokenImageMap[product.product_id] === true;
                      return src && !isBroken ? (
                        <img
                          src={src}
                          alt={product.title}
                          className="h-[64px] w-[44px] rounded object-cover"
                          onError={() =>
                            setBrokenImageMap((prev) => ({
                              ...prev,
                              [product.product_id]: true,
                            }))
                          }
                        />
                      ) : (
                        <div className="h-[64px] w-[44px] rounded bg-[#EEF1F6]" />
                      );
                    })()}
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {index + 1}순위 / ID {product.product_id}
                      </div>
                      <div className="truncate text-sm font-medium">
                        {product.title}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                    >
                      위로
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveItem(index, "down")}
                      disabled={index === selectedProducts.length - 1}
                    >
                      아래로
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(product.product_id)}
                    >
                      제거
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-1 text-sm font-medium">탭별 태그 보유현황 (전체 수집 기준)</div>
          <div className="mb-3 text-xs text-muted-foreground">
            빈도 높은 순으로 표시됩니다. 기본 선택은 각 탭 상위 10개이며, 수동 추가/제외할 수 있습니다.
          </div>
          {tagTabs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              표시할 태그 데이터가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {tagTabs.map((tab) => (
                <div key={tab.key} className="rounded-md border p-3">
                  <div className="mb-2 text-sm font-medium">
                    {tab.label} ({tab.tags.length}) / 선택 {selectedTagMap[tab.key].length}
                  </div>
                  {selectedTagMap[tab.key].length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {selectedTagMap[tab.key].map((tag) => (
                        <button
                          key={`${tab.key}-selected-${tag}`}
                          type="button"
                          onClick={() => toggleTag(tab.key, tag)}
                          className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-2 py-1 text-xs text-white"
                        >
                          #{tag} ✕
                        </button>
                      ))}
                    </div>
                  )}
                  {tab.tags.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      태그가 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tab.tags.map((item) => (
                        <button
                          key={`${tab.key}-${item.tag}`}
                          type="button"
                          onClick={() => toggleTag(tab.key, item.tag)}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
                            selectedTagMap[tab.key].includes(item.tag)
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "bg-slate-50 text-slate-700"
                          }`}
                        >
                          #{item.tag} · {item.count}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsDirty(false);
              setSelectedProducts(
                (data?.data ?? []).map((row) =>
                  toProductOption(row.product_id, row.title, row.cover_url)
                )
              );
              setSelectedTagMap(originSelectedTagMap);
              setBrokenImageMap({});
            }}
            disabled={!hasChanges}
          >
            되돌리기
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
          >
            저장
          </Button>
        </div>

        <FullPageLoader isLoading={isLoading || isFetching} />
      </div>
    </SidebarInset>
  );
}
