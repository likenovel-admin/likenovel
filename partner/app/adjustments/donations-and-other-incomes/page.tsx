"use client";
import {
  getDownloadIncomeSettlements,
  useGetIncomeSettlements,
  useGetIncomeSettlementSummary,
} from "@/api/income-settlement";
import { IGetIncomeSettlementParams } from "@/api/income-settlement/dto";
import AdminDonationTable, {
  AuthorDonationTable,
} from "@/app/adjustments/donations-and-other-incomes/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { item_per_page } from "@/constants/common";
import { incomeSettlementItemType } from "@/constants/income-settlement";
import { useProfile } from "@/hooks/useProfile";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import {
  IIncomeSettlement,
  IIncomeSettlementSummary,
} from "@/types/income-settlement";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ReactDatePicker from "react-datepicker";

function AdminPage() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetIncomeSettlementParams>({
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
  } = useGetIncomeSettlements({
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
      apiFn: getDownloadIncomeSettlements,
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
        "Date",
        "작가명",
        "후원 구분",
        "금액",
        "결제 및 서비스 수수료",
        "제외 후 금액",
        "원천징수 세금",
        "최종 정산액",
        "누적 후원 수익",
        "누적 기타 수익",
        "정산 가능액",
        "정산 완료액",
      ],
      fields: [
        (row: IIncomeSettlement) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "",
        "author_name",
        (row: IIncomeSettlement) =>
          row.item_type ? incomeSettlementItemType[row.item_type] : "",
        "sum_income_price",
        (row: IIncomeSettlement) => (row.total_fee_rate || 0) + "%",
        "sum_income_price_exclude_fee",
        "withholding_tax_rate",
        "sum_income_price_final",
        "sum_donation_price",
        "sum_etc_income_price",
        "enable_settlement",
        "settled_price",
      ],
      filename: "후원 및 기타 정산",
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

  const handleOnSearch = (filters: IGetIncomeSettlementParams) => {
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
        <PageHeader
          title="후원 및 기타 정산"
          parent="후원 및 기타 수익"
          child="후원 및 기타 정산"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchDateNText
              options={[{ value: "author-name", label: "작가명" }]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <AdminDonationTable
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

const defaultSummary: IIncomeSettlementSummary = {
  current: {
    sponsorship: {
      web: {
        sum_income_price: 0,
        total_fee_rate: 0,
        sum_income_price_exclude_fee: 0,
        withholding_tax_rate: 0,
        sum_income_price_final: 0,
      },
      ios: {
        sum_income_price: 0,
        total_fee_rate: 0,
        sum_income_price_exclude_fee: 0,
        withholding_tax_rate: 0,
        sum_income_price_final: 0,
      },
      playstore: {
        sum_income_price: 0,
        total_fee_rate: 0,
        sum_income_price_exclude_fee: 0,
        withholding_tax_rate: 0,
        sum_income_price_final: 0,
      },
      onestore: {
        sum_income_price: 0,
        total_fee_rate: 0,
        sum_income_price_exclude_fee: 0,
        withholding_tax_rate: 0,
        sum_income_price_final: 0,
      },
    },
    ad: {
      sum_income_price: 0,
      total_fee_rate: 0,
      sum_income_price_exclude_fee: 0,
      withholding_tax_rate: 0,
      sum_income_price_final: 0,
    },
  },
  accumulated: {
    income_sponsorship: 0,
    income_etc: 0,
    enable_settlement_price: 0,
    completed_settlement_price: 0,
  },
};

function AuthorPage() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [searchMonth, setSearchMonth] = useState<Date | undefined>(new Date());

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetIncomeSettlementSummary({
    search_month: searchMonth ? format(searchMonth, "yyyy-MM") : undefined,
  });

  useEffect(() => {
    refetch();
  }, [searchMonth]);

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="후원 및 기타 정산"
          parent="후원 및 기타 수익"
          child="후원 및 기타 정산"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            <ReactDatePicker
              selected={searchMonth}
              onChange={(date) => setSearchMonth(date || undefined)}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              showFullMonthYearPicker
              showFourColumnMonthYearPicker
              className="border px-3 py-2 rounded text-sm w-[140px]"
            />
          </div>
          <AuthorDonationTable data={data ?? defaultSummary} />
          <FullPageLoader isLoading={isLoadingData || isFetching} />
        </div>
      </SidebarInset>
    </>
  );
}

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const { isAdmin } = useProfile();

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
