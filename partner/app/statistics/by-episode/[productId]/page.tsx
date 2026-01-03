"use client";
import {
  getDownloadProductEpisodeStatistics,
  useGetProductEpisodeStatistics,
} from "@/api/product-episode-statistics";
import { IGetProductEpisodeStatisticParams } from "@/api/product-episode-statistics/dto";
import ProductEpisodeStatisticsTable from "@/app/statistics/by-episode/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IProductEpisodeStatistic } from "@/types/product-episode-statistics";
import { format } from "date-fns";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Page() {
  const route = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const productId = Number(pathSegments[pathSegments.length - 1]);

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetProductEpisodeStatisticParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "product-id",
    search_word: productId.toString(),
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetProductEpisodeStatistics({
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
      apiFn: getDownloadProductEpisodeStatistics,
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
        "회차",
        "회차명",
        "유료여부",
        "담당 CP",
        "조회수",
        "추천수",
        "평가자 수",
        "총 수익",
        "조회수당 수익",
        "24시간 이내 조회수",
      ],
      fields: [
        (row: IProductEpisodeStatistic) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "-",
        "title",
        "product_id",
        "author_nickname",
        "author_id",
        "episode_no",
        "episode_title",
        "paid_yn",
        "cp_company_name",
        "count_hit",
        "count_recommend",
        "count_evaluation",
        "sum_total_sales_price",
        "sales_price_per_count_hit",
        "count_hit_in_24h",
      ],
      filename: "회차별 통계",
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

  const handleOnSearch = (filters: IGetProductEpisodeStatisticParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
    });
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="회차별 통계"
          parent="통계 분석"
          child="회차별 통계"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ProductEpisodeStatisticsTable
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

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
