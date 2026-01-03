"use client";

import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import ApplyTable from "@/app/users/apply-of-qualification/ApplyTable";
import PaginationControls from "@/components/common/PaginationControls";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useGetApplyRole } from "@/api/applyRole";
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";

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
      label: "대기중",
      value: "waiting",
    },
    {
      label: "처리 완료",
      value: "completed",
    },
    {
      label: "편집자 신청",
      value: "editor",
    },
    {
      label: "CP 신청",
      value: "cp",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetApplyRole({
    page: page,
    count_per_page: item_per_page,
    status: tab || undefined,
  });

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="자격 신청 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() =>
                  route.push(`/users/apply-of-qualification?tab=${item.value}`)
                }
              >
                {item.label}
              </Button>
            ))}
          </div>
          <ApplyTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
          />
          <PaginationControls
            page={page || 1}
            setPage={setPage}
            totalPages={calculatePageCount(
              data?.total_count || 0,
              item_per_page
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
