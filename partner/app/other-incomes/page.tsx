"use client";
import {
  getDownloadIncomeRecodes,
  useGetIncomeRecodes,
} from "@/api/income-recodes";
import { IGetIncomeRecodeParams } from "@/api/income-recodes/dto";
import OtherInComesTable from "@/app/other-incomes/DataTable";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IIncomeRecode } from "@/types/income-recodes";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetIncomeRecodeParams>({
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
  } = useGetIncomeRecodes({
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
      apiFn: getDownloadIncomeRecodes,
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
        "작품명",
        "작품 ID",
        "작가명",
        "작가 ID",
        "수익 내역",
        "금액",
      ],
      fields: [
        (row: IIncomeRecode) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "-",
        "title",
        "product_id",
        "author_nickname",
        "author_id",
        (row: IIncomeRecode) =>
          row.item_type ? incomeSettlementItemType[row.item_type] : "",
        "sum_income_price",
      ],
      filename: "기타 수익 내역",
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

  const handleOnSearch = (filters: IGetIncomeRecodeParams) => {
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
          title="기타 수익 내역"
          parent="후원 및 기타 수익"
          child="기타 수익 내역"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchDateNText
              options={[
                { value: "product-title", label: "작품명" },
                { value: "product-id", label: "작품ID" },
                { value: "author-name", label: "작가명" },
                { value: "sponsor-name", label: "후원자" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <OtherInComesTable
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
