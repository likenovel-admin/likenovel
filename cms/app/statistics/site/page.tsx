"use client";

import { useEffect, useState } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import PageHeader from "@/components/ui/page-header";
import StatisticsTable from "./StatisticsTable";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import PaginationControls from "@/components/common/PaginationControls";
import { getStatisticSiteDownload, useGetStatisticSite } from "@/api/statistic";
import { item_per_page } from "@/constants/common";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { downloadExcel } from "@/lib/excelDownload";
import FullPageLoader from "@/components/common/FullPageLoader";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticSite({
    page,
    count_per_page: item_per_page,
    start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
  });

  useEffect(() => {
    refetch();
  }, [page, startDate, endDate]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getStatisticSiteDownload,
      params: {
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      },
      headers: [
        "Date",
        "방문자수",
        "페이지뷰",
        "로그인",
        "회원가입",
        "회원탈퇴",
        "DAU",
        "MAU",
        "DAU / MAU",
      ],
      fields: [
        "date",
        "visitors",
        "page_view",
        "login_count",
        "signin_count",
        "signoff_count",
        "DAU",
        "MAU",
        (item) => {
          const dau = item.DAU;
          const mau = item.MAU;
          if (!mau || mau === 0) return "-";
          const ratio = dau / mau;
          return `${ratio.toFixed(4)}%`;
        },
      ],
      filename: "Site Statistics",
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="Site Statistics" />
      <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
        <div className="flex justify-between">
          <SearchByDateRange
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
          <Button variant="outline" onClick={handleDownloadExcel}>
            엑셀 다운로드
          </Button>
        </div>
        <StatisticsTable
          data={data?.results ?? []}
          loading={isLoadingData || isFetching}
        />
        <PaginationControls
          page={page}
          setPage={setPage}
          totalPages={calculatePageCount(data?.total_count || 0, item_per_page)}
        />
        <FullPageLoader isLoading={isLoading || isLoadingData || isFetching} />
      </div>
    </SidebarInset>
  );
}
