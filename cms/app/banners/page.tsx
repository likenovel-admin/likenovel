"use client";

import { useGetBanners, useReorderBanners } from "@/api/banner";
import BannersTable from "@/app/banners/DataTable";
import SortableBannersTable from "@/app/banners/SortableBannersTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  bannerPositions,
  bannerSortOptions,
  type BannerSortOptionValue,
} from "@/constants/banner";
import { banner_per_page } from "@/constants/common";
import {
  buildBannerListHref,
  parseBannerListFilters,
  type BannerPositionTabValue,
} from "@/lib/bannerListNavigation";
import {
  calculatePageCount,
  catchErrorMessage,
  confirm,
  showAlert,
} from "@/lib/utils";
import { IBanner } from "@/types/banner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const tabs = [
  {
    label: "배너",
    value: "/banners",
  },
  {
    label: "팝업",
    value: "/popups",
  },
] as const;

// "main-top" → { position: "main", division: "top" }
// "viewer"   → { position: "viewer", division: null }
function splitPositionValue(value: string): { position: string; division: string | null } {
  if (value.startsWith("main-")) {
    return { position: "main", division: value.replace("main-", "") };
  }
  return { position: value, division: null };
}

export default function Page() {
  const route = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseBannerListFilters(searchParams),
    [searchParams]
  );
  const currentQuery = searchParams.toString();

  const updateFilters = (
    nextFilters: Partial<{
      page: number;
      position: BannerPositionTabValue;
      sortBy: BannerSortOptionValue;
    }>
  ) => {
    route.replace(
      buildBannerListHref({
        ...filters,
        ...nextFilters,
      }),
      { scroll: false }
    );
  };

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetBanners({
    page: filters.page,
    count_per_page: banner_per_page,
    position: filters.position === "all" ? undefined : filters.position,
    sort_by: filters.sortBy,
  });

  const reorderBanners = useReorderBanners();

  // 편집 모드 state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftItems, setDraftItems] = useState<IBanner[]>([]);

  // 편집 가능 조건: 특정 포지션 선택 + 한 페이지 내에 전부 들어옴
  const totalCount = data?.total_count ?? 0;
  const canReorder =
    filters.position !== "all" &&
    (data?.results?.length ?? 0) > 1 &&
    totalCount <= banner_per_page;

  // 새로고침/탭닫기 시 경고
  useEffect(() => {
    if (!isReorderMode) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isReorderMode]);

  const handleChangePage = async (page: number) => {
    if (isReorderMode) return;
    updateFilters({ page });
  };

  const handlePositionChange = async (position: BannerPositionTabValue) => {
    if (isReorderMode) {
      const res = await confirm({
        title: "순서 변경을 취소하고 이동하시겠습니까?",
        text: "저장하지 않은 순서 변경 내용이 사라집니다.",
        confirm: "이동",
        cancel: "머무르기",
      });
      if (!res.isConfirmed) return;
      setIsReorderMode(false);
      setDraftItems([]);
    }
    updateFilters({ position, page: 1 });
  };

  const handleSortChange = (sortBy: BannerSortOptionValue) => {
    if (isReorderMode) return;
    updateFilters({ sortBy, page: 1 });
  };

  const handleTabChange = async (value: string) => {
    if (isReorderMode) {
      const res = await confirm({
        title: "순서 변경을 취소하고 이동하시겠습니까?",
        text: "저장하지 않은 순서 변경 내용이 사라집니다.",
        confirm: "이동",
        cancel: "머무르기",
      });
      if (!res.isConfirmed) return;
      setIsReorderMode(false);
      setDraftItems([]);
    }
    route.push(value);
  };

  const enterReorderMode = () => {
    if (!canReorder || !data?.results) return;
    setDraftItems(data.results);
    setIsReorderMode(true);
  };

  const cancelReorder = async () => {
    const changed = isOrderChanged(data?.results ?? [], draftItems);
    if (changed) {
      const res = await confirm({
        title: "순서 변경을 취소하시겠습니까?",
        text: "저장하지 않은 변경 내용이 사라집니다.",
        confirm: "취소",
        cancel: "돌아가기",
      });
      if (!res.isConfirmed) return;
    }
    setIsReorderMode(false);
    setDraftItems([]);
  };

  const resetToOriginal = () => {
    setDraftItems(data?.results ?? []);
  };

  const saveReorder = async () => {
    if (!data?.results || draftItems.length === 0) return;
    if (!isOrderChanged(data.results, draftItems)) {
      showAlert("알림", "변경된 순서가 없습니다.", "확인");
      return;
    }
    if (filters.position === "all") return;

    const { position, division } = splitPositionValue(filters.position);
    const items = draftItems.map((b, idx) => ({
      id: b.id,
      show_order: idx + 1,
    }));

    reorderBanners.mutate(
      { position, division, items },
      {
        onSuccess: async () => {
          setIsReorderMode(false);
          setDraftItems([]);
          // 정렬을 show_order_asc로 고정하여 결과를 바로 확인
          if (filters.sortBy !== "show_order_asc") {
            updateFilters({ sortBy: "show_order_asc", page: 1 });
          } else {
            await refetch();
          }
          showAlert("완료", "배너 순서가 저장되었습니다.", "확인");
        },
        onError: (err) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  const activePositionLabel = useMemo(() => {
    if (filters.position === "all") {
      return "전체 위치";
    }

    return (
      bannerPositions.find((position) => position.value === filters.position)
        ?.label ?? "전체 위치"
    );
  }, [filters.position]);

  const orderChanged = isOrderChanged(data?.results ?? [], draftItems);

  return (
    <>
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="배너 및 팝업 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4">
            <div className="flex flex-wrap items-center gap-2 px-4">
              {tabs.map((item, index) => (
                <Button
                  key={`tab-${index}`}
                  variant={pathname == item.value ? "default" : "outline"}
                  onClick={() => handleTabChange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isReorderMode ? (
                <>
                  <Button
                    variant="outline"
                    disabled={!canReorder}
                    onClick={enterReorderMode}
                    title={
                      !canReorder
                        ? "특정 포지션을 선택하고 한 페이지 내에 있을 때만 순서 변경이 가능합니다"
                        : undefined
                    }
                  >
                    순서 변경
                  </Button>
                  <Button
                    onClick={() =>
                      route.push(
                        currentQuery
                          ? `/banners/add?${currentQuery}`
                          : "/banners/add"
                      )
                    }
                  >
                    + 배너 추가
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={resetToOriginal}>
                    원래대로
                  </Button>
                  <Button variant="outline" onClick={cancelReorder}>
                    취소
                  </Button>
                  <Button
                    onClick={saveReorder}
                    disabled={!orderChanged || reorderBanners.isPending}
                  >
                    저장
                  </Button>
                </>
              )}
            </div>
          </div>

          {isReorderMode && (
            <div className="mx-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
              <b>● 순서 변경 중</b> — 드래그하거나 위치 숫자를 입력한 뒤 <b>저장</b>을 누르세요.
              저장하지 않고 벗어나면 변경 사항이 사라집니다.
            </div>
          )}

          <div className="rounded-lg border bg-background p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    filters.position === "all" ? "default" : "outline"
                  }
                  onClick={() => handlePositionChange("all")}
                  disabled={isReorderMode}
                >
                  전체
                </Button>
                {bannerPositions.map((position) => (
                  <Button
                    key={position.value}
                    variant={
                      filters.position === position.value
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handlePositionChange(position.value)}
                    disabled={isReorderMode}
                  >
                    {position.shortLabel}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <p className="text-sm text-muted-foreground">
                  {activePositionLabel} 배너를 보고 있습니다.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">정렬</span>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      handleSortChange(value as BannerSortOptionValue)
                    }
                    disabled={isReorderMode}
                  >
                    <SelectTrigger className="w-[220px] bg-background">
                      <SelectValue placeholder="정렬 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {bannerSortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {isReorderMode ? (
            <SortableBannersTable
              data={draftItems}
              onOrderChange={setDraftItems}
            />
          ) : (
            <>
              <BannersTable
                data={data?.results ?? []}
                loading={isLoadingData || isFetching}
                listQuery={currentQuery}
                refetch={() => {
                  refetch();
                }}
              />
              <PaginationControls
                page={filters.page || 1}
                setPage={handleChangePage}
                totalPages={calculatePageCount(
                  data?.total_count || 0,
                  banner_per_page
                )}
              />
            </>
          )}
          <FullPageLoader
            isLoading={isLoadingData || isFetching || reorderBanners.isPending}
          />
        </div>
      </SidebarInset>
    </>
  );
}

function isOrderChanged(original: IBanner[], draft: IBanner[]): boolean {
  if (original.length !== draft.length) return true;
  for (let i = 0; i < original.length; i++) {
    if (original[i].id !== draft[i].id) return true;
  }
  return false;
}
