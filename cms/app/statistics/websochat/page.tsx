"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { useGetStatisticWebsochatUsage } from "@/api/statistic";
import { IGetStatisticWebsochatUsageParams } from "@/api/statistic/dto";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import PaginationControls from "@/components/common/PaginationControls";
import FullPageLoader from "@/components/common/FullPageLoader";
import CommonTable, { Column } from "@/components/common/CommonTable";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";
import UsageTable from "@/app/statistics/websochat/UsageTable";

const summaryLabels: Record<string, string> = {
  total_turn_count: "전체 턴",
  session_count: "세션",
  product_count: "작품",
  user_count: "회원",
  charged_turn_count: "과금 턴",
  charged_cash: "차감 캐시",
  fallback_count: "Fallback",
};

const modelColumns: Column[] = [
  { header: "모델", key: "model_used" },
  { header: "턴", key: "turn_count" },
  { header: "차감 캐시", key: "charged_cash" },
  { header: "Fallback", key: "fallback_count" },
];

const routeColumns: Column[] = [
  { header: "라우트", key: "route_mode" },
  { header: "턴", key: "turn_count" },
  { header: "차감 캐시", key: "charged_cash" },
];

export default function Page() {
  const [filters, setFilters] = useState<IGetStatisticWebsochatUsageParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
    product_id: undefined,
    model_used: "",
    route_mode: "",
    fallback_used: "",
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const queryParams = useMemo<IGetStatisticWebsochatUsageParams>(() => ({
    ...filters,
    start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
  }), [filters, startDate, endDate]);

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticWebsochatUsage(queryParams);

  useEffect(() => {
    refetch();
  }, [queryParams, refetch]);

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    refetch();
  };

  const productColumns: Column[] = [
    {
      header: "작품 ID",
      key: "product_id",
      render: (value) => (
        <button
          type="button"
          className="font-medium text-blue-600 underline-offset-2 hover:underline"
          onClick={() => setFilters((prev) => ({ ...prev, page: 1, product_id: Number(value) }))}
        >
          {value}
        </button>
      ),
    },
    { header: "작품", key: "product_title" },
    { header: "턴", key: "turn_count" },
    { header: "세션", key: "session_count" },
    { header: "차감 캐시", key: "charged_cash" },
  ];

  const summary = data?.summary || {};

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="웹소챗 사용량" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
          <SearchByDateRange
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={filters.search_target || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, search_target: e.target.value }))}
          >
            <option value="">전체 검색</option>
            <option value="email">이메일</option>
            <option value="nickname">닉네임</option>
            <option value="product_title">작품명</option>
            <option value="session_title">세션명</option>
          </select>
          <Input
            className="w-[260px]"
            placeholder="검색어"
            value={filters.search_word || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, search_word: e.target.value }))}
          />
          <Input
            className="w-[130px]"
            inputMode="numeric"
            placeholder="작품 ID"
            value={filters.product_id || ""}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value && !/^\d+$/.test(value)) return;
              setFilters((prev) => ({
                ...prev,
                product_id: value ? Number(value) : undefined,
              }));
            }}
          />
          <Input
            className="w-[160px]"
            placeholder="모델(gemini 등)"
            value={filters.model_used || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, model_used: e.target.value }))}
          />
          <Input
            className="w-[180px]"
            placeholder="라우트(exact 등)"
            value={filters.route_mode || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, route_mode: e.target.value }))}
          />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={filters.fallback_used || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, fallback_used: e.target.value }))}
          >
            <option value="">Fallback 전체</option>
            <option value="Y">Fallback 사용</option>
            <option value="N">Fallback 미사용</option>
          </select>
          <Button onClick={handleSearch}>검색</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {Object.entries(summaryLabels).map(([key, label]) => (
            <div key={key} className="rounded-lg border bg-white p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-2 text-2xl font-semibold">{Number((summary as any)[key] || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">모델별</h2>
            <CommonTable columns={modelColumns} data={data?.model_summary || []} loading={isLoadingData || isFetching} />
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">라우트별 TOP20</h2>
            <CommonTable columns={routeColumns} data={data?.route_summary || []} loading={isLoadingData || isFetching} />
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">작품별 TOP10</h2>
            <CommonTable columns={productColumns} data={data?.product_summary || []} loading={isLoadingData || isFetching} />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">상세 로그</h2>
            <span className="text-sm text-muted-foreground">총 {(data?.total_count || 0).toLocaleString()}건</span>
          </div>
          <UsageTable data={data?.results || []} loading={isLoadingData || isFetching} />
          <div className="mt-4">
            <PaginationControls
              page={filters.page || 1}
              setPage={setPage}
              totalPages={calculatePageCount(data?.total_count || 0, item_per_page)}
            />
          </div>
        </div>

        <FullPageLoader isLoading={isLoadingData || isFetching} />
      </div>
    </SidebarInset>
  );
}
