"use client";
import { useGetDirectRecommends } from "@/api/directRecommend";
import DirectRecommendTable from "@/app/exposure-accounts/direct-recommend/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [page, setPage] = useState(1);

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetDirectRecommends({
    page: page,
    count_per_page: item_per_page,
  });

  useEffect(() => {
    refetch();
  }, [page]);

  const handleChangePage = (page: number) => {
    setPage(page);
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4"></div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <h1>직접 추천구좌 관리</h1>
          <div className="flex items-center gap-2 px-4 justify-end">
            <Button
              onClick={() =>
                route.push("/exposure-accounts/direct-recommend/add")
              }
            >
              + 추천구좌 추가
            </Button>
          </div>
          <DirectRecommendTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
          />
          <PaginationControls
            page={page}
            setPage={handleChangePage}
            totalPages={calculatePageCount(data?.total_count || 0, 8)}
          />
          <FullPageLoader isLoading={isLoadingData || isFetching} />
        </div>
      </SidebarInset>
    </>
  );
}
