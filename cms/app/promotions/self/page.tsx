"use client";
import { useGetDirectPromotions } from "@/api/directPromotion";
import { IGetDirectPromotionParams } from "@/api/directPromotion/dto";
import DirectPromotionTable from "@/app/promotions/self/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculatePageCount } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [filters, setFilers] = useState<IGetDirectPromotionParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });

  const tabs = [
    {
      label: "전체",
      value: "all",
    },
    {
      label: "진행 중",
      value: "ing",
    },
    {
      label: "중지",
      value: "stop",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetDirectPromotions({
    page: filters.page,
    count_per_page: filters.count_per_page,
    status: tab || undefined,
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

  const handleOnSearch = (filters: IGetDirectPromotionParams) => {
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
        <PageHeader title="직접 프로모션" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => {
                  route.push(`/promotions/self?tab=${item.value}`);
                  handleOnReset();
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4">
            <SearchText
              options={[
                { value: "product-title", label: "작품명" },
                { value: "author-name", label: "작가명" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
          </div>
          <DirectPromotionTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
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

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
