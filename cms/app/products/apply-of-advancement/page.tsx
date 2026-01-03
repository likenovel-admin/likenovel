"use client";
import { useGetApplyRank } from "@/api/applyRank";
import { IGetApplyRankParams } from "@/api/applyRank/dto";
import ApplyRankTable from "@/app/products/apply-of-advancement/ApplyRankTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetApplyRankParams>({
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
      label: "일반 승급신청",
      value: "rank-up",
    },
    {
      label: "유료 전환",
      value: "paid",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetApplyRank({
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

  const handleOnSearch = (filters: IGetApplyRankParams) => {
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
        <PageHeader title="승급 신청 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => {
                  route.push(
                    `/products/apply-of-advancement?tab=${item.value}`
                  );
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
                { value: "writer-name", label: "작가명" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
          </div>
          <ApplyRankTable
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
