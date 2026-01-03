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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { useGetBanners } from "@/api/banner";
import { item_per_page } from "@/constants/common";
import { useEffect, useState } from "react";
import { set } from "date-fns";
import FullPageLoader from "@/components/common/FullPageLoader";
import { calculatePageCount } from "@/lib/utils";
import PaginationControls from "@/components/common/PaginationControls";
import BannersTable from "@/app/banners/DataTable";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);

  const tabs = [
    {
      label: "배너",
      value: "/banners",
    },
    {
      label: "팝업",
      value: "/popups",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetBanners({
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
        <PageHeader title="배너 및 팝업 관리" />
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
            <Button onClick={() => route.push("/banners/add")}>
              + 배너 추가
            </Button>
          </div>
          <BannersTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
          />
          <PaginationControls
            page={page || 1}
            setPage={handleChangePage}
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
