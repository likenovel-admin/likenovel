"use client";
import {
  getDownloadCartAnalysiss,
  useGetCartAnalysiss,
} from "@/api/cart-analysis";
import { IGetCartAnalysisParams } from "@/api/cart-analysis/dto";
import CartsTable from "@/app/statistics/cart/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Search2TypeNText } from "@/components/common/Search2TypeNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetCartAnalysisParams>({
    page: 1,
    count_per_page: item_per_page,
    type: "",
    search_target: "",
    search_word: "",
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetCartAnalysiss({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
    type: filters.type || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadCartAnalysiss,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        type: filters.type || undefined,
      },
      headers: [
        "작품명",
        "연관작품1",
        "연관작품2",
        "연관작품3",
        "연관작품4",
        "연관작품5",
        "연관작품6",
        "연관작품7",
        "연관작품8",
        "연관작품9",
        "연관작품10",
      ],
      fields: [
        "title",
        "relative_1_product_title",
        "relative_2_product_title",
        "relative_3_product_title",
        "relative_4_product_title",
        "relative_5_product_title",
        "relative_6_product_title",
        "relative_7_product_title",
        "relative_8_product_title",
        "relative_9_product_title",
        "relative_10_product_title",
      ],
      filename: "장바구니 분석",
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

  const handleOnSearch = (filters: IGetCartAnalysisParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
      type: "",
    });
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="장바구니 분석"
          parent="통계 분석"
          child="장바구니 분석"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <Search2TypeNText
              options1={[{ value: "product-title", label: "작품명" }]}
              options2={[
                { value: "bookmark", label: "북마크" },
                { value: "tag", label: "태그" },
                { value: "similar-user", label: "비슷한 이용자" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            {/* <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button> */}
          </div>
          <CartsTable
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
