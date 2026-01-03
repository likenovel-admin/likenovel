"use client";
import { useGetAppliedPromotions } from "@/api/appliedPromotion";
import { IGetAppliedPromotionParams } from "@/api/appliedPromotion/dto";
import { AcceptPopup } from "@/app/promotions/apply-of-promotion/components/popup";
import AppliedPromotionTable from "@/app/promotions/apply-of-promotion/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculatePageCount } from "@/lib/utils";
import { IAppliedPromotion } from "@/types/appliedPromotion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [filters, setFilers] = useState<IGetAppliedPromotionParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });
  const [showAcceptPopup, setShowAcceptPopup] = useState<{
    open: boolean;
    data: IAppliedPromotion | null;
  }>({
    open: false,
    data: null,
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
      label: "신청",
      value: "apply",
    },
    {
      label: "철회",
      value: "cancel",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetAppliedPromotions({
    page: filters.page,
    count_per_page: filters.count_per_page,
    status: tab || undefined,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleOpenAcceptPopup = (data: IAppliedPromotion | null) => {
    setShowAcceptPopup({ open: true, data });
  };

  const handleCloseAcceptPopup = () => {
    setShowAcceptPopup({ open: false, data: null });
  };

  const handleChangePage = (page: number) => {
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (filters: IGetAppliedPromotionParams) => {
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
        <PageHeader title="신청 프로모션" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => {
                  route.push(
                    `/promotions/apply-of-promotion?tab=${item.value}`
                  );
                  handleOnReset();
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchText
              options={[
                { value: "product-title", label: "작품명" },
                { value: "author-name", label: "작가명" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button
              onClick={() => route.push("/promotions/apply-of-promotion/add")}
            >
              + 프로모션 추가
            </Button>
          </div>
          <AppliedPromotionTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
            handleOpenAcceptPopup={handleOpenAcceptPopup}
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
      {showAcceptPopup.open && (
        <AcceptPopup
          data={showAcceptPopup.data}
          close={() => handleCloseAcceptPopup()}
          refetch={() => {
            refetch();
          }}
        />
      )}
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
