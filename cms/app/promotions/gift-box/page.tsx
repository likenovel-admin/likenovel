"use client";

import { useGetUserGiftBooks } from "@/api/userGiftBook";
import { IGetUserGiftBookParams } from "@/api/userGiftBook/dto";
import UserGiftTable from "@/app/promotions/gift-box/DataTable";
import GiftByProduct from "@/app/promotions/gift-box/GiftByProduct";
import GiftByUser from "@/app/promotions/gift-box/GiftByUser";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";
import { useEffect, useState } from "react";

type Tab = "list" | "byProduct" | "byUser";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("list");
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
    setFilers({ ...filters, page });
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
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="선물함" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "list" ? "default" : "outline"}
            onClick={() => setActiveTab("list")}
          >
            선물함 목록
          </Button>
          <Button
            variant={activeTab === "byProduct" ? "default" : "outline"}
            onClick={() => setActiveTab("byProduct")}
          >
            작품별 지급
          </Button>
          <Button
            variant={activeTab === "byUser" ? "default" : "outline"}
            onClick={() => setActiveTab("byUser")}
          >
            유저별 지급
          </Button>
        </div>

        {activeTab === "list" && (
          <>
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
              refetch={() => refetch()}
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
          </>
        )}

        {activeTab === "byProduct" && <GiftByProduct />}
        {activeTab === "byUser" && <GiftByUser />}
      </div>
    </SidebarInset>
  );
}
