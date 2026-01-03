"use client";
import {
  getDownloadProductStatistics,
  useGetProductStatistics,
} from "@/api/product-statistics";
import { IGetProductStatisticParams } from "@/api/product-statistics/dto";
import StatisticsTable from "@/app/statistics/DataTable";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IProductStatistic } from "@/types/product-statistics";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetProductStatisticParams>({
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
  } = useGetProductStatistics({
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
      apiFn: getDownloadProductStatistics,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [
        "Date",
        "작품명",
        "작품 ID",
        "작가명",
        "작가 ID",
        "회차수",
        "유료 여부",
        "담당CP",
        "조회수",
        "선호작 수",
        "선호 해제 수",
        "추천수",
        "평가자 수",
        "총 수익",
        "조회수당 수익",
        "CP 조회수",
        "연독률(%)",
      ],
      fields: [
        (row: IProductStatistic) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "-",
        "title",
        "product_id",
        "author_nickname",
        "author_id",
        "count_episode",
        // "price_type",
        (row: IProductStatistic) => (row.paid_yn === "Y" ? "CP유료" : "-"),
        "cp_company_name",
        "count_hit",
        "cp_company_name",
        "count_hit",
        "count_bookmark",
        "count_unbookmark",
        "count_recommend",
        "count_evaluation",
        "sum_total_sales_price",
        "sales_price_per_count_hit",
        "count_cp_hit",
        "reading_rate",
      ],
      filename: "작품별 통계",
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

  const handleOnSearch = (filters: IGetProductStatisticParams) => {
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
          title="작품별 통계"
          parent="통계 분석"
          child="작품별 통계"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchDateNText
              options={[
                { value: "product-title", label: "작품명" },
                { value: "product-id", label: "작품ID" },
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
