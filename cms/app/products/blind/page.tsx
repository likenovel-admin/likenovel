"use client";

import { useBatchBlind, useBatchOpen, useGetBlindList } from "@/api/blind";
import { IGetBlindListParams } from "@/api/blind/dto";
import BlindDataTable from "@/app/products/blind/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import { calculatePageCount, showAlert } from "@/lib/utils";
import { useState } from "react";

export default function BlindPage() {
  const [filters, setFilters] = useState<IGetBlindListParams>({
    page: 1,
    count_per_page: 50,
    blind_yn: "",
    search_target: "",
    search_word: "",
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, isLoading, isFetching } = useGetBlindList({
    page: filters.page,
    count_per_page: filters.count_per_page,
    blind_yn: filters.blind_yn || undefined,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  const batchBlindMutation = useBatchBlind();
  const batchOpenMutation = useBatchOpen();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    setSelectedIds(new Set());
  };

  const handleReset = () => {
    setFilters({
      page: 1,
      count_per_page: 50,
      blind_yn: "",
      search_target: "",
      search_word: "",
    });
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const results = data?.results || [];
    const allSelected = results.every((r) => selectedIds.has(r.product_id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((r) => r.product_id)));
    }
  };

  const handleToggleBlind = (productId: number, blindYn: string) => {
    batchBlindMutation.mutate(
      { product_ids: [productId], blind_yn: blindYn },
      {
        onError: (error: any) => {
          showAlert("오류", error?.message || "블라인드 처리에 실패했습니다.", "확인");
        },
      }
    );
  };

  const handleBatchBlind = (blindYn: string) => {
    if (selectedIds.size === 0) return;
    const label = blindYn === "Y" ? "블라인드" : "블라인드 해제";
    batchBlindMutation.mutate(
      { product_ids: Array.from(selectedIds), blind_yn: blindYn },
      {
        onSuccess: () => {
          showAlert("완료", `${selectedIds.size}건 ${label} 처리되었습니다.`, "확인");
          setSelectedIds(new Set());
        },
        onError: (error: any) => {
          showAlert("오류", error?.message || `${label} 처리에 실패했습니다.`, "확인");
        },
      }
    );
  };

  const handleToggleOpen = (productId: number, openYn: string) => {
    batchOpenMutation.mutate(
      { product_ids: [productId], open_yn: openYn },
      {
        onError: (error: any) => {
          showAlert("오류", error?.message || "공개 상태 변경에 실패했습니다.", "확인");
        },
      }
    );
  };

  const totalPages = calculatePageCount(
    data?.total_count || 0,
    filters.count_per_page || 50
  );

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="작품 블라인드" />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.blind_yn || "none"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  blind_yn: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">전체</SelectItem>
                <SelectItem value="Y">블라인드</SelectItem>
                <SelectItem value="N">정상</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.search_target || "none"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  search_target: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="검색 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안함</SelectItem>
                <SelectItem value="product-title">작품명</SelectItem>
                <SelectItem value="product-id">작품ID</SelectItem>
                <SelectItem value="author-name">작가명</SelectItem>
                <SelectItem value="user-id">유저ID</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="w-[220px]"
              placeholder="검색어 입력"
              value={filters.search_word || ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  search_word: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
            />

            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
            <Button onClick={handleSearch}>검색</Button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(filters.count_per_page)}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  count_per_page: Number(value),
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50개씩</SelectItem>
                <SelectItem value="100">100개씩</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Batch actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
            <span className="text-sm font-medium">
              {selectedIds.size}건 선택
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBatchBlind("Y")}
              disabled={batchBlindMutation.isPending}
            >
              일괄 블라인드
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchBlind("N")}
              disabled={batchBlindMutation.isPending}
            >
              일괄 해제
            </Button>
          </div>
        )}

        {/* Table */}
        <BlindDataTable
          data={data?.results || []}
          loading={isLoading || isFetching}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleOpen={handleToggleOpen}
          onToggleBlind={handleToggleBlind}
        />

        <PaginationControls
          page={filters.page || 1}
          setPage={(page) =>
            setFilters((prev) => ({ ...prev, page }))
          }
          totalPages={totalPages}
        />

        <FullPageLoader isLoading={isLoading || isFetching} />
      </div>
    </SidebarInset>
  );
}
