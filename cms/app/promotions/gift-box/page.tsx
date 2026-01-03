"use client";
import { useGetUserGiftBooks } from "@/api/userGiftBook";
import { IGetUserGiftBookParams } from "@/api/userGiftBook/dto";
import UserGiftTable from "@/app/promotions/gift-box/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
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
import PageHeader from "@/components/ui/page-header";
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
import { item_per_page } from "@/constants/common";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculatePageCount } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [filters, setFilers] = useState<IGetUserGiftBookParams>({
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
  } = useGetUserGiftBooks({
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

  const handleOnSearch = (filters: IGetUserGiftBookParams) => {
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
        <PageHeader title="선물함" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            <SearchText
              options={[{ value: "email", label: "이메일" }]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
          </div>
          <UserGiftTable
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
