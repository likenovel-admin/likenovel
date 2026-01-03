"use client";
import { useGetFaqs } from "@/api/faq";
import FaqsTable from "@/app/faqs/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";

import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);

  const tabs = [
    {
      label: "공지사항",
      value: "/notices",
    },
    {
      label: "FAQ",
      value: "/faqs",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetFaqs({
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
        <PageHeader title="공지 / FAQ" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 px-4">
              {tabs.map((item, index) => (
                <Button
                  key={`tab-${index}`}
                  variant={pathname == item.value ? "default" : "outline"}
                  onClick={() => route.push(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button onClick={() => route.push("/faqs/add")}>+ FAQ 추가</Button>
          </div>
          <FaqsTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
            currentPage={page || 1}
            pageSize={item_per_page || 8}
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
