"use client";

import {
  getProductAiConsentsDownload,
  useGetProductAiConsents,
} from "@/api/productAiConsent";
import {
  IGetProductAiConsentParams,
  IProductAiConsentItem,
} from "@/api/productAiConsent/dto";
import ProductAiConsentTable from "@/app/products/ai-consent/DataTable";
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
import { downloadExcel } from "@/lib/excelDownload";
import { isConfirmedEnter } from "@/lib/keyboard";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { useState } from "react";

const yn = (value: "Y" | "N" | null | undefined) => (value === "Y" ? "Y" : "N");

export default function ProductAiConsentPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [filters, setFilters] = useState<IGetProductAiConsentParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });

  const { data, isLoading, isFetching } = useGetProductAiConsents({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters((prev) => ({
      ...prev,
      search_target: "",
      search_word: "",
      page: 1,
    }));
  };

  const handleDownloadExcel = async () => {
    await downloadExcel<IProductAiConsentItem>({
      apiFn: getProductAiConsentsDownload,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [
        "작품 ID",
        "작품명",
        "작가명",
        "이메일",
        "회차수",
        "작품 공개여부",
        "AI홍보",
        "웹소챗",
      ],
      fields: [
        "product_id",
        "title",
        (row) => row.nickname || "-",
        (row) => row.author_email || "-",
        "episode_count",
        (row) => yn(row.open_yn),
        (row) => yn(row.ai_promotion_yn),
        (row) => yn(row.websochat_enabled_yn),
      ],
      filename: "AI 활용 동의 현황",
      onStart: () => setIsDownloading(true),
      onFinish: () => setIsDownloading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  const totalPages = calculatePageCount(
    data?.total_count || 0,
    filters.count_per_page || item_per_page
  );

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="AI 활용 동의 현황" />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-4">
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
              <SelectItem value="product-id">작품 ID</SelectItem>
              <SelectItem value="product-title">작품명</SelectItem>
              <SelectItem value="nickname">작가명</SelectItem>
            </SelectContent>
          </Select>

          <Input
            className="w-[220px]"
            placeholder="검색어 입력"
            value={filters.search_word || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search_word: e.target.value }))
            }
            onKeyDown={(e) => {
              if (isConfirmedEnter(e)) handleSearch();
            }}
          />

          <Button variant="outline" onClick={handleReset}>
            초기화
          </Button>
          <Button onClick={handleSearch}>검색</Button>
          <Button
            variant="outline"
            onClick={handleDownloadExcel}
            disabled={isDownloading}
          >
            엑셀 다운로드
          </Button>
        </div>

        <ProductAiConsentTable
          data={data?.results || []}
          loading={isLoading || isFetching}
        />

        <PaginationControls
          page={filters.page || 1}
          setPage={(page) => setFilters((prev) => ({ ...prev, page }))}
          totalPages={totalPages}
        />

        <FullPageLoader isLoading={isLoading || isFetching || isDownloading} />
      </div>
    </SidebarInset>
  );
}
