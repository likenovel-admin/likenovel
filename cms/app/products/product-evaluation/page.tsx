"use client";

import { useGetCmsProductEvaluations } from "@/api/cmsProductEvaluation";
import { IGetCmsProductEvaluationParams } from "@/api/cmsProductEvaluation/dto";
import ProductEvaluationTable from "@/app/products/product-evaluation/DataTable";
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
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";
import { useState } from "react";

const tabs = [
  { label: "무료", value: "free" },
  { label: "유료", value: "paid" },
] as const;

export default function ProductEvaluationPage() {
  const [filters, setFilters] = useState<IGetCmsProductEvaluationParams>({
    price_type: "free",
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });

  const { data, isLoading, isFetching, refetch } =
    useGetCmsProductEvaluations({
      price_type: filters.price_type,
      page: filters.page,
      count_per_page: filters.count_per_page,
      search_target: filters.search_target || undefined,
      search_word: filters.search_word || undefined,
    });

  const handleTabChange = (value: string) => {
    setFilters((prev) => ({ ...prev, price_type: value, page: 1 }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters((prev) => ({
      ...prev,
      search_target: "",
      search_word: "",
      page: 1,
    }));
  };

  const totalPages = calculatePageCount(
    data?.total_count || 0,
    filters.count_per_page || item_per_page
  );

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="작품 평가" />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant={filters.price_type === tab.value ? "default" : "outline"}
              onClick={() => handleTabChange(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search */}
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
            <SelectTrigger className="w-[150px]">
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
              if (e.key === "Enter") handleSearch();
            }}
          />

          <Button variant="outline" onClick={handleReset}>
            초기화
          </Button>
          <Button onClick={handleSearch}>검색</Button>
        </div>

        {/* Table */}
        <ProductEvaluationTable
          data={data?.results || []}
          loading={isLoading || isFetching}
          onSaveSuccess={() => refetch()}
        />

        {/* Pagination */}
        <PaginationControls
          page={filters.page || 1}
          setPage={(page) => setFilters((prev) => ({ ...prev, page }))}
          totalPages={totalPages}
        />

        <FullPageLoader isLoading={isLoading || isFetching} />
      </div>
    </SidebarInset>
  );
}
