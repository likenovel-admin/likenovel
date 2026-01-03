"use client";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import PaginationControls from "@/components/common/PaginationControls";
import {
  getStatisticPaymentByUserDownload,
  useGetStatisticPaymentByUser,
} from "@/api/statistic";
import { item_per_page } from "@/constants/common";
import { format } from "date-fns";
import { downloadExcel } from "@/lib/excelDownload";
import FullPageLoader from "@/components/common/FullPageLoader";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import StatisticsTable from "@/app/statistics/consumption-by-user/StatisticsTable";
import { IGetStatisticPaymentByUserParams } from "@/api/statistic/dto";
import { SearchDateNText } from "@/components/common/SearchDateNText";

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetStatisticPaymentByUserParams>({
    page: 1,
    count_per_page: item_per_page,
    start_date: undefined,
    end_date: undefined,
    search_target: "",
    search_word: "",
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticPaymentByUser({
    page: filters.page,
    count_per_page: filters.count_per_page,
    start_date: filters.start_date
      ? format(filters.start_date, "yyyy-MM-dd")
      : undefined,
    end_date: filters.end_date
      ? format(filters.end_date, "yyyy-MM-dd")
      : undefined,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getStatisticPaymentByUserDownload,
      params: {
        start_date: filters.start_date
          ? format(filters.start_date, "yyyy-MM-dd")
          : undefined,
        end_date: filters.end_date
          ? format(filters.end_date, "yyyy-MM-dd")
          : undefined,
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [
        "Date",
        "이메일",
        "닉네임",
        "결제 횟수",
        "결제 코인",
        "결제 금액",
        "결제 사용 횟수",
        "결제 사용량",
        "후원 횟수",
        "후원 코인",
      ],
      fields: [
        "date",
        "email",
        "nickname",
        "pay_count",
        "pay_coin",
        "pay_amount",
        "use_coin_count",
        "use_coin",
        "donation_count",
        "donation_coin",
      ],
      filename: "회원별 소비 내역",
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  const handleChangePage = (page: number) => {
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (filters: IGetStatisticPaymentByUserParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      start_date: undefined,
      end_date: undefined,
      search_target: "",
      search_word: "",
    });
  };
  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="회원별 소비 내역" />
        <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
          <div className="flex justify-between">
            <SearchDateNText
              options={[
                { value: "email", label: "이메일" },
                { value: "nickname", label: "닉네임" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
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
            page={filters.page || 1}
            setPage={handleChangePage}
            totalPages={calculatePageCount(
              data?.total_count || 0,
              filters.count_per_page || 8
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
