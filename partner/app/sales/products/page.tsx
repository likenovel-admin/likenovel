"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SalesPopup } from "./components/popup";
import { IGetMonthlySaleByProductParams } from "@/api/monthly-sales-by-product/dto";
import { item_per_page } from "@/constants/common";
import {
  getDownloadMonthlySaleByProducts,
  useGetMonthlySaleByProducts,
} from "@/api/monthly-sales-by-product";
import { format } from "date-fns";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IMonthlySaleByProduct } from "@/types/monthly-sales-by-product";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import MonthlySaleByProductsTable from "@/app/sales/products/DataTable";
import PaginationControls from "@/components/common/PaginationControls";
import FullPageLoader from "@/components/common/FullPageLoader";
import PageHeader from "@/components/ui/page-header";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [salesPopupProductId, setSalesPopupProductId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetMonthlySaleByProductParams>({
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
  } = useGetMonthlySaleByProducts({
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
      apiFn: getDownloadMonthlySaleByProducts,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [
        "Date",
        "작품명",
        "작품 ID",
        "작가명",
        "계약 유형",
        "담당 CP",
        "판매 시작일",
        "ISBN",
        "UCI",
        "정가",
        "판매가",
        "총 매출",
        "총 정산액",
      ],
      fields: [
        (row: IMonthlySaleByProduct) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM")
            : "-",
        "title",
        "id",
        "author_nickname",
        "contract_type",
        "cp_company_name",
        (row: IMonthlySaleByProduct) =>
          row.paid_open_date
            ? format(new Date(row.paid_open_date), "yyyy.MM.dd")
            : "-",
        "isbn",
        "uci",
        "series_regular_price",
        "sale_price",
        "gross_total_price",
        "settlement_price",
      ],
      filename: "작품별 월매출",
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

  const handleOnSearch = (filters: IGetMonthlySaleByProductParams) => {
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
          title="작품별 월매출"
          parent="매출 및 정산"
          child="작품별 월매출"
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
          <MonthlySaleByProductsTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            onEdit={(id: string) => setSalesPopupProductId(id)}
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
      {salesPopupProductId != "" && (
        <SalesPopup
          productId={salesPopupProductId}
          close={() => setSalesPopupProductId("")}
        />
      )}
    </>
  );
}
