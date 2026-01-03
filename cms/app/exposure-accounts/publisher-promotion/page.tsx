"use client";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { item_per_page } from "@/constants/common";
import { useGetPublisherPromotions } from "@/api/publisherPromotion";
import { IGetPublisherPromotionParams } from "@/api/publisherPromotion/dto";
import { SearchText } from "@/components/common/SearchText";
import PublisherPromotionTable from "@/app/exposure-accounts/publisher-promotion/PublisherPromotionTable";
import PaginationControls from "@/components/common/PaginationControls";
import { calculatePageCount } from "@/lib/utils";
import FullPageLoader from "@/components/common/FullPageLoader";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [filters, setFilers] = useState<IGetPublisherPromotionParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetPublisherPromotions({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleChangePage = (page: number) => {
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (filters: IGetPublisherPromotionParams) => {
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
        <PageHeader title="출판사 프로모션 구좌 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchText
              options={[
                { value: "author-name", label: "작가명" },
                { value: "product-title", label: "작품명" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button
              onClick={() =>
                route.push("/exposure-accounts/publisher-promotion/add")
              }
            >
              + 작품 추가
            </Button>
          </div>
          <PublisherPromotionTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
            currentPage={filters.page || 1}
            pageSize={filters.count_per_page || 8}
            totalCount={data?.total_count ?? 0}
          />
          <PaginationControls
            page={filters.page || 1}
            setPage={handleChangePage}
            totalPages={calculatePageCount(
              data?.total_count || 0,
              filters.count_per_page || 8
            )}
          />
          <FullPageLoader isLoading={isLoadingData || isFetching} />
        </div>
      </SidebarInset>
    </>
  );
}
