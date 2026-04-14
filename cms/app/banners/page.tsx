"use client";

import { useGetBanners } from "@/api/banner";
import BannersTable from "@/app/banners/DataTable";
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
import { item_per_page } from "@/constants/common";
import {
  buildBannerListHref,
  parseBannerListFilters,
  type BannerPositionTabValue,
} from "@/lib/bannerListNavigation";
import { calculatePageCount } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

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
    count_per_page: item_per_page,
    position: filters.position === "all" ? undefined : filters.position,
    sort_by: filters.sortBy,
  });

  const handleChangePage = (page: number) => {
    updateFilters({ page });
  };

  const handlePositionChange = (position: BannerPositionTabValue) => {
    updateFilters({ position, page: 1 });
  };

  const handleSortChange = (sortBy: BannerSortOptionValue) => {
    updateFilters({ sortBy, page: 1 });
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
                  onClick={() => route.push(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button
              onClick={() =>
                route.push(
                  currentQuery ? `/banners/add?${currentQuery}` : "/banners/add"
                )
              }
            >
              + 배너 추가
            </Button>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    filters.position === "all" ? "default" : "outline"
                  }
                  onClick={() => handlePositionChange("all")}
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
              item_per_page
            )}
          />
          <FullPageLoader isLoading={isLoadingData || isFetching} />
        </div>
      </SidebarInset>
    </>
  );
}
