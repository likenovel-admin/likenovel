"use client";
import {
  getDownloadProductContractOfferDeductions,
  useGetProductContractOfferDeductions,
} from "@/api/product-contract-offer-deduction";
import { IGetProductContractOfferDeductionParams } from "@/api/product-contract-offer-deduction/dto";
import DeductionDepositTable from "@/app/adjustments/deduction-of-deposit/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchDateNText } from "@/components/common/SearchDateNText";
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
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IProductContractOfferDeduction } from "@/types/product-contract-offer-deduction";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] =
    useState<IGetProductContractOfferDeductionParams>({
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
  } = useGetProductContractOfferDeductions({
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
      apiFn: getDownloadProductContractOfferDeductions,
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
        "작품ID",
        "작가명",
        "계약 id",
        "계약 유형",
        "담당CP",
        "발행계약금",
        "당월 계약금 잔액",
        "정산액",
        "정산 후 잔액",
      ],
      fields: [
        (row: IProductContractOfferDeduction) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "-",
        "title",
        "product_id",
        "author_nickname",
        "offer_id",
        "contract_type",
        "cp_company_name",
        "offer_amount",
        "current_offer_amount",
        "settlement_price",
      ],
      filename: "선계약금 차감 조회",
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

  const handleOnSearch = (filters: IGetProductContractOfferDeductionParams) => {
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
          title="선계약금 차감 조회"
          parent="매출 및 정산"
          child="선계약금 차감 조회"
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
          <DeductionDepositTable
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
