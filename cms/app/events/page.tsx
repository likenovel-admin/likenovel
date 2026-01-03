"use client";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { item_per_page } from "@/constants/common";
import { useGetEvents } from "@/api/event";
import EventsTable from "@/app/events/DataTable";
import PaginationControls from "@/components/common/PaginationControls";
import { calculatePageCount } from "@/lib/utils";
import FullPageLoader from "@/components/common/FullPageLoader";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [page, setPage] = useState(1);

  const tabs = [
    {
      label: "전체",
      value: "all",
    },
    {
      label: "3화 감상",
      value: "view-3-times",
    },
    {
      label: "댓글 등록",
      value: "add-comment",
    },
    {
      label: "작품 등록",
      value: "add-product",
    },
    {
      label: "그 외",
      value: "etc",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetEvents({
    page: page,
    count_per_page: item_per_page,
    type: tab || undefined,
  });

  useEffect(() => {
    refetch();
  }, [page, tab]);

  const handleChangePage = (page: number) => {
    setPage(page);
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="이벤트 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 px-4">
              {tabs.map((item, index) => (
                <Button
                  key={`tab-${index}`}
                  variant={tab == item.value ? "default" : "outline"}
                  onClick={() => route.push(`/events?tab=${item.value}`)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button onClick={() => route.push("/events/add")}>
              + 이벤트 추가
            </Button>
          </div>
          <EventsTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
            currentPage={page || 1}
            pageSize={item_per_page}
            totalCount={data?.total_count ?? 0}
          />
          <PaginationControls
            page={page || 1}
            setPage={handleChangePage}
            totalPages={calculatePageCount(
              data?.total_count || 0,
              item_per_page || 8
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
