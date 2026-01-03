"use client";
import {
  getDownloadMonthlySettlements,
  useGetMonthlySettlements,
} from "@/api/monthly-settlement";
import { IGetMonthlySettlementParams } from "@/api/monthly-settlement/dto";
import AdminMonthlySettlementTable, {
  AuthorCPMonthlySettlementTable,
} from "@/app/adjustments/monthly/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { MonthlySettlementItemType } from "@/constants/monthly-settlement";
import { useProfile } from "@/hooks/useProfile";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IMonthlySettlement } from "@/types/monthly-settlement";
import { format } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AdminPage() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetMonthlySettlementParams>({
    page: 1,
    count_per_page: item_per_page,
    search_start_date: "",
    search_end_date: "",
    search_target: "",
    search_word: "",
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetMonthlySettlements({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
    search_start_date: filters.search_start_date
      ? format(filters.search_start_date, "yyyy-MM-dd")
      : undefined,
    search_end_date: filters.search_end_date
      ? format(filters.search_end_date, "yyyy-MM-dd")
      : undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadMonthlySettlements,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        search_start_date: filters.search_start_date
          ? format(filters.search_start_date, "yyyy-MM-dd")
          : undefined,
        search_end_date: filters.search_end_date
          ? format(filters.search_end_date, "yyyy-MM-dd")
          : undefined,
      },
      headers: [
        "작가/CP명",
        "Date",
        "매출 구분",
        "결제 OS",
        "매출액",
        "결제 수수료",
        "순 매출액",
        "공급가액",
        "부가세액",
        "정산액",
        "플랫폼 수익",
      ],
      fields: [
        // "created_date",
        (row: IMonthlySettlement) => row.author_name || row.cp_name,
        (row: IMonthlySettlement) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM")
            : "-",
        // "item_type",
        (row: IMonthlySettlement) =>
          row.item_type ? MonthlySettlementItemType[row.item_type] : "",
        "device_type",
        "sum_total_sales_price",
        "fee",
        "net_sales_price",
        "taxable_price",
        "vat_price",
        "settlement_price",
        "platform_revenue",
      ],
      filename: "일별 이용권 상세",
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

  const handleOnSearch = (filters: IGetMonthlySettlementParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
      search_start_date: "",
      search_end_date: "",
    });
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="월별 정산" parent="매출 및 정산" child="월별 정산" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchDateNText
              options={[
                { value: "author-name", label: "작가명" },
                { value: "cp-name", label: "CP명" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <AdminMonthlySettlementTable
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

function AuthorPage() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetMonthlySettlements({
    page,
    count_per_page: item_per_page,
    search_start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    search_end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
  });

  useEffect(() => {
    refetch();
  }, [page, startDate, endDate]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadMonthlySettlements,
      params: {
        search_start_date: startDate
          ? format(startDate, "yyyy-MM-dd")
          : undefined,
        search_end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      },
      headers: [
        "Date",
        "매출 구분",
        "결제 OS",
        "매출액",
        "결제 수수료",
        "순 매출액",
        "공급가액",
        "부가세액",
        "정산액",
        "플랫폼 수익",
      ],
      fields: [
        (row: IMonthlySettlement) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM")
            : "-",
        // "item_type",
        (row: IMonthlySettlement) =>
          row.item_type ? MonthlySettlementItemType[row.item_type] : "",
        "device_type",
        "sum_total_sales_price",
        "fee",
        "net_sales_price",
        "taxable_price",
        "vat_price",
        "settlement_price",
        "platform_revenue",
      ],
      filename: "일별 이용권 상세",
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
        <PageHeader title="월별 정산" parent="매출 및 정산" child="월별 정산" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
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
          <AuthorCPMonthlySettlementTable
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

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isInitialized } = useProfile();

  if (!isInitialized) {
    return <FullPageLoader isLoading={true} />;
  }

  if (isAdmin) {
    return <AdminPage />;
  } else {
    return <AuthorPage />;
  }
}

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
