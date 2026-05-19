"use client";

import {
  getDownloadProducts,
  useGetProducts,
} from "@/api/distributionProduct";
import { IGetProductParams } from "@/api/distributionProduct/dto";
import DistributionWorksTable from "@/app/products/distribution/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { productRatingsCode, productStatusCode } from "@/constants/product";
import { downloadExcel } from "@/lib/excelDownload";
import { isConfirmedEnter } from "@/lib/keyboard";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IProduct } from "@/types/product";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DistributionProductsPage() {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [filters, setFilters] = useState<IGetProductParams>({
    page: 1,
    count_per_page: item_per_page,
    contract_type: "",
    status_code: "",
    has_episode_apply_yn: "Y",
    search_target: "",
    search_word: "",
  });

  const { data, isLoading, isFetching } = useGetProducts({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
    contract_type: filters.contract_type || undefined,
    status_code: filters.status_code || undefined,
    has_episode_apply_yn: filters.has_episode_apply_yn || undefined,
  });

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      count_per_page: item_per_page,
    }));
  };

  const handleReset = () => {
    setFilters({
      page: 1,
      count_per_page: item_per_page,
      contract_type: "",
      status_code: "",
      has_episode_apply_yn: "Y",
      search_target: "",
      search_word: "",
    });
  };

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadProducts,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        contract_type: filters.contract_type || undefined,
        status_code: filters.status_code || undefined,
        has_episode_apply_yn: filters.has_episode_apply_yn || undefined,
      },
      headers: [
        "작품ID",
        "작품명",
        "작가명",
        "회차수",
        "계약 유형",
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
        "contract_type",
        "cp_company_name",
        (row: IProduct) =>
          row.created_date ? format(new Date(row.created_date), "yyyy.MM.dd") : "-",
        (row: IProduct) =>
          row.paid_open_date ? format(new Date(row.paid_open_date), "yyyy.MM.dd") : "-",
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
      filename: "유통작품 리스트",
      onStart: () => setIsDownloading(true),
      onFinish: () => setIsDownloading(false),
      onError: (error) => showAlert("오류", catchErrorMessage(error), "확인"),
    });
  };

  const totalPages = calculatePageCount(
    data?.total_count || 0,
    filters.count_per_page || item_per_page
  );

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="유통작품관리" />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.search_target || "none"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  search_target: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="검색 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안함</SelectItem>
                <SelectItem value="product-title">작품명</SelectItem>
                <SelectItem value="product-id">작품ID</SelectItem>
                <SelectItem value="author-name">작가명</SelectItem>
                <SelectItem value="cp-name">CP명</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.contract_type || "none"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  contract_type: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="계약 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">전체</SelectItem>
                <SelectItem value="normal">일반</SelectItem>
                <SelectItem value="cp">CP</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status_code || "none"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status_code: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="연재 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">전체</SelectItem>
                <SelectItem value="ongoing">연재중</SelectItem>
                <SelectItem value="rest">휴재</SelectItem>
                <SelectItem value="end">완결</SelectItem>
                <SelectItem value="stop">중단</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="w-[220px]"
              placeholder="검색어 입력"
              value={filters.search_word || ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  search_word: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (isConfirmedEnter(event)) handleSearch();
              }}
            />

            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
            <Button onClick={handleSearch}>검색</Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/products/distribution/upload?mode=create")}
            >
              신규작품생성
            </Button>
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
        </div>

        <DistributionWorksTable
          data={data?.results || []}
          loading={isLoading || isFetching}
        />

        <PaginationControls
          page={filters.page || 1}
          setPage={(page) =>
            setFilters((prev) => ({
              ...prev,
              page,
            }))
          }
          totalPages={totalPages}
        />

        <FullPageLoader isLoading={isDownloading || isLoading || isFetching} />
      </div>
    </SidebarInset>
  );
}
