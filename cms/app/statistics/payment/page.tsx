"use client";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import PaginationControls from "@/components/common/PaginationControls";
import {
  getStatisticPaymentDownload,
  getStatisticSiteDownload,
  useGetStatisticPayment,
} from "@/api/statistic";
import { item_per_page } from "@/constants/common";
import { format } from "date-fns";
import { downloadExcel } from "@/lib/excelDownload";
import FullPageLoader from "@/components/common/FullPageLoader";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import StatisticsTable from "@/app/statistics/payment/StatisticsTable";

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
  } = useGetStatisticPayment({
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
      apiFn: getStatisticPaymentDownload,
      params: {
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      },
      headers: [
        "Date",
        "결제 횟수",
        "결제 코인",
        "결제 금액",
        "코인 사용 횟수",
        "코인 사용량",
        "후원 횟수",
        "후원 코인",
        "광고 수익",
      ],
      fields: [
        "date",
        "pay_count",
        "pay_coin",
        "pay_amount",
        "use_coin_count",
        "use_coin",
        "donation_count",
        "donation_coin",
        "ad_revenue",
      ],
      filename: "Payment Statistics",
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };
  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="Payment Statistics" />
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
            totalPages={calculatePageCount(
              data?.total_count || 0,
              item_per_page
            )}
          />
          <FullPageLoader
            isLoading={isLoading || isLoadingData || isFetching}
          />
        </div>
      </SidebarInset>
    </>
  );
}
