"use client";

import { getDownloadProducts, useGetProducts } from "@/api/product";
import { IGetProductParams } from "@/api/product/dto";
import WorksTable from "@/app/products/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Search3TypeNText } from "@/components/common/Search3TypeNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { productRatingsCode, productStatusCode } from "@/constants/product";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IProduct } from "@/types/product";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetProductParams>({
    page: 1,
    count_per_page: item_per_page,
    contract_type: "",
    status_code: "",
    search_target: "",
    search_word: "",
  });

  const { data, refetch, isLoading: isLoadingData, isFetching } = useGetProducts({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
    contract_type: filters.contract_type || undefined,
    status_code: filters.status_code || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadProducts,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        contract_type: filters.contract_type || undefined,
        status_code: filters.status_code || undefined,
      },
      headers: [
        "작품ID",
        "작품명",
        "작가명",
        "회차수",
        "유형",
        "해당CP",
        "작품 등록일",
        "유료 전환일",
        "ISBN",
        "UCI",
        "연재 상태",
        "연령등급",
        "1차 장르",
        "2차 장르",
        "판매 상태",
        "독점 여부",
      ],
      fields: [
        "product_id",
        "title",
        "author_nickname",
        "count_episode",
        (row: IProduct) => (row.price_type === "paid" ? "유료" : "무료"),
        "cp_company_name",
        (row: IProduct) =>
          row.created_date ? format(new Date(row.created_date), "yyyy.MM.dd") : "-",
        (row: IProduct) =>
          row.paid_open_date
            ? format(new Date(row.paid_open_date), "yyyy.MM.dd")
            : "-",
        "isbn",
        "uci",
        (row: IProduct) =>
          row.status_code ? productStatusCode[row.status_code] : "",
        (row: IProduct) =>
          row.ratings_code ? productRatingsCode[row.ratings_code] : "",
        "primary_genre",
        "sub_genre",
        "price_type",
        (row: IProduct) => (row.monopoly_yn === "Y" ? "독점" : "비독점"),
      ],
      filename: "작품 리스트",
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

  const handleOnSearch = (searchFilters: IGetProductParams) => {
    setFilers(searchFilters);
  };

  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
      contract_type: "",
      status_code: "",
    });
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader
        title="작품 리스트"
        parent="작품 관리"
        child="작품 리스트"
      />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between gap-2 px-4">
          <Search3TypeNText
            options1={[
              { value: "product-title", label: "작품명" },
              { value: "product-id", label: "작품ID" },
              { value: "author-name", label: "작가명" },
              { value: "cp-name", label: "CP명" },
            ]}
            option2Placeholder="계약 유형"
            options2={[
              { value: "normal", label: "일반" },
              { value: "cp", label: "CP" },
            ]}
            option3Placeholder="연재 상태"
            options3={[
              { value: "ongoing", label: "연재중" },
              { value: "rest", label: "휴재중" },
              { value: "end", label: "완결" },
              { value: "stop", label: "연재중지" },
            ]}
            onSearch={handleOnSearch}
            onReset={handleOnReset}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => route.push("/products/upload?mode=create")}
            >
              신규작품생성
            </Button>
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
        </div>

        <WorksTable data={data?.results ?? []} loading={isLoadingData || isFetching} />

        <PaginationControls
          page={filters.page || 1}
          setPage={handleChangePage}
          totalPages={calculatePageCount(
            data?.total_count || 0,
            filters.count_per_page || 8
          )}
        />

        <FullPageLoader isLoading={isLoading || isLoadingData || isFetching} />
      </div>
    </SidebarInset>
  );
}
