"use client";
import {
  getDownloadSaleByEpisodeDetail,
  useGetSaleByEpisodeDetail,
} from "@/api/sales-by-episode";
import { IGetSaleByEpisodeParams } from "@/api/sales-by-episode/dto";
import SaleByEpisodesTable from "@/app/sales/episodes/[episodeId]/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { downloadExcelWith2Header } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const params = useParams();
  const episodeId = Array.isArray(params.episodeId)
    ? params.episodeId[0]
    : params.episodeId;

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetSaleByEpisodeParams>({
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
  } = useGetSaleByEpisodeDetail(episodeId || "", {
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
    await downloadExcelWith2Header({
      apiFn: getDownloadSaleByEpisodeDetail,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        search_start_date: filters.search_start_date
          ? format(filters.search_start_date, "yyyy-MM-dd")
          : undefined,
        search_end_date: filters.search_end_date
          ? format(filters.search_end_date, "yyyy-MM-dd")
          : undefined,
        id: episodeId || "",
      },
      headers: [
        [
          "Date",
          "작품명",
          "작품 ID",
          "작가명",
          "회차",
          "회차명",
          "계약 유형",
          "사업자",
          "판매시작일",
          "총 판매",
          "",
          "일반 판매",
          "",
          "할인 판매",
          "",
          "구입 대여권",
          "",
          "무상 대여권",
          "",
          "무료 대여권",
          "",
          "구매 취소",
          "",
        ],
        [
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "건수",
          "총액",
          "건수",
          "총액",
          "건수",
          "총액",
          "건수",
          "총액",
          "건수",
          "총액",
          "건수",
          "총액",
          "건수",
          "총액",
        ],
      ],
      fields: [
        "created_date",
        "title",
        "product_id",
        "author_nickname",
        "episode_no",
        "episode_title",
        "contract_type",
        "cp_company_name",
        "paid_open_date",

        "count_total_sales",
        "sum_total_sales_price",
        "count_normal_sales",
        "sum_normal_price",
        "count_discount_sales",
        "sum_discount_price",
        "count_paid_ticket_sales",
        "sum_paid_ticket_price",
        "count_comped_ticket_sales",
        "sum_comped_ticket_price",
        "count_free_ticket_sales",
        "sum_free_ticket_price",
        "count_total_refund",
        "sum_total_refund_price",
      ],
      filename: "회차별 매출",
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

  const handleOnSearch = (filters: IGetSaleByEpisodeParams) => {
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
          title="회차별 매출"
          parent="매출 및 정산"
          child="회차별 매출"
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
          <SaleByEpisodesTable
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
